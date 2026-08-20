// Ported from the state/handlers in Web's MedicalRecordPage.jsx: profile
// context load, upload-then-analyze submission (caching the Cloudinary
// upload so resubmitting the same file skips re-uploading), paginated/
// filterable session history, and a session detail panel that polls every
// 3s while the selected session is still "processing".
import { useCallback, useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";

import { authService } from "@/src/services/authService";
import { labTestsApi } from "@/src/services/labTestService";
import { PickedDocument, uploadMedicalDocumentToCloudinary, validateMedicalDocument } from "@/src/services/cloudinaryUploadService";
import { LabOcrExtract, LabSessionStatus, LabTestSession } from "@/src/types/labTest";
import { UserProfile } from "@/src/types/user";
import { calculateAgeAtTest, genderToAnalysisGender, todayInputValue } from "@/src/utils/labTestPresentation";

type SectionState = "loading" | "ready" | "error";
type SubmissionStatus = "idle" | "uploading" | "analyzing" | "success" | "error";

const HISTORY_PAGE_SIZE = 8;
const POLL_INTERVAL_MS = 3000;

function documentIdentity(document: PickedDocument | null) {
  if (!document) return "";
  return `${document.fileName || ""}:${document.fileSize || ""}`;
}

export function useMedicalRecords() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileState, setProfileState] = useState<SectionState>("loading");

  const [testDate, setTestDate] = useState(todayInputValue());
  const [document, setDocument] = useState<PickedDocument | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<{ identity: string; secureUrl: string } | null>(null);
  const [formError, setFormError] = useState("");

  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");

  const [sessions, setSessions] = useState<LabTestSession[]>([]);
  const [historyState, setHistoryState] = useState<SectionState>("loading");
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState<LabSessionStatus | "">("");
  const [historyInfo, setHistoryInfo] = useState({ totalCount: 0, totalPages: 0 });

  const [selectedSession, setSelectedSession] = useState<LabTestSession | null>(null);
  const [detailState, setDetailState] = useState<"idle" | SectionState>("idle");
  const [detailError, setDetailError] = useState("");
  const [ocrExtracts, setOcrExtracts] = useState<LabOcrExtract[]>([]);

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfile = useCallback(async () => {
    setProfileState("loading");
    try {
      const response = await authService.me();
      setProfile((response as { data?: UserProfile }).data ?? null);
      setProfileState("ready");
    } catch {
      setProfileState("error");
    }
  }, []);

  const loadHistory = useCallback(async (page: number, filter: LabSessionStatus | "", quiet = false) => {
    if (!quiet) setHistoryState("loading");
    setHistoryError("");
    try {
      const response = await labTestsApi.mySessions(page, HISTORY_PAGE_SIZE, filter);
      const data = response.data;
      setSessions(data?.items ?? []);
      setHistoryInfo({ totalCount: data?.totalCount ?? 0, totalPages: data?.totalPages ?? 0 });
      setHistoryState("ready");
    } catch (error) {
      if (!quiet) {
        setHistoryState("error");
        setHistoryError((error as Error)?.message || "Không thể tải lịch sử phân tích. Vui lòng thử lại.");
      }
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadHistory(historyPage, historyFilter);
  }, [historyPage, historyFilter, loadHistory]);

  const loadSessionDetail = useCallback(async (sessionId: string, quiet = false) => {
    if (!quiet) setDetailState("loading");
    setDetailError("");
    try {
      const [response, extractsResponse] = await Promise.all([
        labTestsApi.get(sessionId),
        labTestsApi.ocrExtracts(sessionId).catch(() => ({ data: [] as LabOcrExtract[] })),
      ]);
      setSelectedSession(response.data ?? null);
      setOcrExtracts(extractsResponse.data ?? []);
      setDetailState("ready");
    } catch (error) {
      if (!quiet) {
        setDetailState("error");
        setDetailError((error as Error)?.message || "Không thể tải chi tiết phiên phân tích. Vui lòng thử lại.");
      }
    }
  }, []);

  // Poll every 3s while the selected session is still processing, matching
  // Web's auto-refresh-on-processing behavior.
  useEffect(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
    if (selectedSession?.status === "processing") {
      pollTimer.current = setTimeout(() => {
        loadSessionDetail(selectedSession.sessionId, true);
        loadHistory(historyPage, historyFilter, true);
      }, POLL_INTERVAL_MS);
    }
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [selectedSession, loadSessionDetail, loadHistory, historyPage, historyFilter]);

  function selectSession(session: LabTestSession) {
    setSelectedSession(session);
    loadSessionDetail(session.sessionId);
  }

  function clearSelectedSession() {
    setSelectedSession(null);
    setDetailState("idle");
    setDetailError("");
    setOcrExtracts([]);
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const picked: PickedDocument = { uri: asset.uri, mimeType: asset.mimeType, fileSize: asset.size, fileName: asset.name };
    try {
      validateMedicalDocument(picked);
      setDocument(picked);
      setUploadedDocument(null);
      setFormError("");
    } catch (error) {
      setFormError((error as Error).message);
    }
  }

  function clearDocument() {
    setDocument(null);
    setUploadedDocument(null);
  }

  async function submitAnalysis() {
    if (!document) {
      setFormError("Hãy chọn ảnh hoặc PDF phiếu xét nghiệm.");
      return "invalid" as const;
    }
    if (!testDate || testDate > todayInputValue()) {
      setFormError("Ngày xét nghiệm không được ở tương lai.");
      return "invalid" as const;
    }
    if (!profile?.dateOfBirth) {
      setFormError("Hồ sơ cá nhân chưa có ngày sinh.");
      return "invalid" as const;
    }
    const gender = genderToAnalysisGender(profile.gender);
    if (!gender) {
      setFormError("Giới tính trong hồ sơ chưa phù hợp với biểu mẫu phân tích hiện tại.");
      return "invalid" as const;
    }
    const ageAtTest = calculateAgeAtTest(profile.dateOfBirth, testDate);
    if (ageAtTest === null) {
      setFormError("Ngày xét nghiệm phải sau ngày sinh trong hồ sơ.");
      return "invalid" as const;
    }

    setFormError("");
    setSubmissionMessage("");
    try {
      const identity = documentIdentity(document);
      let secureUrl = uploadedDocument?.identity === identity ? uploadedDocument.secureUrl : null;

      if (!secureUrl) {
        setSubmissionStatus("uploading");
        const uploaded = await uploadMedicalDocumentToCloudinary(document);
        secureUrl = uploaded.secureUrl;
        setUploadedDocument({ identity, secureUrl });
      }

      setSubmissionStatus("analyzing");
      const response = await labTestsApi.analyze({
        documentUrl: secureUrl,
        patientGenderAtTest: gender,
        patientAgeAtTest: ageAtTest,
        testDate,
      });

      setSelectedSession(response.data ?? null);
      setDetailState("ready");
      setSubmissionStatus("success");
      setSubmissionMessage("Đã gửi phiếu xét nghiệm để phân tích.");
      setHistoryPage(1);
      if (historyPage === 1) loadHistory(1, historyFilter);
      return "success" as const;
    } catch (error) {
      setSubmissionStatus("error");
      setSubmissionMessage((error as Error)?.message || "Không thể phân tích phiếu xét nghiệm. Vui lòng thử lại.");
      return "error" as const;
    }
  }

  return {
    profile,
    profileState,
    reloadProfile: loadProfile,

    testDate,
    setTestDate,
    document,
    formError,
    pickDocument,
    clearDocument,

    submissionStatus,
    submissionMessage,
    submitAnalysis,

    sessions,
    historyState,
    historyError,
    historyPage,
    setHistoryPage,
    historyFilter,
    setHistoryFilter,
    historyInfo,
    reloadHistory: () => loadHistory(historyPage, historyFilter),

    selectedSession,
    ocrExtracts,
    detailState,
    detailError,
    selectSession,
    clearSelectedSession,
    retryDetail: () => selectedSession && loadSessionDetail(selectedSession.sessionId),
  };
}
