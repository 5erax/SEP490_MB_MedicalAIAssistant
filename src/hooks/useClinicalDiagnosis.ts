// Ported from src/pages/MedicalAssistantPage.jsx (Web) — the "clinical
// diagnosis" flow (POST .../submit-diagnosis, ranked disease + ICD-10
// result), a separate flow from useSymptomIntake's "specialty triage"
// (submit-clinical-question-answers, department + facility result). Web
// ships these as two distinct pages/routes; this hook mirrors that
// separation instead of merging them, to avoid touching the already-working
// triage flow. Same state machine shape and resumable-cache pattern as
// useSymptomIntake.
import { useEffect, useState } from "react";

import { symptomAnalysisApi } from "@/src/services/symptomAnalysisService";
import {
  buildClinicalQuestionAnswerItems,
  isClinicalQuestionAnswered,
  readSuggestClinicalQuestionsPayload,
  unwrapApiData,
} from "@/src/utils/clinicalQuestions";
import { AnswerValue, ClinicalDiagnosisResult, ClinicalQuestion } from "@/src/types/symptomAnalysis";

const RESUMABLE_STATUSES = new Set(["idle", "questions", "no-questions", "result"]);

export type DiagnosisStatus = "idle" | "loading-questions" | "questions" | "no-questions" | "submitting" | "result";

type DiagnosisState = {
  input: string;
  sessionId: string;
  questions: ClinicalQuestion[];
  answers: Record<string, AnswerValue>;
  currentQuestionIndex: number;
  result: ClinicalDiagnosisResult | null;
  status: DiagnosisStatus;
};

let diagnosisStateCache: DiagnosisState | null = null;

function writeStoredDiagnosisState(state: DiagnosisState) {
  const hasMeaningfulState = Boolean(
    state.input?.trim() || state.sessionId || state.questions.length || state.result || state.status !== "idle",
  );
  diagnosisStateCache = hasMeaningfulState ? state : null;
}

function readInitialDiagnosisState(): DiagnosisState {
  const stored = diagnosisStateCache;
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

function readDiagnosisPayload(response: unknown): ClinicalDiagnosisResult {
  const data = (unwrapApiData<Record<string, unknown>>(response) ?? {}) as Record<string, unknown>;
  const analysis = (data.analysis || data.Analysis || data) as Record<string, unknown>;
  const diagnoses = (analysis.diagnoses || analysis.Diagnoses || []) as unknown[];

  return {
    diagnoses: Array.isArray(diagnoses) ? (diagnoses as ClinicalDiagnosisResult["diagnoses"]) : [],
    recommendedDepartment: (analysis.recommendedDepartment ?? analysis.RecommendedDepartment ?? null) as ClinicalDiagnosisResult["recommendedDepartment"],
  };
}

type UseClinicalDiagnosisOptions = {
  onResult?: (payload: { input: string; result: ClinicalDiagnosisResult; sessionId: string }) => void;
};

export function useClinicalDiagnosis({ onResult }: UseClinicalDiagnosisOptions = {}) {
  const [initialState] = useState(readInitialDiagnosisState);
  const [input, setInput] = useState(initialState.input);
  const [sessionId, setSessionId] = useState(initialState.sessionId);
  const [questions, setQuestions] = useState<ClinicalQuestion[]>(initialState.questions);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialState.answers);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialState.currentQuestionIndex);
  const [result, setResult] = useState<ClinicalDiagnosisResult | null>(initialState.result);
  const [status, setStatus] = useState<DiagnosisStatus>(initialState.status);
  const [error, setError] = useState("");

  const loading = status === "loading-questions" || status === "submitting";
  const answeredCount = questions.filter((question) =>
    isClinicalQuestionAnswered(question, answers[question.questionId]),
  ).length;
  const canSubmitAnswers = questions.length > 0 && answeredCount === questions.length && status !== "submitting";

  useEffect(() => {
    writeStoredDiagnosisState({ input, sessionId, questions, answers, currentQuestionIndex, result, status });
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
      const diagnosisResponse = await symptomAnalysisApi.submitDiagnosis(sessionId, payload);
      const completedResult = readDiagnosisPayload(diagnosisResponse);
      writeStoredDiagnosisState({ input, sessionId, questions, answers, currentQuestionIndex, result: completedResult, status: "result" });
      setResult(completedResult);
      setStatus("result");
      onResult?.({ input, result: completedResult, sessionId });
    } catch (apiError) {
      setError((apiError as Error)?.message || "Không thể tạo chẩn đoán lâm sàng. Vui lòng thử lại.");
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
