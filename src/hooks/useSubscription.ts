// Ported from src/pages/PricingPage.jsx (Web) — plan loading, current
// subscription loading, checkout + payment polling, cancel. Web opens the
// PayOS URL in a new browser tab/popup and polls in the background while
// it's open; mobile uses expo-web-browser's in-app browser (closest native
// equivalent to a popup) and starts the same polling once it's launched,
// since there is no postMessage-style signal back from the payment tab —
// polling is the reliable mechanism on both platforms.
import { useCallback, useEffect, useRef, useState } from "react";
import * as WebBrowser from "expo-web-browser";

import { authService } from "@/src/services/authService";
import { paymentsApi, subscriptionPlansApi, userSubscriptionsApi } from "@/src/services/subscriptionService";
import { CheckoutState, SubscriptionPlan, UserSubscription } from "@/src/types/subscription";
import { isSuccessfulPayment, isTerminalPayment } from "@/src/utils/subscriptionPlanPresentation";
import { useAuth } from "@/src/providers";
import { useToast } from "@/src/hooks/useToast";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100;

export function useSubscription() {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");

  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(Boolean(session));
  const [subscriptionsError, setSubscriptionsError] = useState("");

  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ status: "idle", message: "", paymentId: "" });
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttempts = useRef(0);

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
      showToast({ type: "error", title: "Không thể tải gói đăng ký", message: "Vui lòng thử lại sau ít phút." });
      return [] as UserSubscription[];
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [session, showToast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(
    () => () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    },
    [],
  );

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const pollPayment = useCallback(
    async (paymentId: string) => {
      stopPolling();
      pollAttempts.current = 0;

      const check = async () => {
        pollAttempts.current += 1;
        try {
          const response = await paymentsApi.getMyPayment(paymentId);
          const payment = response.data;

          if (isSuccessfulPayment(payment)) {
            stopPolling();
            setCheckoutState({ status: "success", paymentId, message: "Thanh toán thành công. Gói MediMate Plus đang được kích hoạt." });
            await loadSubscriptions();
            try {
              await authService.refresh();
            } catch {
              // subscription state is still refreshed from /user-subscriptions/me
            }
            showToast({ type: "success", title: "Thanh toán thành công", message: "Quyền lợi MediMate Plus đã được cập nhật." });
            return true;
          }

          if (isTerminalPayment(payment) || pollAttempts.current >= MAX_POLL_ATTEMPTS) {
            stopPolling();
            setCheckoutState({
              status: "error",
              paymentId,
              message: isTerminalPayment(payment)
                ? `Giao dịch ${payment?.statusName || "không thành công"}.`
                : "Chưa nhận được xác nhận thanh toán. Bạn có thể kiểm tra lại gói đăng ký sau.",
            });
            return true;
          }
        } catch {
          if (pollAttempts.current >= 5) {
            stopPolling();
            setCheckoutState({
              status: "error",
              paymentId,
              message: "Chưa thể xác minh giao dịch lúc này. Bạn có thể kiểm tra lại lịch sử thanh toán sau.",
            });
            return true;
          }
        }
        return false;
      };

      const completed = await check();
      if (!completed) {
        pollTimer.current = setInterval(check, POLL_INTERVAL_MS);
      }
    },
    [loadSubscriptions, showToast, stopPolling],
  );

  const startCheckout = useCallback(
    async (planId: string, autoRenew: boolean) => {
      if (!planId) return;
      setCheckoutState({ status: "creating", message: "Đang tạo liên kết thanh toán PayOS...", paymentId: "" });

      try {
        const response = await userSubscriptionsApi.checkout(planId, autoRenew);
        const checkout = response.data;
        if (!checkout?.paymentUrl || !checkout?.paymentId) {
          throw new Error("Chưa tạo được liên kết thanh toán hợp lệ. Vui lòng thử lại.");
        }

        setCheckoutState({
          status: "pending",
          paymentId: checkout.paymentId,
          message: "Đang chờ hoàn tất thanh toán trên PayOS. Quay lại ứng dụng sau khi hoàn tất; trạng thái sẽ tự cập nhật.",
        });

        await WebBrowser.openBrowserAsync(checkout.paymentUrl);
        pollPayment(checkout.paymentId);
      } catch {
        setCheckoutState({ status: "error", paymentId: "", message: "Chưa thể tạo liên kết thanh toán lúc này. Vui lòng thử lại sau." });
      }
    },
    [pollPayment],
  );

  const cancelSubscription = useCallback(
    async (subscriptionId: string) => {
      try {
        await userSubscriptionsApi.cancel(subscriptionId);
        await loadSubscriptions();
        showToast({ type: "success", title: "Đã hủy gia hạn", message: "Gói hiện tại vẫn có hiệu lực đến ngày kết thúc." });
        return true;
      } catch {
        showToast({ type: "error", title: "Không thể hủy gói", message: "Vui lòng thử lại sau ít phút." });
        return false;
      }
    },
    [loadSubscriptions, showToast],
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
    startCheckout,
    cancelSubscription,
  };
}
