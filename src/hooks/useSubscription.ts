import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { useToast } from "@/src/hooks/useToast";
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
import { CheckoutState, SubscriptionPlan, SubscriptionUsageQuota, UserSubscription } from "@/src/types/subscription";
import { isSuccessfulPayment, isTerminalPayment } from "@/src/utils/subscriptionPlanPresentation";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100;
const FATAL_PAYMENT_STATUSES = new Set([400, 401, 403, 404, 409]);

function pendingCheckoutState(checkout: PendingPaymentCheckout, message?: string): CheckoutState {
  return {
    status: "pending",
    paymentId: checkout.paymentId,
    orderCode: checkout.orderCode,
    planId: checkout.planId,
    message:
      message
      ?? "Đang chờ PayOS xác nhận. Sau khi thanh toán, hãy quay lại ứng dụng để hệ thống tự cập nhật.",
  };
}

export function useSubscription() {
  const { session, setSession } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(Boolean(session));
  const [subscriptionsError, setSubscriptionsError] = useState("");
  const [usageList, setUsageList] = useState<SubscriptionUsageQuota[]>([]);
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
    } catch {
      setSubscriptions([]);
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
  }, [session, showToast]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const loadUsage = useCallback(async () => {
    if (!session) {
      setUsageList([]);
      return [] as SubscriptionUsageQuota[];
    }
    try {
      const response = await subscriptionUsageApi.getUsage();
      const data = response.data;
      const items = Array.isArray(data) ? data : data ? [data] : [];
      setUsageList(items);
      return items;
    } catch {
      setUsageList([]);
      return [] as SubscriptionUsageQuota[];
    }
  }, [session]);

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
      await loadUsage();
    } catch {
      // Quota information is supplementary to the checkout result.
    }
  }, [loadSubscriptions, loadUsage, setSession]);

  const inspectPayment = useCallback(
    async (checkout: PendingPaymentCheckout, { reconcile = false } = {}) => {
      if (paymentCheckInFlight.current) return "busy" as const;
      paymentCheckInFlight.current = true;
      setCheckingPayment(true);

      try {
        if (reconcile && checkout.orderCode) {
          try {
            await paymentsApi.reconcilePayOs(checkout.orderCode);
          } catch (error) {
            const status = (error as { status?: number })?.status;
            if (status && FATAL_PAYMENT_STATUSES.has(status)) {
              stopPolling();
              await forgetPendingCheckout();
              setCheckoutState({
                status: "error",
                paymentId: checkout.paymentId,
                orderCode: checkout.orderCode,
                message:
                  status === 401
                    ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để kiểm tra giao dịch."
                    : "Giao dịch không hợp lệ hoặc không thuộc tài khoản hiện tại.",
              });
              return "terminal" as const;
            }
          }
        }

        const response = await paymentsApi.getMyPayment(checkout.paymentId);
        const payment = response.data;

        if (isSuccessfulPayment(payment)) {
          stopPolling();
          await forgetPendingCheckout();
          setCheckoutState({
            status: "success",
            paymentId: checkout.paymentId,
            orderCode: checkout.orderCode,
            message: "Thanh toán thành công. Quyền lợi MediMate Plus đã được cập nhật.",
          });
          await refreshEntitlements();
          showToast({
            type: "success",
            title: "Thanh toán thành công",
            message: "Quyền lợi MediMate Plus đã được kích hoạt.",
          });
          return "success" as const;
        }

        if (isTerminalPayment(payment)) {
          stopPolling();
          await forgetPendingCheckout();
          setCheckoutState({
            status: "error",
            paymentId: checkout.paymentId,
            orderCode: checkout.orderCode,
            message: `Giao dịch ${payment?.statusName || "không thành công"}.`,
          });
          return "terminal" as const;
        }

        setCheckoutState(pendingCheckoutState(checkout));
        return "pending" as const;
      } catch (error) {
        const status = (error as { status?: number })?.status;
        if (status && [401, 403, 404].includes(status)) {
          stopPolling();
          await forgetPendingCheckout();
          setCheckoutState({
            status: "error",
            paymentId: checkout.paymentId,
            orderCode: checkout.orderCode,
            message:
              status === 401
                ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                : "Không tìm thấy giao dịch thuộc tài khoản hiện tại.",
          });
          return "terminal" as const;
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
        if (result === "success" || result === "terminal") return true;

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
      await WebBrowser.openBrowserAsync(checkout.paymentUrl);
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
        planId,
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
          planId,
        };
        pendingCheckoutRef.current = checkout;
        try {
          await setPendingPaymentCheckout(checkout);
        } catch {
          // Continue checkout in memory; persistence is a recovery aid.
        }

        setCheckoutState(pendingCheckoutState(checkout, "PayOS đang được mở. Sau khi hoàn tất, hãy quay lại MediMate."));
        void pollPayment(checkout);

        try {
          await WebBrowser.openBrowserAsync(checkout.paymentUrl);
        } finally {
          if (pendingCheckoutRef.current?.paymentId === checkout.paymentId) {
            void pollPayment(checkout);
          }
        }
      } catch {
        if (!pendingCheckoutRef.current) {
          setCheckoutState({
            status: "error",
            paymentId: "",
            message: "Chưa thể tạo liên kết thanh toán lúc này. Vui lòng thử lại sau.",
          });
        }
      }
    },
    [pollPayment, stopPolling],
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
    loadUsage();
  }, [loadSubscriptions, loadUsage]);

  useEffect(() => {
    let active = true;
    if (!session) {
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
  }, [pollPayment, session, stopPolling]);

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
    usageList,
    reloadSubscriptions: loadSubscriptions,
    checkoutState,
    checkingPayment,
    startCheckout,
    checkPendingPayment,
    reopenCheckout,
    cancelSubscription,
  };
}
