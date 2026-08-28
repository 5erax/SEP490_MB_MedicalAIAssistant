// Ported from the state/handlers in Web's RecoveryPlanPage.jsx (minus the
// SignalR realtime sync — mobile relies on pull-to-refresh/manual reload
// instead; see docs/mobile-progress.md for the reasoning). Quota, requests,
// and plans each load independently so one failing doesn't block the others.
import { useCallback, useEffect, useRef, useState } from "react";

import { labTestsApi } from "@/src/services/labTestService";
import { recoveryPlanRequestsApi, recoveryPlansApi } from "@/src/services/recoveryPlanService";
import { normalizeRecoveryQuota, subscriptionUsageApi } from "@/src/services/subscriptionUsageService";
import { PickedImage, uploadImageToCloudinary } from "@/src/services/cloudinaryUploadService";
import { ApiErrorPayload, PaginatedResult } from "@/src/types/api";
import { LabTestSession } from "@/src/types/labTest";
import { DiseaseGroup, RecoveryPlan, RecoveryPlanRequest } from "@/src/types/recoveryPlan";
import { SubscriptionUsageQuota } from "@/src/types/subscription";
import {
  getRecoveryErrorMessage,
  getLabSessionId,
  isNoActiveSubscriptionError,
  makeIdempotencyKey,
  mapReadinessIssues,
  normalizeCompletedLabSessions,
  recoveryPlanNeedsFeedback,
} from "@/src/utils/recoveryPlanPresentation";

type SectionState = "loading" | "ready" | "error";
const PAGE_SIZE = 10;
const EMPTY_PAGE = { items: [], pageNumber: 1, pageSize: PAGE_SIZE, totalCount: 0, totalPages: 0 };
const IN_PROGRESS_REQUEST_STATUSES = new Set<RecoveryPlanRequest["status"]>(["waitingForDoctor", "assigned", "inReview", "needMoreInformation"]);

export type CreateRequestForm = { diseaseGroup: DiseaseGroup | ""; requestNote: string; primaryLabTestSessionId: string };

function errorPayload(error: unknown) {
  return (error as { payload?: ApiErrorPayload })?.payload;
}

function isInProgressRequest(request: RecoveryPlanRequest | null | undefined) {
  return Boolean(request && IN_PROGRESS_REQUEST_STATUSES.has(request.status));
}

