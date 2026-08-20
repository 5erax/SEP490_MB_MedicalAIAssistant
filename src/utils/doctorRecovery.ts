import { ApiError } from "@/src/api/client";

export type DoctorRequestAction = "accept" | "startReview" | "openPlan" | "release" | "reject";

export function normalizeRecoveryStatus(status: string | number | null | undefined) {
  return String(status ?? "").replaceAll("_", "").toLowerCase();
}

export function getDoctorRequestActions(status: string | number, hasPlan: boolean): DoctorRequestAction[] {
  const normalized = normalizeRecoveryStatus(status);
  if (["waitingfordoctor", "0"].includes(normalized)) return ["accept"];
  if (["assigned", "1"].includes(normalized)) return ["startReview", "release", "reject"];
  if (["inreview", "2"].includes(normalized)) return ["openPlan", "release", "reject"];
  if (["published", "4"].includes(normalized) && hasPlan) return ["openPlan"];
  return [];
}

export function getDoctorRecoveryErrorMessage(error: unknown) {
  const apiError = error as ApiError;
  const payload = apiError?.payload && typeof apiError.payload === "object"
    ? apiError.payload as Record<string, unknown>
    : {};
  const code = String(payload.code ?? "");

  if (code === "RECOVERY_PLAN_REQUEST_ALREADY_CLAIMED" || apiError.status === 409) {
    return "Yêu cầu đã thay đổi hoặc được bác sĩ khác nhận. Danh sách sẽ được tải lại.";
  }
  if (apiError.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (apiError.status === 403) return "Bạn không có quyền thực hiện thao tác này trên yêu cầu.";
  if (apiError.status === 404) return "Không tìm thấy yêu cầu hoặc kế hoạch trong phạm vi được cấp quyền.";
  return apiError?.message || "Không thể cập nhật yêu cầu. Vui lòng thử lại.";
}
