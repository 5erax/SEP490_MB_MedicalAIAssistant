// Ported from the state/handlers in Web's MedicalRecordPage.jsx: profile
// context load, upload-then-analyze submission (caching the Cloudinary
// upload so resubmitting the same file skips re-uploading), paginated/
// filterable session history, and a session detail panel that polls while OCR
// or the backend-generated AI summary is still processing.
import { useCallback, useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import { authService } from "@/src/services/authService";
import { labTestsApi } from "@/src/services/labTestService";
import { PickedDocument, uploadMedicalDocumentToCloudinary, validateMedicalDocument } from "@/src/services/cloudinaryUploadService";
import { LabOcrExtract, LabSessionStatus, LabTestSession } from "@/src/types/labTest";
import { UserProfile } from "@/src/types/user";
import { calculateAgeAtTest, genderToAnalysisGender, todayInputValue } from "@/src/utils/labTestPresentation";

type SectionState = "loading" | "ready" | "error";
type SubmissionStatus = "idle" | "uploading" | "analyzing" | "success" | "error";

const HISTORY_PAGE_SIZE = 8;
const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;
const SUMMARY_DEFAULT_ERROR = "Chưa thể tạo tóm tắt tổng quan. Vui lòng thử lại.";
const SUMMARY_TIMEOUT_ERROR = "AI đang xử lí vui lòng quay lại sau";

function documentIdentity(document: PickedDocument | null) {
  if (!document) return "";
  return `${document.uri}:${document.fileName || ""}:${document.fileSize || ""}`;
}

function shouldPollSession(session: LabTestSession | null): session is LabTestSession {
  if (!session) return false;
  if (session.status === "processing") return true;
  if (session.status !== "completed") return false;
  if (session.aiSummaryStatus === "completed" || session.aiSummaryStatus === "failed") return false;
  return !session.aiSummary;
}

export function useMedicalRecords() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileState, setProfileState] = useState<SectionState>("loading");

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
  const [summaryText, setSummaryText] = useState("");
  const [summaryState, setSummaryState] = useState<"idle" | SectionState>("idle");
  const [summaryError, setSummaryError] = useState("");

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollSessionId = useRef<string | null>(null);
  const pollStartedAt = useRef<number | null>(null);

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

  const updateSummaryFromSession = useCallback((session: LabTestSession | null) => {
    if (!session) {
      setSummaryText("");
      setSummaryState("idle");
      setSummaryError("");
      return;
    }

    if (session.aiSummary) {
      setSummaryText(session.aiSummary);
      setSummaryState("ready");
      setSummaryError("");
      return;
    }

    setSummaryText("");
    if (session.status === "completed" && session.aiSummaryStatus === "failed") {
      setSummaryState("error");
      setSummaryError(SUMMARY_DEFAULT_ERROR);
      return;
    }

    if (session.status === "completed" && (session.aiSummaryStatus === "processing" || session.aiSummaryStatus == null)) {
      setSummaryState("loading");
      setSummaryError("");
      return;
    }

    if (session.status === "processing") {
      setSummaryState("loading");
      setSummaryError("");
      return;
    }

    setSummaryState("idle");
    setSummaryError("");
  }, []);

  const loadSessionDetail = useCallback(async (sessionId: string, quiet = false) => {
    if (!quiet) setDetailState("loading");
    setDetailError("");
    try {
      const [response, extractsResponse] = await Promise.all([
        labTestsApi.get(sessionId),
        labTestsApi.ocrExtracts(sessionId).catch(() => ({ data: [] as LabOcrExtract[] })),
      ]);
      const session = response.data ?? null;
      setSelectedSession(session);
      setOcrExtracts(extractsResponse.data ?? []);
      updateSummaryFromSession(session);
      setDetailState("ready");
    } catch (error) {
      if (!quiet) {
        setDetailState("error");
        setDetailError((error as Error)?.message || "Không thể tải chi tiết phiên phân tích. Vui lòng thử lại.");
      }
    }
  }, [updateSummaryFromSession]);

  const retrySummary = useCallback(async (sessionId: string) => {
    pollSessionId.current = sessionId;
    pollStartedAt.current = Date.now();
    setSummaryState("loading");
    setSummaryError("");
    try {
      const response = await labTestsApi.get(sessionId);
      const session = response.data ?? null;
      setSelectedSession(session);
      updateSummaryFromSession(session);
    } catch (error) {
      setSummaryState("error");
      setSummaryError((error as Error)?.message || "Chưa thể tạo tóm tắt tổng quan. Vui lòng thử lại.");
    }
  }, [updateSummaryFromSession]);

  // Poll the session detail while OCR or the backend-generated AI summary is pending.
  useEffect(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }

    const pollingSession = selectedSession;

    if (!shouldPollSession(pollingSession)) {
      pollSessionId.current = null;
      pollStartedAt.current = null;
      return undefined;
    }

    if (pollSessionId.current !== pollingSession.sessionId) {
      pollSessionId.current = pollingSession.sessionId;
      pollStartedAt.current = Date.now();
    }

    const startedAt = pollStartedAt.current ?? Date.now();
    if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
      setSummaryState("error");
      setSummaryError(SUMMARY_TIMEOUT_ERROR);
      return undefined;
    }

    pollTimer.current = setTimeout(async () => {
      try {
        const response = await labTestsApi.get(pollingSession.sessionId);
        const session = response.data ?? null;
        if (!session) return;

        setSelectedSession(session);
        updateSummaryFromSession(session);

        if (pollingSession.status === "processing" && session.status !== "processing") {
          loadHistory(historyPage, historyFilter, true);
          labTestsApi
            .ocrExtracts(session.sessionId)
            .then((extractsResponse) => setOcrExtracts(extractsResponse.data ?? []))
            .catch(() => undefined);
        }
      } catch {
        setSelectedSession((current) => (current ? { ...current } : current));
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [selectedSession, updateSummaryFromSession, loadHistory, historyPage, historyFilter]);

  function selectSession(session: LabTestSession) {
    setSelectedSession(session);
    setOcrExtracts([]);
    updateSummaryFromSession(session);
    loadSessionDetail(session.sessionId);
  }

  function clearSelectedSession() {
    setSelectedSession(null);
    setDetailState("idle");
    setDetailError("");
    setOcrExtracts([]);
    setSummaryText("");
    setSummaryState("idle");
    setSummaryError("");
  }

  function acceptDocument(picked: PickedDocument) {
    try {
      validateMedicalDocument(picked);
      setDocument(picked);
      setUploadedDocument(null);
      setFormError("");
      setSubmissionStatus("idle");
      setSubmissionMessage("");
    } catch (error) {
      setFormError((error as Error).message);
    }
  }

  async function pickPdf() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    acceptDocument({ uri: asset.uri, file: asset.file, mimeType: asset.mimeType, fileSize: asset.size, fileName: asset.name });
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    acceptDocument({
      uri: asset.uri,
      file: asset.file,
      mimeType: asset.mimeType || "image/jpeg",
      fileSize: asset.fileSize,
      fileName: asset.fileName || `lab-test-${Date.now()}.jpg`,
    });
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFormError("Cần cho phép truy cập camera để chụp phiếu xét nghiệm.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    acceptDocument({
      uri: asset.uri,
      file: asset.file,
      mimeType: asset.mimeType || "image/jpeg",
      fileSize: asset.fileSize,
      fileName: asset.fileName || `lab-test-camera-${Date.now()}.jpg`,
    });
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
    if (!profile?.dateOfBirth) {
      setFormError("Hồ sơ cá nhân chưa có ngày sinh.");
      return "invalid" as const;
    }
    const gender = genderToAnalysisGender(profile.gender);
    if (!gender) {
      setFormError("Giới tính trong hồ sơ chưa phù hợp với biểu mẫu phân tích hiện tại.");
      return "invalid" as const;
    }
    const ageAtTest = calculateAgeAtTest(profile.dateOfBirth, todayInputValue());
    if (ageAtTest === null) {
      setFormError("Ngày sinh trong hồ sơ chưa hợp lệ.");
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
      });

      setSelectedSession(response.data ?? null);
      setOcrExtracts([]);
      updateSummaryFromSession(response.data ?? null);
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

    document,
    formError,
    pickImage,
    pickPdf,
    takePhoto,
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
    summaryText,
    summaryState,
    summaryError,
    selectSession,
    clearSelectedSession,
    retryDetail: () => selectedSession && loadSessionDetail(selectedSession.sessionId),
    retrySummary: () => selectedSession && retrySummary(selectedSession.sessionId),
  };
}
