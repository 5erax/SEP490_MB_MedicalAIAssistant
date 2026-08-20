import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/src/api/client";
import { medicalDepartmentsService } from "@/src/services/domainServices";
import { consultationSessionsApi } from "@/src/services/consultationSessionService";
import { ConsultationSession, ConsultationSummary, MedicalDepartment } from "@/src/types/consultation";

function dataOf<T>(response: unknown): T | null {
  const envelope = response as { data?: T } | undefined;
  return envelope?.data ?? null;
}

function arrayOf<T>(response: unknown): T[] {
  const data = dataOf<T[] | { items?: T[] }>(response);
  return Array.isArray(data) ? data : data?.items ?? [];
}

function errorMessage(error: unknown, fallback: string) {
  const status = (error as ApiError)?.status;
  if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (status === 404) return "Không tìm thấy phiên tư vấn này.";
  return (error as Error)?.message || fallback;
}

async function waitForSession(session: ConsultationSession) {
  if (session.status !== "processing") return session;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const response = await consultationSessionsApi.get(session.sessionId);
    const latest = dataOf<ConsultationSession>(response);
    if (latest && latest.status !== "processing") return latest;
  }
  return session;
}

export function usePreConsultation(initial: { departmentId?: string; facilityId?: string; symptoms?: string }) {
  const [departments, setDepartments] = useState<MedicalDepartment[]>([]);
  const [history, setHistory] = useState<ConsultationSession[]>([]);
  const [departmentId, setDepartmentId] = useState(initial.departmentId ?? "");
  const [facilityId] = useState(initial.facilityId ?? "");
  const [symptoms, setSymptoms] = useState(initial.symptoms ?? "");
  const [appointmentTime, setAppointmentTime] = useState<Date>(() => {
    const value = new Date(Date.now() + 24 * 60 * 60 * 1000);
    value.setHours(9, 0, 0, 0);
    return value;
  });
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"generate" | "complete" | "history" | null>(null);
  const [error, setError] = useState("");

  const loadReferenceData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [departmentResponse, historyResponse] = await Promise.all([
        medicalDepartmentsService.list(),
        consultationSessionsApi.listMySessions(),
      ]);
      setDepartments(arrayOf<MedicalDepartment>(departmentResponse));
      setHistory(arrayOf<ConsultationSession>(historyResponse));
    } catch (requestError) {
      setError(errorMessage(requestError, "Chưa thể tải dữ liệu tư vấn trước khám."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  async function generate() {
    if (!departmentId) {
      setError("Vui lòng chọn chuyên khoa dự kiến.");
      return false;
    }
    if (symptoms.trim().length < 10) {
      setError("Vui lòng mô tả triệu chứng ít nhất 10 ký tự.");
      return false;
    }
    setBusy("generate");
    setError("");
    setSummary(null);
    try {
      const response = await consultationSessionsApi.generateQuestions({
        departmentId,
        symptoms: symptoms.trim(),
        facilityId: facilityId || null,
        appointmentTime: appointmentTime.toISOString(),
      });
      const created = dataOf<ConsultationSession>(response);
      if (!created) throw new Error("Máy chủ không trả về phiên tư vấn.");
      const resolved = await waitForSession(created);
      setSession(resolved);
      if (resolved.status === "failed") setError("Không thể tạo câu hỏi chuẩn bị. Vui lòng thử lại.");
      return resolved.status === "completed";
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể tạo phiên tư vấn trước khám."));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function complete() {
    if (!session) return false;
    setBusy("complete");
    setError("");
    try {
      await consultationSessionsApi.registerReminder(session.sessionId, reminderEnabled);
      const response = await consultationSessionsApi.complete(session.sessionId);
      const completed = dataOf<ConsultationSummary>(response);
      if (!completed) throw new Error("Máy chủ không trả về bản tổng hợp.");
      setSummary(completed);
      await loadReferenceData();
      return true;
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể hoàn tất phiên tư vấn."));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function openHistory(item: ConsultationSession) {
    setBusy("history");
    setError("");
    try {
      const response = await consultationSessionsApi.getSummary(item.sessionId);
      const value = dataOf<ConsultationSummary>(response);
      setSummary(value);
      setSession(item);
    } catch (requestError) {
      setError(errorMessage(requestError, "Không thể tải bản tổng hợp tư vấn."));
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setSession(null);
    setSummary(null);
    setError("");
  }

  return {
    departments,
    history,
    departmentId,
    setDepartmentId,
    symptoms,
    setSymptoms,
    appointmentTime,
    setAppointmentTime,
    reminderEnabled,
    setReminderEnabled,
    session,
    summary,
    loading,
    busy,
    error,
    reload: loadReferenceData,
    generate,
    complete,
    openHistory,
    reset,
  };
}