export function useRecoveryPlan() {
  const [quota, setQuota] = useState<SubscriptionUsageQuota | null>(null);
  const [quotaState, setQuotaState] = useState<SectionState>("loading");
  const [quotaMessage, setQuotaMessage] = useState("");
  const [quotaNeedsSubscription, setQuotaNeedsSubscription] = useState(false);

  const [requests, setRequests] = useState<PaginatedResult<RecoveryPlanRequest>>(EMPTY_PAGE);
  const [requestsState, setRequestsState] = useState<SectionState>("loading");
  const [requestsError, setRequestsError] = useState("");
  const [requestsPage, setRequestsPage] = useState(1);
  const [pinnedRequest, setPinnedRequest] = useState<RecoveryPlanRequest | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<RecoveryPlanRequest | null>(null);
  const [requestDetailState, setRequestDetailState] = useState<"idle" | SectionState>("idle");

  const [plans, setPlans] = useState<PaginatedResult<RecoveryPlan>>(EMPTY_PAGE);
  const [plansState, setPlansState] = useState<SectionState>("loading");
  const [plansError, setPlansError] = useState("");
  const [plansPage, setPlansPage] = useState(1);

  const [selectedPlan, setSelectedPlan] = useState<RecoveryPlan | null>(null);
  const [planDetailState, setPlanDetailState] = useState<"idle" | SectionState>("idle");

  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const dismissedFeedbackIdsRef = useRef<Set<string>>(new Set());

  const [createForm, setCreateForm] = useState<CreateRequestForm>({ diseaseGroup: "", requestNote: "", primaryLabTestSessionId: "" });
  const [createErrors, setCreateErrors] = useState<{ diseaseGroup?: string; requestNote?: string }>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createNeedsSubscription, setCreateNeedsSubscription] = useState(false);
  const [profileReadinessIssues, setProfileReadinessIssues] = useState<string[]>([]);
  const idempotencyKeyRef = useRef(makeIdempotencyKey());

  const [labSessions, setLabSessions] = useState<LabTestSession[]>([]);
  const [labSessionsState, setLabSessionsState] = useState<SectionState>("loading");
  const [labSessionsError, setLabSessionsError] = useState("");

  const [prescriptionFile, setPrescriptionFile] = useState<PickedImage | null>(null);
  const [prescriptionImageUrl, setPrescriptionImageUrl] = useState("");
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);
  const [prescriptionUploadError, setPrescriptionUploadError] = useState("");

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [providingInfo, setProvidingInfo] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [cancellingPlanId, setCancellingPlanId] = useState<string | null>(null);

  const loadQuota = useCallback(async () => {
    setQuotaState("loading");
    setQuotaNeedsSubscription(false);
    try {
      const response = await subscriptionUsageApi.getUsage();
      setQuota(normalizeRecoveryQuota(response.data));
      setQuotaState("ready");
    } catch (error) {
      const payload = errorPayload(error);
      setQuotaNeedsSubscription(isNoActiveSubscriptionError(payload));
      setQuotaMessage(getRecoveryErrorMessage(payload, "Không thể tải hạn mức kế hoạch phục hồi."));
      setQuotaState("error");
    }
  }, []);

  const loadRequests = useCallback(async (page: number) => {
    setRequestsState("loading");
    setRequestsError("");
    try {
      const response = await recoveryPlanRequestsApi.listMine(page, PAGE_SIZE);
      const nextPage = response.data ?? EMPTY_PAGE;
      setRequests(nextPage);
      const inProgressRequest = nextPage.items.find(isInProgressRequest) ?? null;
      setPinnedRequest(inProgressRequest);
      setRequestsState("ready");
    } catch (error) {
      setRequestsState("error");
      setRequestsError(getRecoveryErrorMessage(errorPayload(error), "Không thể tải danh sách yêu cầu."));
    }
  }, []);

  const loadPlans = useCallback(async (page: number) => {
    setPlansState("loading");
    setPlansError("");
    try {
      const response = await recoveryPlansApi.listMine(page, PAGE_SIZE);
      setPlans(response.data ?? EMPTY_PAGE);
      setPlansState("ready");
    } catch (error) {
      setPlansState("error");
      setPlansError(getRecoveryErrorMessage(errorPayload(error), "Không thể tải danh sách kế hoạch."));
    }
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.allSettled([loadQuota(), loadRequests(requestsPage), loadPlans(plansPage)]);
  }, [loadQuota, loadRequests, loadPlans, requestsPage, plansPage]);

  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  useEffect(() => {
    loadRequests(requestsPage);
  }, [requestsPage, loadRequests]);

  useEffect(() => {
    loadPlans(plansPage);
  }, [plansPage, loadPlans]);

  useEffect(() => {
    let cancelled = false;
    async function loadCompletedLabSessions() {
      setLabSessionsState("loading");
      setLabSessionsError("");
      try {
        const response = await labTestsApi.mySessions(1, 20, "completed");
        if (cancelled) return;
        const items = normalizeCompletedLabSessions(response.data?.items ?? []) as LabTestSession[];
        setLabSessions(items);
        setCreateForm((current) =>
          current.primaryLabTestSessionId && !items.some((session) => getLabSessionId(session) === current.primaryLabTestSessionId)
            ? { ...current, primaryLabTestSessionId: "" }
            : current,
        );
        setLabSessionsState("ready");
      } catch {
        if (cancelled) return;
        setLabSessions([]);
        setCreateForm((current) => ({ ...current, primaryLabTestSessionId: "" }));
        setLabSessionsState("error");
        setLabSessionsError("Không thể tải danh sách xét nghiệm. Bạn vẫn có thể gửi yêu cầu mà không đính kèm.");
      }
    }
    loadCompletedLabSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  function selectRequest(request: RecoveryPlanRequest) {
    setSelectedRequest(request);
    setRequestDetailState("loading");
    recoveryPlanRequestsApi
      .get(request.id)
      .then((response) => {
        setSelectedRequest(response.data ?? request);
        setRequestDetailState("ready");
      })
      .catch(() => setRequestDetailState("error"));
  }

  function clearSelectedRequest() {
    setSelectedRequest(null);
    setRequestDetailState("idle");
  }

  function selectPlan(plan: RecoveryPlan) {
    setSelectedPlan(plan);
    setPlanDetailState("loading");
    recoveryPlansApi
      .get(plan.id)
      .then((response) => {
        setSelectedPlan(response.data ?? plan);
        setPlanDetailState("ready");
      })
      .catch(() => setPlanDetailState("error"));
  }

  const selectPlanById = useCallback(async (planId: string) => {
    setPlanDetailState("loading");
    try {
      const response = await recoveryPlansApi.get(planId);
      if (!response.data) {
        setPlanDetailState("error");
        return false;
      }

      setSelectedPlan(response.data);
      setPlanDetailState("ready");
      return true;
    } catch {
      setPlanDetailState("error");
      return false;
    }
  }, []);

  function clearSelectedPlan() {
    setSelectedPlan(null);
    setPlanDetailState("idle");
  }

  function shouldAutoPromptFeedback(plan: RecoveryPlan) {
    return recoveryPlanNeedsFeedback(plan) && !dismissedFeedbackIdsRef.current.has(plan.id);
  }

  function openFeedback(plan: RecoveryPlan) {
    setSelectedPlan(plan);
    setFeedbackError("");
    setFeedbackVisible(true);
  }

  function closeFeedback() {
    if (selectedPlan) dismissedFeedbackIdsRef.current.add(selectedPlan.id);
    setFeedbackVisible(false);
  }

  async function submitFeedback(planId: string, payload: { rating: number; note: string | null }) {
    setFeedbackSubmitting(true);
    setFeedbackError("");
    try {
      const response = await recoveryPlansApi.submitFeedback(planId, payload);
      const updatedPlan = response.data ?? null;
      if (updatedPlan) {
        setSelectedPlan((current) => (current?.id === planId ? { ...current, ...updatedPlan } : current));
        setPlans((current) => ({
          ...current,
          items: current.items.map((item) => (item.id === planId ? { ...item, ...updatedPlan } : item)),
        }));
      }
      dismissedFeedbackIdsRef.current.add(planId);
      setFeedbackVisible(false);
      return "success" as const;
    } catch (error) {
      const message = getRecoveryErrorMessage(errorPayload(error), "Chưa thể gửi đánh giá lúc này. Vui lòng thử lại.");
      setFeedbackError(message);
      return { status: "error" as const, message };
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  function updateCreateField<K extends keyof CreateRequestForm>(key: K, value: CreateRequestForm[K]) {
    setCreateForm((current) => ({ ...current, [key]: value }));
  }

  function resetCreateForm() {
    setCreateForm({ diseaseGroup: "", requestNote: "", primaryLabTestSessionId: "" });
    setCreateErrors({});
    setCreateError("");
    setCreateNeedsSubscription(false);
    setProfileReadinessIssues([]);
    setPrescriptionFile(null);
    setPrescriptionImageUrl("");
    setPrescriptionUploadError("");
    idempotencyKeyRef.current = makeIdempotencyKey();
  }

  function clearPrescription() {
    setPrescriptionFile(null);
    setPrescriptionImageUrl("");
    setPrescriptionUploadError("");
  }

  async function submitCreateRequest() {
    const trimmedNote = createForm.requestNote.trim();
    const nextErrors: typeof createErrors = {};
    if (!createForm.diseaseGroup) nextErrors.diseaseGroup = "Chọn nhóm bệnh cần hỗ trợ.";
    if (!trimmedNote) nextErrors.requestNote = "Nhập thông tin bạn muốn bác sĩ lưu ý.";
    else if (trimmedNote.length > 2000) nextErrors.requestNote = "Nội dung không được vượt quá 2.000 ký tự.";
    setCreateErrors(nextErrors);
    setCreateError("");
    setProfileReadinessIssues([]);
    if (Object.keys(nextErrors).length > 0) return "invalid" as const;

    setCreating(true);
    setCreateNeedsSubscription(false);
    try {
      const readinessResponse = await recoveryPlanRequestsApi.readiness({
        diseaseGroup: createForm.diseaseGroup,
        requestNote: trimmedNote,
      });
      const readiness = readinessResponse.data;
      if (readiness?.isReady !== true) {
        const mapped = mapReadinessIssues(readiness?.issues ?? []);
        setCreateErrors(mapped.errors);
        setProfileReadinessIssues(mapped.profileIssues);
        setCreateError("Hồ sơ y tế hoặc thông tin yêu cầu chưa đủ. Vui lòng kiểm tra lại.");
        return "invalid" as const;
      }

      let uploadedPrescriptionUrl = prescriptionImageUrl || null;
      if (prescriptionFile && !uploadedPrescriptionUrl) {
        setPrescriptionUploading(true);
        setPrescriptionUploadError("");
        try {
          const uploadResult = await uploadImageToCloudinary(prescriptionFile);
          uploadedPrescriptionUrl = uploadResult.secureUrl;
          setPrescriptionImageUrl(uploadedPrescriptionUrl);
        } catch (uploadError) {
          setPrescriptionUploadError(
            uploadError instanceof Error ? uploadError.message : "Không thể tải ảnh đơn thuốc lên. Vui lòng thử lại hoặc xóa ảnh để tiếp tục mà không gửi đơn thuốc.",
          );
          return "error" as const;
        } finally {
          setPrescriptionUploading(false);
        }
      }

      const createResponse = await recoveryPlanRequestsApi.create(
        {
          diseaseGroup: createForm.diseaseGroup as DiseaseGroup,
          treatmentJourneyId: null,
          primaryLabTestSessionId: createForm.primaryLabTestSessionId || null,
          requestNote: trimmedNote,
          prescriptionImageUrl: uploadedPrescriptionUrl,
        },
        idempotencyKeyRef.current,
      );
      const createdRequest = createResponse.data ?? null;
      if (createdRequest) {
        setPinnedRequest(isInProgressRequest(createdRequest) ? createdRequest : null);
        setRequests((current) => {
          const alreadyInPage = current.items.some((item) => item.id === createdRequest.id);
          return {
            ...current,
            pageNumber: 1,
            totalCount: current.totalCount + (alreadyInPage ? 0 : 1),
            totalPages: Math.max(1, Math.ceil((current.totalCount + (alreadyInPage ? 0 : 1)) / PAGE_SIZE)),
            items: [createdRequest, ...current.items.filter((item) => item.id !== createdRequest.id)].slice(0, PAGE_SIZE),
          };
        });
      }
      resetCreateForm();
      setRequestsPage(1);
      loadRequests(1);
      loadQuota();
      return "success" as const;
    } catch (error) {
      const payload = errorPayload(error);
      setCreateNeedsSubscription(isNoActiveSubscriptionError(payload));
      setCreateError(getRecoveryErrorMessage(payload, "Không thể gửi yêu cầu. Vui lòng thử lại."));
      return "error" as const;
    } finally {
      setCreating(false);
    }
  }

  async function cancelRequest(requestId: string) {
    setCancellingId(requestId);
    try {
      const response = await recoveryPlanRequestsApi.cancel(requestId);
      const cancelledRequest =
        response.data ??
        (selectedRequest?.id === requestId ? ({ ...selectedRequest, status: "cancelled" } as RecoveryPlanRequest) : null);

      if (cancelledRequest) {
        setSelectedRequest(cancelledRequest);
        setPinnedRequest((current) => (current?.id === requestId ? (isInProgressRequest(cancelledRequest) ? cancelledRequest : null) : current));
        setRequests((current) => ({
          ...current,
          items: current.items.map((item) => (item.id === requestId ? cancelledRequest : item)),
        }));
      }

      await Promise.allSettled([loadRequests(requestsPage), loadQuota()]);
      return "success" as const;
    } catch (error) {
      return { status: "error" as const, message: getRecoveryErrorMessage(errorPayload(error), "Không thể hủy yêu cầu. Vui lòng thử lại.") };
    } finally {
      setCancellingId(null);
    }
  }

  async function submitMoreInformation(requestId: string, additionalInformation: string) {
    const trimmed = additionalInformation.trim();
    if (!trimmed) return { status: "invalid" as const, message: "Vui lòng nhập thông tin bổ sung." };
    if (trimmed.length > 2000) return { status: "invalid" as const, message: "Nội dung không được vượt quá 2.000 ký tự." };

    setProvidingInfo(true);
    try {
      const response = await recoveryPlanRequestsApi.provideInformation(requestId, trimmed);
      const updatedRequest = response.data ?? null;
      setSelectedRequest(updatedRequest);
      if (updatedRequest) {
        setPinnedRequest((current) => (current?.id === requestId ? (isInProgressRequest(updatedRequest) ? updatedRequest : null) : current));
        setRequests((current) => ({
          ...current,
          items: current.items.map((item) => (item.id === requestId ? updatedRequest : item)),
        }));
      }
      loadRequests(requestsPage);
      return { status: "success" as const };
    } catch (error) {
      return { status: "error" as const, message: getRecoveryErrorMessage(errorPayload(error), "Không thể gửi thông tin bổ sung. Vui lòng thử lại.") };
    } finally {
      setProvidingInfo(false);
    }
  }

  async function startPlan(planId: string) {
    setStartingId(planId);
    try {
      const response = await recoveryPlansApi.start(planId);
      setSelectedPlan(response.data ?? null);
      loadPlans(plansPage);
      return "success" as const;
    } catch (error) {
      return { status: "error" as const, message: getRecoveryErrorMessage(errorPayload(error), "Không thể bắt đầu kế hoạch. Vui lòng thử lại.") };
    } finally {
      setStartingId(null);
    }
  }

  async function cancelPlan(planId: string) {
    setCancellingPlanId(planId);
    try {
      const response = await recoveryPlansApi.cancel(planId);
      const cancelledPlan =
        response.data ??
        (selectedPlan?.id === planId ? ({ ...selectedPlan, status: "cancelled" } as RecoveryPlan) : null);

      if (cancelledPlan) {
        setSelectedPlan(cancelledPlan);
        setPlans((current) => ({
          ...current,
          items: current.items.map((item) => (item.id === planId ? cancelledPlan : item)),
        }));
      }

      await Promise.allSettled([loadPlans(plansPage), loadQuota()]);
      return "success" as const;
    } catch (error) {
      return { status: "error" as const, message: getRecoveryErrorMessage(errorPayload(error), "Không thể hủy kế hoạch. Vui lòng thử lại.") };
    } finally {
      setCancellingPlanId(null);
    }
  }

  return {
    quota,
    quotaState,
    quotaMessage,
    quotaNeedsSubscription,
    reloadQuota: loadQuota,

    requests: requests.items,
    requestsState,
    requestsError,
    requestsPage,
    setRequestsPage,
    requestsInfo: requests,
    pinnedRequest,

    selectedRequest,
    requestDetailState,
    selectRequest,
    clearSelectedRequest,

    plans: plans.items,
    plansState,
    plansError,
    plansPage,
    setPlansPage,
    plansInfo: plans,

    selectedPlan,
    planDetailState,
    selectPlan,
    selectPlanById,
    clearSelectedPlan,

    feedbackVisible,
    feedbackSubmitting,
    feedbackError,
    shouldAutoPromptFeedback,
    openFeedback,
    closeFeedback,
    submitFeedback,

    createForm,
    createErrors,
    creating,
    createError,
    createNeedsSubscription,
    profileReadinessIssues,
    updateCreateField,
    resetCreateForm,
    submitCreateRequest,

    labSessions,
    labSessionsState,
    labSessionsError,

    prescriptionFile,
    prescriptionImageUrl,
    prescriptionUploading,
    prescriptionUploadError,
    setPrescriptionFile,
    clearPrescription,

    cancellingId,
    cancelRequest,
    providingInfo,
    submitMoreInformation,
    startingId,
    startPlan,
    cancellingPlanId,
    cancelPlan,

    reloadAll,
  };
}
