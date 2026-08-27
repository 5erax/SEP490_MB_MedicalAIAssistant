// Ported from src/pages/PricingPage.jsx (Web).
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { CheckCircle2, CreditCard, ExternalLink, History, RefreshCw, ShieldCheck, XCircle } from "lucide-react-native";

import { AppText, Button, Card, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useSubscription } from "@/src/hooks/useSubscription";
import { useAuth } from "@/src/providers";
import { hasPremiumAccess } from "@/src/utils/premium";
import { ROUTES } from "@/src/navigation/routes";
import {
  formatPrice,
  getPlanBenefits,
  getServiceCreditLimit,
  isActiveSubscription,
} from "@/src/utils/subscriptionPlanPresentation";
import { SubscriptionPlan } from "@/src/types/subscription";
import { CurrentSubscriptionCard } from "./CurrentSubscriptionCard";
import { FreePlanCard, PaidPlanCard } from "./PlanCard";

const FAQS: [string, string][] = [
  [
    "Lượt dùng trong gói có hết hạn không?",
    "Không. Lượt dùng dịch vụ được cộng vào số dư chung của tài khoản và không hết hạn.",
  ],
  [
    "Phần miễn phí bao gồm gì?",
    "Bạn có thể sử dụng các tính năng công khai để phân tích triệu chứng ở mức tham khảo, tìm cơ sở y tế trên bản đồ và hỏi trợ lý AI trên trang chủ.",
  ],
  [
    "Quyền lợi gói đăng ký được xác định thế nào?",
    "Mỗi gói cấp một số lượt dùng chung cho kế hoạch phục hồi, tư vấn trước khám và phân tích xét nghiệm.",
  ],
];

