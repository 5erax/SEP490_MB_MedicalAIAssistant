import { ApiErrorPayload } from "@/src/types/api";
import {
  DiseaseGroup,
  RecoveryPlanReadinessIssue,
  RecoveryPlanRequestStatus,
  RecoveryPlanStatus,
} from "@/src/types/recoveryPlan";

export type StatusTone = "warning" | "success" | "danger" | "neutral" | "cancelled";

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
  cancelled: { label: "Đã hủy", tone: "cancelled" },
  expired: { label: "Đã hết hạn", tone: "neutral" },
};

export const CANCELLABLE_REQUEST_STATUSES = new Set<RecoveryPlanRequestStatus>([
  "waitingForDoctor",
  "assigned",
  "inReview",
  "needMoreInformation",
]);

export const CANCELLABLE_PLAN_STATUSES = new Set<RecoveryPlanStatus>(["readyToStart", "active"]);

export const PLAN_STATUS: Record<RecoveryPlanStatus, { label: string; tone: StatusTone }> = {
  readyToStart: { label: "Sẵn sàng bắt đầu", tone: "warning" },
  active: { label: "Đang thực hiện", tone: "warning" },
  completed: { label: "Đã hoàn thành", tone: "success" },
  cancelled: { label: "Đã hủy", tone: "cancelled" },
  superseded: { label: "Đã thay thế", tone: "neutral" },
};

function normalizeErrorCode(value: unknown) {
  const code = String(value ?? "").trim();
  return /^[A-Z][A-Z0-9_]+$/.test(code) ? code : "";
}

export function getApiErrorCode(payload: ApiErrorPayload | undefined) {
  const errors = payload?.errors;
  const candidates: unknown[] = [];

  if (Array.isArray(errors)) {
    candidates.push(...errors);
  } else if (errors && typeof errors === "object") {
    candidates.push(...Object.keys(errors), ...Object.values(errors).flat());
  } else if (errors) {
    candidates.push(errors);
  }

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const nested = normalizeErrorCode((candidate as { code?: string }).code);
      if (nested) return nested;
      continue;
    }
    const normalized = normalizeErrorCode(candidate);
    if (normalized) return normalized;
  }

  return normalizeErrorCode((payload as { code?: string } | undefined)?.code);
}

const ERROR_MESSAGES: Record<string, string> = {
  NO_CREDIT_PACKAGE: "Bạn chưa có lượt sử dụng. Hãy mua gói lượt để bắt đầu dịch vụ này.",
  SERVICE_CREDIT_EXHAUSTED: "Bạn đã dùng hết lượt. Mua thêm lượt để tiếp tục sử dụng các dịch vụ MediMate.",
  SERVICE_CREDIT_NOT_CONFIGURED: "Dịch vụ lượt dùng chưa sẵn sàng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
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
  const code = getApiErrorCode(payload);
  return code === "NO_ACTIVE_SUBSCRIPTION" || code === "NO_CREDIT_PACKAGE" || code === "SERVICE_CREDIT_EXHAUSTED";
}

const READINESS_MESSAGES: Record<string, string> = {
  PATIENT_PROFILE_REQUIRED: "Bạn cần hoàn thành hồ sơ y tế trước khi gửi yêu cầu.",
  HEIGHT_REQUIRED: "Vui lòng cập nhật chiều cao trong hồ sơ y tế.",
  HEIGHT_INVALID: "Chiều cao trong hồ sơ y tế chưa hợp lệ.",
  WEIGHT_REQUIRED: "Vui lòng cập nhật cân nặng trong hồ sơ y tế.",
  WEIGHT_INVALID: "Cân nặng trong hồ sơ y tế chưa hợp lệ.",
  DISEASE_GROUP_REQUIRED: "Chọn nhóm bệnh cần hỗ trợ.",
  DISEASE_GROUP_INVALID: "Nhóm bệnh đã chọn không hợp lệ.",
  REQUEST_NOTE_REQUIRED: "Nhập thông tin bạn muốn bác sĩ lưu ý.",
  REQUEST_NOTE_TOO_LONG: "Nội dung không được vượt quá 2.000 ký tự.",
};

function getReadinessMessage(issue: RecoveryPlanReadinessIssue) {
  return READINESS_MESSAGES[issue?.code] ?? issue?.message ?? "Thông tin yêu cầu chưa đủ. Vui lòng kiểm tra lại.";
}

export function mapReadinessIssues(issues: RecoveryPlanReadinessIssue[] = []) {
  const errors: { diseaseGroup?: string; requestNote?: string } = {};
  const profileIssues: string[] = [];

  issues.forEach((issue) => {
    const message = getReadinessMessage(issue);
    if (issue?.code === "DISEASE_GROUP_REQUIRED" || issue?.code === "DISEASE_GROUP_INVALID") {
      errors.diseaseGroup = message;
      return;
    }
    if (issue?.code === "REQUEST_NOTE_REQUIRED" || issue?.code === "REQUEST_NOTE_TOO_LONG") {
      errors.requestNote = message;
      return;
    }
    profileIssues.push(message);
  });

  return { errors, profileIssues };
}

export function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getLabSessionLabel(session: { testDate?: string; processedAt?: string | null; createdAt?: string; facilityName?: string | null }) {
  const dateLabel = formatDateOnly(session?.testDate ?? session?.processedAt ?? session?.createdAt);
  const facilityLabel = session?.facilityName ? ` - ${session.facilityName}` : "";
  return `${dateLabel}${facilityLabel}`;
}

export function getLabSessionId(session: { sessionId?: string; testSessionId?: string; id?: string } | null | undefined) {
  return session?.sessionId ?? session?.testSessionId ?? session?.id ?? "";
}

function getTimeMs(value: unknown) {
  if (!value) return 0;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function normalizeCompletedLabSessions<
  T extends { sessionId?: string; testSessionId?: string; id?: string; status?: string; testDate?: string; processedAt?: string | null; createdAt?: string },
>(sessions: T[] = []) {
  return sessions
    .filter((session) => {
      const status = String(session?.status ?? "completed").toLowerCase();
      return getLabSessionId(session) && status === "completed";
    })
    .sort((left, right) => getTimeMs(right.createdAt ?? right.processedAt ?? right.testDate) - getTimeMs(left.createdAt ?? left.processedAt ?? left.testDate));
}

export function formatDateOnly(value: unknown) {
  if (!value) return "-";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}
