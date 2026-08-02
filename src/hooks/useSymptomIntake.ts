// Ported from src/hooks/useSymptomIntake.js (Web) — same state machine
// (idle -> loading-questions -> questions/no-questions -> submitting ->
// result), same resumable-state cache pattern (module-level variable,
// survives remounts within the app session but not a cold start).
//
// Deliberately omitted vs. Web:
// - DOM scrollIntoView/prefers-reduced-motion (browser-only; the screen
//   scrolls its own list/ScrollView instead).
// - sessionStorage symptom prefill from the landing page's quick-prompt
//   chips — mobile has no such entry point yet, so there is nothing to
//   read a prefill from. Revisit if a mobile equivalent is added.
// - trackUxEvent analytics call — no analytics service exists in this repo yet.
import { useEffect, useState } from "react";

import { symptomAnalysisApi } from "@/src/services/symptomAnalysisService";
import {
  buildClinicalQuestionAnswerItems,
  isClinicalQuestionAnswered,
  readSuggestClinicalQuestionsPayload,
  unwrapApiData,
} from "@/src/utils/clinicalQuestions";
import { ApiError } from "@/src/api/client";
import { AnswerValue, ClinicalAnalysisResult, ClinicalQuestion } from "@/src/types/symptomAnalysis";

const RESUMABLE_STATUSES = new Set(["idle", "questions", "no-questions", "result"]);

export type IntakeStatus = "idle" | "loading-questions" | "questions" | "no-questions" | "submitting" | "result";

type IntakeState = {
  input: string;
  sessionId: string;
  questions: ClinicalQuestion[];
  answers: Record<string, AnswerValue>;
  currentQuestionIndex: number;
  result: ClinicalAnalysisResult | null;
  status: IntakeStatus;
};

let intakeStateCache: IntakeState | null = null;

function getRecommendationErrorMessage(apiError: unknown) {
  const error = apiError as ApiError | undefined;
  const technicalMessage = String(error?.message ?? "");
  const isUpstreamAnalysisFailure =
    error?.status === 502 || /medgemma|analysis failed|parse.*json|json.*response/i.test(technicalMessage);

  if (isUpstreamAnalysisFailure) {
    return "Dịch vụ AI chưa thể tạo gợi ý chuyên khoa lần này. Vui lòng thử lại sau ít phút.";
  }

  return technicalMessage || "Không thể gửi câu trả lời. Vui lòng thử lại.";
}

function writeStoredIntakeState(state: IntakeState) {
  const hasMeaningfulState = Boolean(
    state.input?.trim() || state.sessionId || state.questions.length || state.result || state.status !== "idle",
  );
  intakeStateCache = hasMeaningfulState ? state : null;
}

function readInitialIntakeState(): IntakeState {
  const stored = intakeStateCache;
  const questions = Array.isArray(stored?.questions) ? stored.questions : [];
  const result = stored?.result ?? null;
  const status = stored && RESUMABLE_STATUSES.has(stored.status) ? stored.status : "idle";
  const currentQuestionIndex = Math.max(
    0,
    Math.min(Number(stored?.currentQuestionIndex) || 0, Math.max(questions.length - 1, 0)),
  );

  return {
    input: stored?.input || "",
    sessionId: stored?.sessionId || "",
    questions,
    answers: stored?.answers && typeof stored.answers === "object" ? stored.answers : {},
    currentQuestionIndex,
    result,
    status: (status === "result" && !result) || (status === "questions" && questions.length === 0) ? "idle" : status,
  };
}

type UseSymptomIntakeOptions = {
  onResult?: (payload: { input: string; result: ClinicalAnalysisResult; sessionId: string }) => void;
};

export function useSymptomIntake({ onResult }: UseSymptomIntakeOptions = {}) {
  const [initialState] = useState(readInitialIntakeState);
  const [input, setInput] = useState(initialState.input);
  const [sessionId, setSessionId] = useState(initialState.sessionId);
  const [questions, setQuestions] = useState<ClinicalQuestion[]>(initialState.questions);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialState.answers);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialState.currentQuestionIndex);
  const [result, setResult] = useState<ClinicalAnalysisResult | null>(initialState.result);
  const [status, setStatus] = useState<IntakeStatus>(initialState.status);
  const [error, setError] = useState("");

  const loading = status === "loading-questions" || status === "submitting";
  const answeredCount = questions.filter((question) =>
    isClinicalQuestionAnswered(question, answers[question.questionId]),
  ).length;
  const canSubmitAnswers = questions.length > 0 && answeredCount === questions.length && status !== "submitting";

  useEffect(() => {
    writeStoredIntakeState({ input, sessionId, questions, answers, currentQuestionIndex, result, status });
  }, [answers, currentQuestionIndex, input, questions, result, sessionId, status]);

  function resetDiagnosis({ clearInput = false }: { clearInput?: boolean } = {}) {
    setError("");
    setResult(null);
    setQuestions([]);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setSessionId("");
    setStatus("idle");
    if (clearInput) setInput("");
  }

  async function startDiagnosis(textOverride?: string) {
    const symptom = (textOverride ?? input).trim();
    if (!symptom || loading) return;
    setError("");
    setResult(null);
    setQuestions([]);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setSessionId("");
    setStatus("loading-questions");

    try {
      const response = await symptomAnalysisApi.suggestClinicalQuestions(symptom);
      const data = readSuggestClinicalQuestionsPayload(response);
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setStatus(data.questions.length ? "questions" : "no-questions");
    } catch (apiError) {
      setError((apiError as Error)?.message || "Không thể tạo câu hỏi làm rõ. Vui lòng thử lại.");
      setStatus("idle");
    }
  }

  async function submitAnswers() {
    if (!canSubmitAnswers) return;
    setError("");
    setStatus("submitting");
    try {
      const payload = buildClinicalQuestionAnswerItems(questions, answers);
      const recommendationResponse = await symptomAnalysisApi.submitClinicalQuestionAnswers(sessionId, payload);
      const recommendation = (unwrapApiData<Record<string, unknown>>(recommendationResponse) ?? {}) as Record<string, unknown>;
      const completedResult: ClinicalAnalysisResult = {
        recommendedDepartment: (recommendation.recommendedDepartment ?? recommendation.RecommendedDepartment ?? null) as ClinicalAnalysisResult["recommendedDepartment"],
        recommendedFacilities: Array.isArray(recommendation.recommendedFacilities)
          ? recommendation.recommendedFacilities
          : Array.isArray(recommendation.RecommendedFacilities)
            ? (recommendation.RecommendedFacilities as ClinicalAnalysisResult["recommendedFacilities"])
            : [],
      };
      writeStoredIntakeState({ input, sessionId, questions, answers, currentQuestionIndex, result: completedResult, status: "result" });
      setResult(completedResult);
      setStatus("result");
      onResult?.({ input, result: completedResult, sessionId });
    } catch (apiError) {
      setError(getRecommendationErrorMessage(apiError));
      setStatus("questions");
    }
  }

  function updateAnswer(questionId: string, answer: AnswerValue) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  return {
    answeredCount,
    answers,
    canSubmitAnswers,
    currentQuestionIndex,
    error,
    input,
    loading,
    questions,
    resetDiagnosis,
    result,
    sessionId,
    setCurrentQuestionIndex,
    setInput,
    startDiagnosis,
    status,
    submitAnswers,
    updateAnswer,
  };
}