export function SubscriptionScreen() {
  const { session } = useAuth();
  const {
    plans,
    plansLoading,
    plansError,
    reloadPlans,
    subscriptions,
    subscriptionsLoading,
    subscriptionsError,
    usageList,
    reloadSubscriptions,
    checkoutState,
    checkingPayment,
    startCheckout,
    checkPendingPayment,
    reopenCheckout,
    cancelSubscription,
  } = useSubscription();

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isPremium = hasPremiumAccess(session);
  const paidPlans = useMemo(
    () => [...plans]
      .filter((plan) => Number(plan.price) > 0 && Number(getServiceCreditLimit(plan)) > 0)
      .sort((left, right) => Number(left.price) - Number(right.price)),
    [plans],
  );
  const freePlan = useMemo(() => plans.find((plan) => Number(plan.price) === 0), [plans]);
  const activeSubscription = useMemo(() => subscriptions.find(isActiveSubscription) ?? null, [subscriptions]);
  const hasExistingCredits = useMemo(
    () => usageList.some((item) => Number(item.grantedCount ?? item.limitValue ?? 0) > 0),
    [usageList],
  );
  const paidPlanUnavailable = !plansLoading && Boolean(plansError);

  function handlePurchase(plan: SubscriptionPlan) {
    if (!session) {
      router.push(ROUTES.PUBLIC.LOGIN);
      return;
    }
    if (!plan.id || !getServiceCreditLimit(plan)) return;
    startCheckout(plan.id, false);
  }

  function handleCancel() {
    if (!activeSubscription?.id) return;
    Alert.alert(
      "Hủy gia hạn MediMate Plus?",
      "Bạn vẫn sử dụng quyền lợi đến ngày kết thúc hiện tại, nhưng gói sẽ không tiếp tục gia hạn.",
      [
        { text: "Đóng", style: "cancel" },
        { text: "Hủy gia hạn", style: "destructive", onPress: () => cancelSubscription(activeSubscription.id) },
      ],
    );
  }

  const checkoutBusy = ["creating", "pending"].includes(checkoutState.status);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.heroGroup}>
        <AppText variant="eyebrow" color={colors.teal}>
          Bảng giá MediMate
        </AppText>
        <AppText variant="h1">Chọn gói phù hợp với cách bạn sử dụng MediMate</AppText>
        <AppText color={colors.muted}>
          So sánh phần dùng ngay được và quyền lợi có hạn mức của gói đăng ký. Giá và số lượt được lấy từ cấu hình đang
          hoạt động. Mỗi gói lượt có thể được mua nhiều lần và cộng dồn vào số dư tài khoản.
        </AppText>
      </View>

      {!plansLoading && plansError ? (
        <View style={styles.noticeError}>
          <AppText variant="bodyStrong" color={colors.danger}>
            Chưa thể tải thông tin gói
          </AppText>
          <AppText variant="caption" color={colors.muted}>
            Phần miễn phí vẫn sử dụng được.
          </AppText>
          <Pressable onPress={reloadPlans}>
            <AppText variant="caption" color={colors.teal}>
              Thử tải lại
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {plansLoading ? (
        <SkeletonGroup lines={5} />
      ) : (
        <View style={styles.plansGroup}>
          <FreePlanCard plan={freePlan} onExplore={() => router.replace(ROUTES.PATIENT.HOME)} />
          {paidPlans.map((plan) => {
            const creditLimit = getServiceCreditLimit(plan);
            const isCurrentCheckout = checkoutState.planId === plan.id;
            const actionLabel = isCurrentCheckout && checkoutState.status === "creating"
              ? "Đang tạo thanh toán..."
              : isCurrentCheckout && checkoutState.status === "pending"
                ? "Đang chờ hoàn tất thanh toán"
                : !session
                  ? "Đăng nhập để mua lượt"
                  : activeSubscription || isPremium || hasExistingCredits
                    ? `Mua thêm ${creditLimit} lượt`
                    : `Mua / nạp thêm ${creditLimit} lượt`;

            return (
              <PaidPlanCard
                key={plan.id}
                plan={plan}
                creditLimit={creditLimit}
                benefits={getPlanBenefits(plan)}
                priceLabel={formatPrice(Number(plan.price) || 0)}
                loading={plansLoading}
                unavailable={paidPlanUnavailable}
                actionLabel={actionLabel}
                actionDisabled={checkoutBusy}
                actionLoading={isCurrentCheckout && checkoutState.status === "creating"}
                onAction={() => handlePurchase(plan)}
              />
            );
          })}
        </View>
      )}

      <View style={styles.paymentNote}>
        <CreditCard size={20} color={colors.teal} />
        <View style={styles.paymentNoteText}>
          <AppText variant="bodyStrong">Thanh toán qua PayOS</AppText>
          <AppText variant="caption" color={colors.muted}>
            MediMate không yêu cầu bạn nhập thông tin thẻ trực tiếp trong ứng dụng.
          </AppText>
        </View>
      </View>

      {checkoutState.status !== "idle" ? (
        <Card variant="soft" style={styles.checkoutCard}>
          {["creating", "pending"].includes(checkoutState.status) ? <ActivityIndicator color={colors.teal} /> : null}
          {checkoutState.status === "success" ? <CheckCircle2 size={22} color={colors.success} /> : null}
          {checkoutState.status === "error" ? <XCircle size={22} color={colors.danger} /> : null}
          <View style={styles.checkoutText}>
            <AppText variant="bodyStrong">
              {checkoutState.status === "success"
                ? "Thanh toán thành công"
                : checkoutState.status === "error"
                  ? "Chưa thể hoàn tất thanh toán"
                  : checkingPayment
                    ? "Đang xác minh với PayOS"
                    : "Đang chờ thanh toán"}
            </AppText>
            <AppText color={colors.muted}>{checkoutState.message}</AppText>
            {checkoutState.status === "pending" ? (
              <View style={styles.checkoutActions}>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={checkingPayment}
                  leftIcon={
                    checkingPayment
                      ? <ActivityIndicator size="small" color={colors.teal} />
                      : <RefreshCw size={16} color={colors.teal} />
                  }
                  onPress={checkPendingPayment}
                >
                  {checkingPayment ? "Đang kiểm tra" : "Tôi đã thanh toán"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={checkingPayment}
                  leftIcon={<ExternalLink size={16} color={colors.teal} />}
                  onPress={reopenCheckout}
                >
                  Mở lại PayOS
                </Button>
              </View>
            ) : null}
            {session && ["pending", "success", "error"].includes(checkoutState.status) ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(ROUTES.PATIENT.PAYMENT_HISTORY)}
                style={styles.historyLink}
              >
                <History size={15} color={colors.teal} />
                <AppText variant="caption" color={colors.teal}>Xem lịch sử thanh toán</AppText>
              </Pressable>
            ) : null}
          </View>
        </Card>
      ) : null}

      {session ? (
        <CurrentSubscriptionCard
          loading={subscriptionsLoading}
          error={subscriptionsError}
          activeSubscription={activeSubscription}
          onRetry={reloadSubscriptions}
          onCancel={handleCancel}
        />
      ) : null}

      <View style={styles.faqGroup}>
        <AppText variant="eyebrow" color={colors.teal}>
          Thông tin cần biết
        </AppText>
        <AppText variant="h3">Câu hỏi về gói đăng ký</AppText>
        {FAQS.map(([question, answer], index) => (
          <View key={question} style={styles.faqItem}>
            <Pressable accessibilityRole="button" onPress={() => setOpenFaq(openFaq === index ? null : index)} style={styles.faqQuestion}>
              <AppText variant="bodyStrong" style={styles.faqQuestionText}>
                {question}
              </AppText>
            </Pressable>
            {openFaq === index ? (
              <AppText color={colors.muted} style={styles.faqAnswer}>
                {answer}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.assurance}>
        <ShieldCheck size={22} color={colors.teal} />
        <AppText color={colors.muted} style={styles.assuranceText}>
          Bạn luôn có thể dùng phần công khai mà không cần mua gói. Kết quả AI chỉ mang tính tham khảo và không thay thế
          chẩn đoán hoặc điều trị của bác sĩ.
        </AppText>
      </View>

      {!plansLoading && !plansError && paidPlans.length === 0 ? (
        <EmptyState title="Hiện chưa có gói trả phí khả dụng" description="Bạn vẫn có thể sử dụng các tiện ích công khai của MediMate." />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  heroGroup: {
    gap: spacing.sm,
  },
  noticeError: {
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
  },
  plansGroup: {
    gap: spacing.lg,
  },
  paymentNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.lg,
  },
  paymentNoteText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  checkoutCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  checkoutText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  checkoutActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  faqGroup: {
    gap: spacing.sm,
  },
  faqItem: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  faqQuestion: {
    flexDirection: "row",
  },
  faqQuestionText: {
    flex: 1,
  },
  faqAnswer: {
    marginTop: spacing.sm,
  },
  assurance: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.lg,
  },
  assuranceText: {
    flex: 1,
  },
});
