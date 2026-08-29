import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";

import { useToast } from "@/src/hooks/useToast";
import { ROUTES } from "@/src/navigation/routes";
import { useAuth } from "@/src/providers";
import { authService, normalizeAuthSession } from "@/src/services/authService";
import {
  clearPendingPaymentCheckout,
  getPendingPaymentCheckout,
  PendingPaymentCheckout,
  setPendingPaymentCheckout,
} from "@/src/services/paymentCheckoutStorage";
import { paymentsApi, subscriptionPlansApi, userSubscriptionsApi } from "@/src/services/subscriptionService";
import { subscriptionUsageApi } from "@/src/services/subscriptionUsageService";
import { CheckoutState, PayOsReconcileResult, SubscriptionPlan, UserSubscription } from "@/src/types/subscription";
import { isSuccessfulPayment, isTerminalPayment } from "@/src/utils/subscriptionPlanPresentation";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100;
const BLOCKING_PAYMENT_STATUSES = new Set([400, 403, 404, 409]);
const handledTerminalPaymentIds = new Set<string>();

type UseSubscriptionOptions = {
  autoResumePending?: boolean;
};

function reconcileStatuses(result: PayOsReconcileResult) {
  return [result.paymentStatus, result.providerStatus, result.subscriptionStatus]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean);
}

function pendingCheckoutState(checkout: PendingPaymentCheckout, message?: string): CheckoutState {
  return {
    status: "pending",
    paymentId: checkout.paymentId,
    orderCode: checkout.orderCode,
    message:
      message
      ?? "Đang chờ PayOS xác nhận. Sau khi thanh toán, hãy quay lại ứng dụng để hệ thống tự cập nhật.",
  };
}

function claimTerminalPayment(paymentId: string) {
  if (handledTerminalPaymentIds.has(paymentId)) return false;
  handledTerminalPaymentIds.add(paymentId);
  return true;
}

async function openCheckoutUrl(paymentUrl: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.assign(paymentUrl);
    return;
  }

  await WebBrowser.openBrowserAsync(paymentUrl);
}

