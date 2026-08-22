// Ported from src/pages/PreConsultationPage.jsx (Web) — the "Tư vấn trước
// khám" 5-step wizard (Info -> Checklist -> Questions -> Reminder ->
// Summary). Web's department/symptoms/facility fields are NOT free-typed:
// they are only ever populated by applying a previously-run specialty
// triage session (POST suggest-clinical-questions -> submit-clinical-
// question-answers), same dependency chain reproduced here. Not ported vs.
// Web: SignalR/live sync (none on this flow to begin with) - polling is
// identical (200ms interval, 2 min timeout, promise cached per sessionId).
import { useEffect, useRef, useState } from "react";

import { checklistItemsApi, consultationSessionsApi } from "@/src/services/consultationSessionService";
import { medicalDepartmentsService } from "@/src/services/domainServices";
import { symptomAnalysisApi, unwrapApiData } from "@/src/services/symptomAnalysisService";
import {
  ChecklistItem,
  ConsultationSession,
  ConsultationSummary,
  SuggestedConsultationFacility,
} from "@/src/types/consultation";
import { SymptomAnalysisSession } from "@/src/types/symptomAnalysis";

export type WizardStep = 0 | 1 | 2 | 3 | 4;
type SectionState = "idle" | "loading" | "ready" | "error";
type BusyState = "" | "generate" | "checklist" | "session" | "reminder" | "complete";

const SESSION_POLL_INTERVAL_MS = 400;
const SESSION_POLL_TIMEOUT_MS = 2 * 60 * 1000;

export type MedicalDepartmentOption = { id: string; departmentName: string };

export type ConsultationForm = {
  departmentId: string;
  departmentName: string;
  appointmentTime: string;
  symptoms: string;
  facilityId: string;
  facilityName: string;
};

const EMPTY_FORM: ConsultationForm = {
  departmentId: "",
  departmentName: "",
  appointmentTime: "",
  symptoms: "",
  facilityId: "",
  facilityName: "",
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSuggestedFacilities(list: unknown): SuggestedConsultationFacility[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      const facility = item as Record<string, unknown>;
      return {
        facilityId: String(facility?.facilityId ?? facility?.FacilityId ?? facility?.id ?? "").trim(),
        facilityName: (facility?.facilityName ?? facility?.FacilityName ?? facility?.name ?? "Cơ sở y tế") as string,
        address: (facility?.address ?? facility?.Address ?? "") as string,
      };
    })
    .filter((facility) => facility.facilityId);
}

function extractSessionRecommendation(response: unknown) {
  const data = (unwrapApiData<Record<string, unknown>>(response) || {}) as Record<string, unknown>;
  const analysis = (data.analysis || data.Analysis || data) as Record<string, unknown>;
  const departmentItems = (analysis.recommendedDepartments || analysis.RecommendedDepartments) as unknown[] | undefined;
  const department = (analysis.recommendedDepartment
    || analysis.RecommendedDepartment
    || (Array.isArray(departmentItems) ? departmentItems[0] : null)) as Record<string, unknown> | null;
  const departmentId = String(department?.departmentId ?? department?.DepartmentId ?? "").trim();
  const departmentName = String(department?.departmentName ?? department?.DepartmentName ?? "").trim();
  const symptomText = String(data.inputText ?? data.InputText ?? "");
  const facilities = normalizeSuggestedFacilities(analysis.recommendedFacilities || analysis.RecommendedFacilities);
  return { departmentId, departmentName, symptomText, facilities };
}

function getSuggestedSessionTitle(session: SymptomAnalysisSession | Record<string, unknown> | null, fallback: string) {
  const item = session as Record<string, unknown> | null;
  return (item?.inputText || item?.InputText || item?.userInput || item?.symptoms || fallback) as string;
}

function normalizeQuestions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw, index) => {
      const item = raw as Record<string, unknown>;
      return {
        id: String(item?.id ?? `${item?.category ?? "question"}-${index}`),
        category: String(item?.category ?? ""),
        text: String(item?.questionText ?? item?.question ?? item?.text ?? ""),
        priority: Number(item?.priority ?? index + 1),
      };
    })
    .filter((item) => item.text)
    .sort((left, right) => left.priority - right.priority);
}

