// Ported 1:1 from src/components/payments/PaymentHistoryPanel.jsx and
// src/pages/PaymentResultPage.jsx (Web).
import { ApiError } from "@/src/api/client";
import { Payment } from "@/src/types/subscription";

export type PaymentStatusTone = "warning" | "success" | "neutral" | "danger";

const PAYMENT_STATUS: Record<string, { label: string; tone: PaymentStatusTone }> = {
  pending: { label: "Đang chờ", tone: "warning" },
  paid: { label: "Đã thanh toán", tone: "success" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
  canceled: { label: "Đã hủy", tone: "neutral" },
  failed: { label: "Thất bại", tone: "danger" },
};

export function getPaymentStatus(payment: Payment | null | undefined) {
  const rawStatus = String(payment?.statusName ?? (payment as { status?: string })?.status ?? "Đang xử lý").trim();
  const presentation = PAYMENT_STATUS[rawStatus.toLowerCase()];
  return presentation ?? { label: rawStatus || "Đang xử lý", tone: "neutral" as PaymentStatusTone };
}

export function formatMoney(amount: unknown, currency = "VND") {
  const numericAmount = Number(amount);
  const normalizedCurrency = String(currency || "VND").toUpperCase();
  if (!Number.isFinite(numericAmount)) return "—";

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: normalizedCurrency === "VND" ? 0 : 2,
    }).format(numericAmount);
  } catch {
    return `${numericAmount.toLocaleString("vi-VN")} ${normalizedCurrency}`;
  }
}

export function formatDateTime(value: unknown) {
  if (!value) return "—";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

// Ported from canReconcilePayment (Web) — only pending PayOS payments with
// a known order code can be reconciled.
export function canReconcilePayment(payment: Payment | null | undefined) {
  const statusValue = String(payment?.statusName ?? (payment as { status?: string })?.status ?? "").toLowerCase();
  const provider = String(payment?.paymentProvider ?? payment?.provider ?? "").toLowerCase();
  const orderCode = String(payment?.transactionReference ?? "").trim();
  return statusValue === "pending" && provider === "payos" && Boolean(orderCode);
}

export function getReconcileErrorMessage(error: unknown) {
  const status = (error as ApiError)?.status;
  if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (status === 403) return "Giao dịch này không thuộc tài khoản hiện tại.";
  if (status === 404) return "PayOS không tìm thấy giao dịch này.";
  if (status === 409) return "Dữ liệu giao dịch không khớp. Vui lòng liên hệ hỗ trợ.";
  if (status === 429) return "Đang kiểm tra quá thường xuyên. Vui lòng thử lại sau ít phút.";
  if (status === 502) return "Chưa kết nối được PayOS. Vui lòng thử lại sau.";
  return "Không thể kiểm tra trạng thái giao dịch lúc này. Vui lòng thử lại.";
}

export function getHistoryErrorMessage(error: unknown) {
  if ((error as ApiError)?.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem lịch sử thanh toán.";
  }
  return "Chưa thể tải lịch sử thanh toán. Vui lòng thử lại sau.";
}

export function getDetailErrorMessage(error: unknown) {
  if ((error as ApiError)?.status === 404) {
    return "Không tìm thấy giao dịch này hoặc bạn không có quyền xem giao dịch.";
  }
  if ((error as ApiError)?.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }
  return "Chưa thể tải chi tiết giao dịch. Vui lòng thử lại sau.";
}

export type NormalizedPaymentPage = {
  items: Payment[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

export function normalizePaymentPage(response: { data?: unknown } | null, requestedPage: number): NormalizedPaymentPage {
  const data = (response?.data ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data) ? (data as Payment[]) : Array.isArray(data.items) ? (data.items as Payment[]) : [];
  const pageSize = Math.max(1, Number(data.pageSize) || PAGE_SIZE);
  const totalCount = Math.max(0, Number(data.totalCount) || items.length);
  const totalPages = Math.max(0, Number(data.totalPages) || Math.ceil(totalCount / pageSize));

  return {
    items,
    pageNumber: Math.max(1, Number(data.pageNumber) || requestedPage),
    pageSize,
    totalCount,
    totalPages,
  };
}
