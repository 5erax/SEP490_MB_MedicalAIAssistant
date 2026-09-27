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
import { useCallback, useEffect, useRef, useState } from "react";

import { readResultPayload, symptomAnalysisApi, unwrapApiData } from "@/src/services/symptomAnalysisService";
import {
  buildClinicalQuestionAnswerItems,
  isClinicalQuestionAnswered,
  readSuggestClinicalQuestionsPayload,
} from "@/src/utils/clinicalQuestions";
import { ApiError } from "@/src/api/client";
import { AnswerValue, ClinicalAnalysisResult, ClinicalQuestion } from "@/src/types/symptomAnalysis";

const RESUMABLE_STATUSES = new Set(["idle", "questions", "no-questions", "result"]);
const RESULT_POLL_INTERVAL_MS = 300;
const RESULT_POLL_TIMEOUT_MS = 3 * 60 * 1000;
const RESULT_POLL_TIMEOUT_MESSAGE = "AI đang xử lý, vui lòng quay lại sau";

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

function readSessionStatus(response: unknown) {
  const data = unwrapApiData<Record<string, unknown>>(response) ?? {};
  return String(data.status ?? data.Status ?? "").trim().toLowerCase();
}

function readSessionId(response: unknown, fallbackSessionId: string) {
  const data = unwrapApiData<Record<string, unknown>>(response) ?? {};
  return String(data.sessionId ?? data.SessionId ?? fallbackSessionId ?? "").trim();
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("aborted"));
      return;
    }

    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("aborted"));
      },
      { once: true },
    );
  });
}

function isAbortError(error: unknown) {
  return (error as Error | undefined)?.message === "aborted";
}

function shouldContinuePollingAfterError(error: unknown) {
  const status = (error as ApiError | undefined)?.status;
  if (status === 400 || status === 404) return false;
  return !status || status >= 500;
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
  const pollingAbortRef = useRef<AbortController | null>(null);

  const loading = status === "loading-questions" || status === "submitting";
  const answeredCount = questions.filter((question) =>
    isClinicalQuestionAnswered(question, answers[question.questionId]),
  ).length;
  const canSubmitAnswers = questions.length > 0 && answeredCount === questions.length && status !== "submitting";

  useEffect(() => {
    writeStoredIntakeState({ input, sessionId, questions, answers, currentQuestionIndex, result, status });
  }, [answers, currentQuestionIndex, input, questions, result, sessionId, status]);

  const stopPolling = useCallback(() => {
    pollingAbortRef.current?.abort();
    pollingAbortRef.current = null;
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const pollClinicalResult = useCallback(async (pollSessionId: string, signal: AbortSignal) => {
    const startedAt = Date.now();

    while (!signal.aborted) {
      if (Date.now() - startedAt >= RESULT_POLL_TIMEOUT_MS) {
        throw new Error(RESULT_POLL_TIMEOUT_MESSAGE);
      }

      let response: unknown;
      try {
        response = await symptomAnalysisApi.get(pollSessionId, { signal });
      } catch (pollError) {
        if (signal.aborted || isAbortError(pollError)) throw pollError;
        if (!shouldContinuePollingAfterError(pollError)) throw pollError;
        await delay(RESULT_POLL_INTERVAL_MS, signal);
        continue;
      }

      const sessionStatus = readSessionStatus(response);

      if (sessionStatus === "completed") {
        const completedResult = readResultPayload(response) ?? {
          diagnoses: [],
          recommendedDepartment: null,
          recommendedFacilities: [],
        };
        await symptomAnalysisApi.cacheClinicalResult(pollSessionId, completedResult);
        return completedResult;
      }

      if (sessionStatus === "failed") {
        throw new Error("Không thể tạo gợi ý chuyên khoa. Vui lòng thử lại.");
      }

      await delay(RESULT_POLL_INTERVAL_MS, signal);
    }

    throw new Error("aborted");
  }, []);

  function resetDiagnosis({ clearInput = false }: { clearInput?: boolean } = {}) {
    stopPolling();
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
    stopPolling();
    setError("");
    setStatus("submitting");
    const controller = new AbortController();
    pollingAbortRef.current = controller;
    try {
      const payload = buildClinicalQuestionAnswerItems(questions, answers);
      const recommendationResponse = await symptomAnalysisApi.submitClinicalQuestionAnswers(sessionId, payload);
      const nextSessionId = readSessionId(recommendationResponse, sessionId);
      setSessionId(nextSessionId);
      const completedResult = await pollClinicalResult(nextSessionId, controller.signal);
      if (controller.signal.aborted) return;
      pollingAbortRef.current = null;
      writeStoredIntakeState({ input, sessionId: nextSessionId, questions, answers, currentQuestionIndex, result: completedResult, status: "result" });
      setResult(completedResult);
      setStatus("result");
      onResult?.({ input, result: completedResult, sessionId: nextSessionId });
    } catch (apiError) {
      if (controller.signal.aborted || isAbortError(apiError)) return;
      pollingAbortRef.current = null;
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