export function useConsultationWizard() {
  const [departments, setDepartments] = useState<MedicalDepartmentOption[]>([]);
  const [departmentsState, setDepartmentsState] = useState<SectionState>("loading");

  const [suggestedSessions, setSuggestedSessions] = useState<SymptomAnalysisSession[]>([]);
  const [suggestedSessionsState, setSuggestedSessionsState] = useState<SectionState>("idle");
  const [suggestedSessionsError, setSuggestedSessionsError] = useState("");
  const [applyingSessionId, setApplyingSessionId] = useState("");
  const [appliedSessionTitle, setAppliedSessionTitle] = useState("");

  const [form, setForm] = useState<ConsultationForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ConsultationForm, string>>>({});
  const [suggestedFacilities, setSuggestedFacilities] = useState<SuggestedConsultationFacility[]>([]);

  const [step, setStep] = useState<WizardStep>(0);
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [sessionDetail, setSessionDetail] = useState<ConsultationSession | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);
  const [busy, setBusy] = useState<BusyState>("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const pollingActiveRef = useRef(true);
  const sessionPollRef = useRef<{ sessionId: string; promise: Promise<ConsultationSession | null> | null }>({
    sessionId: "",
    promise: null,
  });

  useEffect(() => {
    pollingActiveRef.current = true;
    return () => {
      pollingActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await medicalDepartmentsService.list();
        const data = unwrapApiData<{ items?: unknown[] } | unknown[]>(response);
        const items = Array.isArray(data) ? data : (data as { items?: unknown[] })?.items ?? [];
        if (!active) return;
        setDepartments(
          (items as Record<string, unknown>[])
            .filter((item) => item?.id)
            .map((item) => ({ id: String(item.id), departmentName: String(item.departmentName ?? "") })),
        );
        setDepartmentsState("ready");
      } catch {
        if (active) setDepartmentsState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function loadSuggestedSessions() {
    if (suggestedSessionsState === "loading") return;
    setSuggestedSessionsState("loading");
    setSuggestedSessionsError("");
    try {
      const items = await symptomAnalysisApi.listAllMySessions("department");
      setSuggestedSessions(items);
      setSuggestedSessionsState("ready");
    } catch (requestError) {
      setSuggestedSessionsState("error");
      setSuggestedSessionsError((requestError as Error)?.message || "Chưa thể tải danh sách phiên gợi ý chuyên khoa.");
    }
  }

  async function applySuggestedSession(sessionId: string) {
    if (!sessionId) return;
    setApplyingSessionId(sessionId);
    setError("");
    try {
      const response = await symptomAnalysisApi.get(sessionId);
      const { departmentId, departmentName, symptomText, facilities } = extractSessionRecommendation(response);
      setForm((current) => ({
        ...current,
        departmentId: departmentId || current.departmentId,
        departmentName: departmentName || current.departmentName,
        symptoms: symptomText || current.symptoms,
        facilityId: "",
        facilityName: "",
      }));
      setFormErrors((current) => ({ ...current, departmentId: undefined, symptoms: undefined }));
      setSuggestedFacilities(facilities);
      setAppliedSessionTitle(getSuggestedSessionTitle(unwrapApiData(response), "Phiên gợi ý đã chọn"));
      return true;
    } catch (requestError) {
      setError((requestError as Error)?.message || "Chưa thể tải chi tiết phiên gợi ý. Vui lòng thử lại.");
      return false;
    } finally {
      setApplyingSessionId("");
    }
  }

  function selectSuggestedFacility(facility: SuggestedConsultationFacility) {
    setForm((current) => ({ ...current, facilityId: facility.facilityId, facilityName: facility.facilityName }));
    setFormErrors((current) => ({ ...current, facilityId: undefined }));
  }

  function updateAppointmentTime(value: string) {
    setForm((current) => ({ ...current, appointmentTime: value }));
    setFormErrors((current) => ({ ...current, appointmentTime: undefined }));
  }

  function validateIntake() {
    const errors: Partial<Record<keyof ConsultationForm, string>> = {};
    if (!form.departmentId) errors.departmentId = "Vui lòng chọn một phiên gợi ý chuyên khoa để xác định chuyên khoa.";
    if (!form.appointmentTime) {
      errors.appointmentTime = "Vui lòng chọn thời gian dự kiến khám.";
    } else if (new Date(form.appointmentTime).getTime() <= Date.now()) {
      errors.appointmentTime = "Thời gian khám phải ở tương lai.";
    }
    if (!form.symptoms.trim()) errors.symptoms = "Vui lòng chọn phiên gợi ý chuyên khoa có mô tả triệu chứng.";
    if (!form.facilityId) errors.facilityId = "Bạn chưa chọn bệnh viện.";
    return errors;
  }

  async function pollSessionUntilTerminal(sessionId: string): Promise<ConsultationSession | null> {
    const deadline = Date.now() + SESSION_POLL_TIMEOUT_MS;
    while (pollingActiveRef.current) {
      const response = await consultationSessionsApi.get(sessionId);
      const detail = (unwrapApiData<ConsultationSession>(response) ?? null) as ConsultationSession | null;
      const status = String(detail?.status ?? "").toLowerCase();

      if (status === "failed") {
        throw new Error("Phiên tư vấn không thể tạo câu hỏi. Vui lòng thử lại.");
      }
      if (status === "completed") return detail;
      if (Date.now() >= deadline) {
        throw new Error("Phiên tư vấn đang mất nhiều thời gian hơn dự kiến. Vui lòng thử lại.");
      }
      await wait(SESSION_POLL_INTERVAL_MS);
    }
    return null;
  }

  async function loadChecklist(departmentId: string) {
    setBusy("checklist");
    setError("");
    try {
      const response = await checklistItemsApi.byDepartment(departmentId);
      const data = unwrapApiData<ChecklistItem[] | { items?: ChecklistItem[] }>(response);
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setChecklistItems(items.filter((item) => item?.id && item?.content));
    } catch (requestError) {
      setError((requestError as Error)?.message || "Chưa thể tải checklist chuẩn bị. Phiên tư vấn đã được tạo, bạn có thể thử tải lại.");
    } finally {
      setBusy("");
    }
  }

  async function startConsultation() {
    const nextErrors = validateIntake();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setError(Object.values(nextErrors).join(" "));
      return false;
    }

    setBusy("generate");
    setError("");
    try {
      const response = await consultationSessionsApi.generateQuestions({
        departmentId: form.departmentId,
        facilityId: form.facilityId || null,
        appointmentTime: new Date(form.appointmentTime).toISOString(),
        symptoms: form.symptoms.trim(),
      });
      const nextSession = unwrapApiData<ConsultationSession>(response);
      if (!nextSession?.sessionId) throw new Error("Phản hồi chưa có Id phiên tư vấn.");

      setSession(nextSession);
      sessionPollRef.current = {
        sessionId: nextSession.sessionId,
        promise: pollSessionUntilTerminal(nextSession.sessionId),
      };
      setStep(1);
      await loadChecklist(nextSession.departmentId || form.departmentId);
      return true;
    } catch (submitError) {
      setError((submitError as Error)?.message || "Chưa thể xác nhận phiên đã được tạo. Hãy kiểm tra lịch sử trước khi thử gửi lại.");
      return false;
    } finally {
      setBusy("");
    }
  }

  async function continueFromChecklist() {
    if (!session) return false;
    setBusy("session");
    setError("");
    try {
      const activePoll = sessionPollRef.current.sessionId === session.sessionId ? sessionPollRef.current.promise : null;
      const detail = activePoll ? await activePoll : await pollSessionUntilTerminal(session.sessionId);
      if (!detail || !pollingActiveRef.current) return false;
      setSessionDetail(detail);
      setStep(2);
      return true;
    } catch (pollError) {
      if (!pollingActiveRef.current) return false;
      setError((pollError as Error)?.message || "Chưa thể tải nội dung phiên tư vấn. Vui lòng thử lại.");
      return false;
    } finally {
      if (pollingActiveRef.current) setBusy("");
    }
  }

  function chooseReminder(enabled: boolean) {
    setReminderEnabled(enabled);
    setError("");
  }

  async function saveReminderAndOpenSummary() {
    if (!session) return false;
    if (reminderEnabled === null) {
      setError("Vui lòng chọn có hoặc không nhận nhắc lịch.");
      return false;
    }
    setBusy("reminder");
    setError("");
    try {
      await consultationSessionsApi.registerReminder(session.sessionId, reminderEnabled);
      const response = await consultationSessionsApi.getSummary(session.sessionId);
      setSummary(unwrapApiData<ConsultationSummary>(response) ?? null);
      setStep(4);
      return true;
    } catch (submitError) {
      setError((submitError as Error)?.message || "Chưa thể lưu nhắc lịch hoặc tải tổng kết. Vui lòng thử lại.");
      return false;
    } finally {
      setBusy("");
    }
  }

  async function completeConsultation() {
    if (!session) return false;
    setBusy("complete");
    setError("");
    try {
      const response = await consultationSessionsApi.complete(session.sessionId);
      setSummary((current) => unwrapApiData<ConsultationSummary>(response) ?? current);
      setCompleted(true);
      return true;
    } catch (submitError) {
      setError((submitError as Error)?.message || "Chưa thể hoàn thành phiên tư vấn. Vui lòng thử lại.");
      return false;
    } finally {
      setBusy("");
    }
  }

  function resetWizard() {
    setStep(0);
    setSession(null);
    setChecklistItems([]);
    setSessionDetail(null);
    setReminderEnabled(null);
    setSummary(null);
    setCompleted(false);
    setError("");
    setForm(EMPTY_FORM);
    setAppliedSessionTitle("");
    setSuggestedFacilities([]);
  }

  const questions = normalizeQuestions(sessionDetail?.questions ?? session?.questions);

  return {
    applyingSessionId,
    applySuggestedSession,
    appliedSessionTitle,
    busy,
    checklistItems,
    chooseReminder,
    completed,
    completeConsultation,
    continueFromChecklist,
    departments,
    departmentsState,
    error,
    form,
    formErrors,
    loadSuggestedSessions,
    questions,
    reminderEnabled,
    resetWizard,
    saveReminderAndOpenSummary,
    selectSuggestedFacility,
    session,
    sessionDetail,
    setError,
    setStep,
    startConsultation,
    step,
    suggestedFacilities,
    suggestedSessions,
    suggestedSessionsError,
    suggestedSessionsState,
    summary,
    updateAppointmentTime,
  };
}
