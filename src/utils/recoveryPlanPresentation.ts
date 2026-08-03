// Ported from the status/error maps inline in RecoveryPlanPage.jsx (Web) —
// there is no separate presentation file on Web either.
import { ApiErrorPayload } from "@/src/types/api";
import { DiseaseGroup, RecoveryPlanRequestStatus, RecoveryPlanStatus } from "@/src/types/recoveryPlan";

export type StatusTone = "warning" | "success" | "danger" | "neutral";

export const DISEASE_GROUPS: { value: DiseaseGroup; label: string }[] = [
  { value: "respiratory", label: "Hô hấp" },
  { value: "musculoskeletal", label: "Cơ xương khớp" },
  { value: "infectiousDisease", label: "Bệnh truyền nhiễm" },
];

export function getDiseaseGroupLabel(value: DiseaseGroup) {
  return DISEASE_GROUPS.find((group) => group.value === value)?.label ?? value;
}

export const REQUEST_STATUS: Record<RecoveryPlanRequestStatus, { label: string; tone: StatusTone }> = {
  waitingForDoctor: { label: "Đang chờ bác sĩ", tone: "warning" },
  assigned: { label: "Bác sĩ đã tiếp nhận", tone: "warning" },
  inReview: { label: "Đang xem xét", tone: "warning" },
  needMoreInformation: { label: "Cần bổ sung thông tin", tone: "warning" },
  published: { label: "Đã có kế hoạch", tone: "success" },
  rejected: { label: "Không thể tiếp nhận", tone: "danger" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
  expired: { label: "Đã hết hạn", tone: "neutral" },
};

export const CANCELLABLE_REQUEST_STATUSES = new Set<RecoveryPlanRequestStatus>([
  "waitingForDoctor",
  "assigned",
  "inReview",
  "needMoreInformation",
]);

export const PLAN_STATUS: Record<RecoveryPlanStatus, { label: string; tone: StatusTone }> = {
  readyToStart: { label: "Sẵn sàng bắt đầu", tone: "warning" },
  active: { label: "Đang thực hiện", tone: "warning" },
  completed: { label: "Đã hoàn thành", tone: "success" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
  superseded: { label: "Đã thay thế", tone: "neutral" },
};

function normalizeErrorCode(value: unknown) {
  const code = String(value ?? "").trim();
  return /^[A-Z][A-Z0-9_]+$/.test(code) ? code : "";
}

export function getApiErrorCode(payload: ApiErrorPayload | undefined) {
  const errors = payload?.errors;
  const candidates: unknown[] = [Array.isArray(errors) ? errors : []].flat();

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const nested = normalizeErrorCode((candidate as { code?: string }).code);
      if (nested) return nested;
      continue;
    }
    const normalized = normalizeErrorCode(candidate);
    if (normalized) return normalized;
  }

  return "";
}

const ERROR_MESSAGES: Record<string, string> = {
  NO_ACTIVE_SUBSCRIPTION: "Bạn cần một gói đang hoạt động để yêu cầu kế hoạch phục hồi.",
  RECOVERY_PLAN_QUOTA_NOT_CONFIGURED: "Hạn mức kế hoạch phục hồi chưa được cấu hình. Vui lòng thử lại sau.",
  RECOVERY_PLAN_QUOTA_EXHAUSTED: "Bạn đã dùng hết lượt trong chu kỳ hiện tại.",
  INVALID_USER_TIME_ZONE: "Múi giờ trong hồ sơ chưa hợp lệ. Vui lòng cập nhật hồ sơ.",
  INVALID_REQUEST_STATE: "Trạng thái yêu cầu đã thay đổi. Đang tải lại dữ liệu mới nhất.",
  QUOTA_MUTATION_FAILED: "Hạn mức chưa được cập nhật. Vui lòng tải lại rồi thử lại.",
};

export function getRecoveryErrorMessage(payload: ApiErrorPayload | undefined, fallback: string) {
  const code = getApiErrorCode(payload);
  return (code && ERROR_MESSAGES[code]) || payload?.message || fallback;
}

export function isNoActiveSubscriptionError(payload: ApiErrorPayload | undefined) {
  return getApiErrorCode(payload) === "NO_ACTIVE_SUBSCRIPTION";
}

export function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDateOnly(value: unknown) {
  if (!value) return "—";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}