export function useSubscription({ autoResumePending = true }: UseSubscriptionOptions = {}) {
  const { clearSession, session, setSession } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(Boolean(session));
  const [subscriptionsError, setSubscriptionsError] = useState("");
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    status: "idle",
    message: "",
    paymentId: "",
  });
  const [checkingPayment, setCheckingPayment] = useState(false);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttempts = useRef(0);
  const paymentCheckInFlight = useRef(false);
  const pendingCheckoutRef = useRef<PendingPaymentCheckout | null>(null);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError("");
    try {
      const response = await subscriptionPlansApi.active();
      setPlans(Array.isArray(response.data) ? response.data : []);
    } catch {
      setPlans([]);
      setPlansError("Không thể tải thông tin gói.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    if (!session) return [] as UserSubscription[];
    setSubscriptionsLoading(true);
    setSubscriptionsError("");
    try {
      const response = await userSubscriptionsApi.me();
      const items = Array.isArray(response.data) ? response.data : [];
      setSubscriptions(items);
      return items;
    } catch (error) {
      setSubscriptions([]);
      if ((error as { status?: number })?.status === 401) {
        setSubscriptionsError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        await clearSession();
        return [] as UserSubscription[];
      }

      setSubscriptionsError("Chưa thể kiểm tra gói hiện tại.");
      showToast({
        type: "error",
        title: "Không thể tải gói đăng ký",
        message: "Vui lòng thử lại sau ít phút.",
      });
      return [] as UserSubscription[];
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [clearSession, session, showToast]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const forgetPendingCheckout = useCallback(async () => {
    pendingCheckoutRef.current = null;
    try {
      await clearPendingPaymentCheckout();
    } catch {
      // Storage cleanup must not turn a successful server result into an error.
    }
  }, []);

  const refreshEntitlements = useCallback(async () => {
    await loadSubscriptions();
    try {
      const response = await authService.refresh();
      const refreshedSession = normalizeAuthSession(response);
      if (refreshedSession) await setSession(refreshedSession);
    } catch {
      // The subscription endpoint is still refreshed if token refresh is unavailable.
    }
    try {
      await subscriptionUsageApi.getUsage();
    } catch {
      // Quota information is supplementary to the checkout result.
    }
  }, [loadSubscriptions, setSession]);

  const inspectPayment = useCallback(
    async (checkout: PendingPaymentCheckout, { reconcile = false } = {}) => {
      if (paymentCheckInFlight.current) return "busy" as const;
      paymentCheckInFlight.current = true;
      setCheckingPayment(true);

      try {
        if (reconcile && checkout.orderCode) {
          try {
            const response = await paymentsApi.reconcilePayOs(checkout.orderCode);
            const reconciled = response.data;

            if (reconciled) {
              const statuses = reconcileStatuses(reconciled);
              const wasCancelled = reconciled.isCancelled === true
                || statuses.some((status) => ["cancelled", "canceled"].includes(status));
              const wasFailed = statuses.some((status) => ["failed", "expired", "refunded"].includes(status));

              if (reconciled.isPaid === true && reconciled.isActive === true) {
                const shouldAnnounce = claimTerminalPayment(checkout.paymentId);
                stopPolling();
                await forgetPendingCheckout();
                setCheckoutState({
                  status: "success",
                  paymentId: checkout.paymentId,
                  orderCode: checkout.orderCode,
                  message: "Thanh toán thành công. Gói dịch vụ và số lượt của bạn đã được cập nhật.",
                });
                if (shouldAnnounce) {
                  await refreshEntitlements();
                  showToast({
                    type: "success",
                    title: "Thanh toán thành công",
                    message: "Gói dịch vụ và số lượt của bạn đã được cập nhật.",
                  });
                }
                return "success" as const;
              }

              if (wasCancelled || wasFailed) {
                const shouldAnnounce = claimTerminalPayment(checkout.paymentId);
                stopPolling();
                await forgetPendingCheckout();
                setCheckoutState({
                  status: wasCancelled ? "cancelled" : "error",
                  paymentId: checkout.paymentId,
                  orderCode: checkout.orderCode,
                  message: wasCancelled
                    ? "Giao dịch không được hoàn tất và gói mới chưa được kích hoạt."
                    : reconciled.message || "PayOS xác nhận giao dịch không thành công.",
                });
                if (shouldAnnounce) {
                  showToast({
                    type: wasCancelled ? "info" : "error",
                    title: wasCancelled ? "Thanh toán đã hủy" : "Thanh toán không thành công",
                    message: wasCancelled
                      ? "Giao dịch không được hoàn tất."
                      : "Vui lòng kiểm tra giao dịch hoặc thử lại sau.",
                  });
                }
                return "terminal" as const;
              }

              setCheckoutState(
                pendingCheckoutState(
                  checkout,
                  reconciled.isPaid
                    ? "Thanh toán đã được ghi nhận. MediMate đang kích hoạt quyền lợi của bạn."
                    : reconciled.message || "PayOS chưa hoàn tất xử lý giao dịch. Hệ thống sẽ tiếp tục kiểm tra.",
                ),
              );
              return "pending" as const;
            }
          } catch (error) {
            const status = (error as { status?: number })?.status;
            if (status === 401) {
              stopPolling();
              setCheckoutState({
                status: "error",
                paymentId: checkout.paymentId,
                orderCode: checkout.orderCode,
                message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để kiểm tra giao dịch.",
              });
              return "blocked" as const;
            }
            if (status && BLOCKING_PAYMENT_STATUSES.has(status)) {
              stopPolling();
              setCheckoutState({
                status: "error",
                paymentId: checkout.paymentId,
                orderCode: checkout.orderCode,
                message: "Giao dịch không hợp lệ, không thuộc tài khoản hiện tại hoặc đang xung đột.",
              });
              return "blocked" as const;
            }
          }
        }

        const response = await paymentsApi.getMyPayment(checkout.paymentId);
        const payment = response.data;

        if (isSuccessfulPayment(payment)) {
          const shouldAnnounce = claimTerminalPayment(checkout.paymentId);
          stopPolling();
          await forgetPendingCheckout();
          setCheckoutState({
            status: "success",
            paymentId: checkout.paymentId,
            orderCode: checkout.orderCode,
            message: "Thanh toán thành công. Quyền lợi MediMate Plus đã được cập nhật.",
          });
          if (shouldAnnounce) {
            await refreshEntitlements();
            showToast({
              type: "success",
              title: "Thanh toán thành công",
              message: "Quyền lợi MediMate Plus đã được kích hoạt.",
            });
          }
          return "success" as const;
        }

        if (isTerminalPayment(payment)) {
          const normalizedStatus = String(payment?.statusName ?? "").toLowerCase();
          const wasCancelled = ["cancelled", "canceled"].includes(normalizedStatus);
          const shouldAnnounce = claimTerminalPayment(checkout.paymentId);
          stopPolling();
          await forgetPendingCheckout();
          setCheckoutState({
            status: wasCancelled ? "cancelled" : "error",
            paymentId: checkout.paymentId,
            orderCode: checkout.orderCode,
            message: wasCancelled
              ? "Bạn đã hủy thanh toán. Không có khoản tiền nào được ghi nhận."
              : `Giao dịch ${payment?.statusName || "không thành công"}.`,
          });
          if (shouldAnnounce) {
            showToast({
              type: wasCancelled ? "info" : "error",
              title: wasCancelled ? "Đã hủy thanh toán" : "Thanh toán không thành công",
              message: wasCancelled
                ? "Bạn đã quay lại MediMate và có thể chọn gói khác."
                : "Vui lòng kiểm tra giao dịch hoặc thử lại sau.",
            });
          }
          return "terminal" as const;
        }

        setCheckoutState(pendingCheckoutState(checkout));
        return "pending" as const;
      } catch (error) {
        const status = (error as { status?: number })?.status;
        if (status && [401, 403, 404].includes(status)) {
          stopPolling();
          setCheckoutState({
            status: "error",
            paymentId: checkout.paymentId,
            orderCode: checkout.orderCode,
            message:
              status === 401
                ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                : "Không tìm thấy giao dịch thuộc tài khoản hiện tại.",
          });
          return "blocked" as const;
        }

        setCheckoutState(
          pendingCheckoutState(
            checkout,
            "Chưa kết nối được máy chủ để xác nhận. Giao dịch vẫn được lưu và sẽ được kiểm tra lại khi có mạng.",
          ),
        );
        return "retry" as const;
      } finally {
        paymentCheckInFlight.current = false;
        setCheckingPayment(false);
      }
    },
    [forgetPendingCheckout, refreshEntitlements, showToast, stopPolling],
  );

  const pollPayment = useCallback(
    async (checkout: PendingPaymentCheckout, resetAttempts = true) => {
      stopPolling();
      if (resetAttempts) pollAttempts.current = 0;

      const check = async () => {
        pollAttempts.current += 1;
        const result = await inspectPayment(checkout, {
          reconcile: pollAttempts.current === 1 || pollAttempts.current % 4 === 0,
        });
        if (["success", "terminal", "blocked"].includes(result)) return true;

        if (pollAttempts.current >= MAX_POLL_ATTEMPTS) {
          setCheckoutState(
            pendingCheckoutState(
              checkout,
              "Chưa nhận được xác nhận sau một thời gian. Giao dịch vẫn được lưu; bạn có thể kiểm tra ngay hoặc mở lại PayOS.",
            ),
          );
          return true;
        }
        return false;
      };

      if (!(await check())) {
        pollTimer.current = setInterval(() => {
          void check().then((completed) => {
            if (completed) stopPolling();
          });
        }, POLL_INTERVAL_MS);
      }
    },
    [inspectPayment, stopPolling],
  );

  const resolvePendingCheckout = useCallback(async () => {
    return pendingCheckoutRef.current ?? getPendingPaymentCheckout();
  }, []);

  const checkPendingPayment = useCallback(async () => {
    const checkout = await resolvePendingCheckout();
    if (!checkout) {
      setCheckoutState({
        status: "error",
        paymentId: "",
        message: "Không còn giao dịch đang chờ để kiểm tra.",
      });
      return;
    }

    pendingCheckoutRef.current = checkout;
    const result = await inspectPayment(checkout, { reconcile: true });
    if (["pending", "retry"].includes(result)) {
      showToast({
        type: "info",
        title: "Giao dịch đang chờ",
        message: "PayOS chưa xác nhận thanh toán. Bạn có thể thử lại sau ít phút.",
      });
    }
  }, [inspectPayment, resolvePendingCheckout, showToast]);

  const checkPaymentResult = useCallback(
    async (orderCode: string) => {
      const normalizedOrderCode = String(orderCode ?? "").trim();
      if (!/^\d+$/.test(normalizedOrderCode) || Number(normalizedOrderCode) <= 0) {
        stopPolling();
        setCheckoutState({
          status: "error",
          paymentId: "",
          orderCode: normalizedOrderCode || undefined,
          message: "Không thể xác định giao dịch từ liên kết thanh toán.",
        });
        return "invalid" as const;
      }

      const pending = await getPendingPaymentCheckout();
      if (!pending) {
        stopPolling();
        setCheckoutState({
          status: "error",
          paymentId: "",
          orderCode: normalizedOrderCode,
          message: "Không tìm thấy giao dịch đang chờ trên thiết bị này.",
        });
        return "missing" as const;
      }

      if (pending.orderCode && pending.orderCode !== normalizedOrderCode) {
        stopPolling();
        setCheckoutState({
          status: "error",
          paymentId: pending.paymentId,
          orderCode: normalizedOrderCode,
          message: "Mã giao dịch không khớp với thanh toán đang chờ trên thiết bị.",
        });
        return "mismatch" as const;
      }

      const checkout = { ...pending, orderCode: normalizedOrderCode };
      pendingCheckoutRef.current = checkout;
      setCheckoutState(
        pendingCheckoutState(checkout, "MediMate đang kiểm tra trạng thái giao dịch với PayOS."),
      );

      const result = await inspectPayment(checkout, { reconcile: true });
      if (["pending", "retry"].includes(result)) {
        void pollPayment(checkout);
      }
      return result;
    },
    [inspectPayment, pollPayment, stopPolling],
  );

  const reopenCheckout = useCallback(async () => {
    const checkout = await resolvePendingCheckout();
    if (!checkout) {
      setCheckoutState({
        status: "error",
        paymentId: "",
        message: "Liên kết thanh toán đã hết hạn hoặc không còn trên thiết bị.",
      });
      return;
    }

    pendingCheckoutRef.current = checkout;
    setCheckoutState(pendingCheckoutState(checkout, "PayOS đang được mở. Sau khi hoàn tất, hãy quay lại MediMate."));
    try {
      await openCheckoutUrl(checkout.paymentUrl);
    } finally {
      if (pendingCheckoutRef.current?.paymentId === checkout.paymentId) {
        void pollPayment(checkout);
      }
    }
  }, [pollPayment, resolvePendingCheckout]);

  const startCheckout = useCallback(
    async (planId: string, autoRenew: boolean) => {
      if (!planId) return;
      stopPolling();
      setCheckoutState({
        status: "creating",
        message: "Đang tạo liên kết thanh toán PayOS...",
        paymentId: "",
      });

      try {
        const response = await userSubscriptionsApi.checkout(planId, autoRenew);
        const checkoutResponse = response.data;
        if (!checkoutResponse?.paymentUrl || !checkoutResponse?.paymentId) {
          throw new Error("Checkout response is incomplete");
        }

        const checkout: PendingPaymentCheckout = {
          paymentId: checkoutResponse.paymentId,
          paymentUrl: checkoutResponse.paymentUrl,
          orderCode: String(checkoutResponse.orderCode ?? "").trim() || undefined,
          createdAt: Date.now(),
        };
        handledTerminalPaymentIds.delete(checkout.paymentId);
        pendingCheckoutRef.current = checkout;
        try {
          await setPendingPaymentCheckout(checkout);
        } catch {
          // Continue checkout in memory; persistence is a recovery aid.
        }

        setCheckoutState(pendingCheckoutState(checkout, "PayOS đang được mở. Sau khi hoàn tất, hãy quay lại MediMate."));
        void pollPayment(checkout);

        try {
          await openCheckoutUrl(checkout.paymentUrl);
        } finally {
          if (pendingCheckoutRef.current?.paymentId === checkout.paymentId) {
            void pollPayment(checkout);
          }
        }
      } catch (error) {
        const status = (error as { status?: number })?.status;
        if (status === 401) {
          stopPolling();
          await clearSession();
          setCheckoutState({
            status: "error",
            paymentId: "",
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục thanh toán.",
          });
          showToast({
            type: "warning",
            title: "Cần đăng nhập lại",
            message: "Phiên của bạn đã hết hạn nên chưa có giao dịch nào được tạo.",
          });
          router.push(ROUTES.PUBLIC.LOGIN);
          return;
        }

        if (!pendingCheckoutRef.current) {
          const apiMessage = error instanceof Error ? error.message.trim() : "";
          setCheckoutState({
            status: "error",
            paymentId: "",
            message: status === 409 && apiMessage
              ? apiMessage
              : "Chưa thể tạo liên kết thanh toán lúc này. Vui lòng thử lại sau.",
          });
        }
      }
    },
    [clearSession, pollPayment, showToast, stopPolling],
  );

  const cancelSubscription = useCallback(
    async (subscriptionId: string) => {
      try {
        await userSubscriptionsApi.cancel(subscriptionId);
        await loadSubscriptions();
        showToast({
          type: "success",
          title: "Đã hủy gia hạn",
          message: "Gói hiện tại vẫn có hiệu lực đến ngày kết thúc.",
        });
        return true;
      } catch {
        showToast({
          type: "error",
          title: "Không thể hủy gói",
          message: "Vui lòng thử lại sau ít phút.",
        });
        return false;
      }
    },
    [loadSubscriptions, showToast],
  );

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    let active = true;
    if (!session || !autoResumePending) {
      stopPolling();
      pendingCheckoutRef.current = null;
      return () => {
        active = false;
      };
    }

    void getPendingPaymentCheckout().then((checkout) => {
      if (!active || !checkout) return;
      pendingCheckoutRef.current = checkout;
      setCheckoutState(pendingCheckoutState(checkout, "Đang khôi phục giao dịch thanh toán chưa hoàn tất..."));
      void pollPayment(checkout);
    });

    return () => {
      active = false;
    };
  }, [autoResumePending, pollPayment, session, stopPolling]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" || !pendingCheckoutRef.current) return;
      void pollPayment(pendingCheckoutRef.current);
    });
    return () => subscription.remove();
  }, [pollPayment]);

  useEffect(
    () => () => {
      stopPolling();
    },
    [stopPolling],
  );

  return {
    plans,
    plansLoading,
    plansError,
    reloadPlans: loadPlans,
    subscriptions,
    subscriptionsLoading,
    subscriptionsError,
    reloadSubscriptions: loadSubscriptions,
    checkoutState,
    checkingPayment,
    startCheckout,
    checkPendingPayment,
    checkPaymentResult,
    reopenCheckout,
    cancelSubscription,
  };
}
