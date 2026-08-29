// Ported from src/pages/PricingPage.jsx (Web).
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { CheckCircle2, CreditCard, ExternalLink, History, RefreshCw, ShieldCheck, XCircle } from "lucide-react-native";

import { AppText, Button, Card, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { MoreBackHeader } from "@/src/components/more";
import { useSubscription } from "@/src/hooks/useSubscription";
import { useAuth } from "@/src/providers";
import { hasPremiumAccess } from "@/src/utils/premium";
import { ROUTES } from "@/src/navigation/routes";
import { SubscriptionPlan } from "@/src/types/subscription";
import {
  formatPrice,
  getPlanBenefits,
  getPlanCycle,
  isActiveSubscription,
} from "@/src/utils/subscriptionPlanPresentation";
import { CurrentSubscriptionCard } from "./CurrentSubscriptionCard";
import { FreePlanCard, PaidPlanCard } from "./PlanCard";

const FAQS: [string, string][] = [
  [
    "Tôi có thể hủy gia hạn không?",
    "Có. Khi gói đang bật gia hạn tự động, bạn có thể hủy gia hạn trong phần gói hiện tại. Quyền lợi vẫn được hiển thị đến ngày kết thúc mà hệ thống trả về.",
  ],
  [
    "Phần miễn phí bao gồm gì?",
    "Bạn có thể sử dụng các tính năng công khai để phân tích triệu chứng ở mức tham khảo, tìm cơ sở y tế trên bản đồ và hỏi trợ lý AI trên trang chủ.",
  ],
  [
    "Quyền lợi gói đăng ký được xác định thế nào?",
    "Tên gói, giá, thời hạn và các hạn mức được lấy từ gói đang hoạt động trên hệ thống MediMate.",
  ],
];

export function SubscriptionScreen({ showBackHeader = false }: { showBackHeader?: boolean }) {
  const { session } = useAuth();
  const {
    plans,
    plansLoading,
    plansError,
    reloadPlans,
    subscriptions,
    subscriptionsLoading,
    subscriptionsError,
    reloadSubscriptions,
    checkoutState,
    checkingPayment,
    startCheckout,
    checkPendingPayment,
    reopenCheckout,
    cancelSubscription,
  } = useSubscription();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [autoRenew, setAutoRenew] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const currentSubscriptionY = useRef(0);

  const isPremium = hasPremiumAccess(session);
  const paidPlans = useMemo(() => plans.filter((plan) => Number(plan.price) > 0), [plans]);
  const availableCycles = useMemo(() => new Set(paidPlans.map(getPlanCycle)), [paidPlans]);
  const selectedCycle = availableCycles.has(billingCycle) ? billingCycle : paidPlans[0] ? getPlanCycle(paidPlans[0]) : billingCycle;
  const visiblePaidPlans = useMemo(
    () => paidPlans.filter((plan) => getPlanCycle(plan) === selectedCycle),
    [paidPlans, selectedCycle],
  );
  const freePlan = useMemo(() => plans.find((plan) => Number(plan.price) === 0), [plans]);
  const activeSubscription = useMemo(() => subscriptions.find(isActiveSubscription) ?? null, [subscriptions]);
  const canManageSubscription = Boolean(session && (activeSubscription || isPremium));
  const paidPlanUnavailable = !plansLoading && Boolean(plansError);

  async function handleUpgrade(plan: SubscriptionPlan) {
    if (!session) {
      router.push(ROUTES.PUBLIC.LOGIN);
      return;
    }
    if (!plan.id) return;
    setCheckoutPlanId(plan.id);
    try {
      await startCheckout(plan.id, autoRenew);
    } finally {
      setCheckoutPlanId("");
    }
  }

  function handleManageSubscription() {
    scrollRef.current?.scrollTo({
      y: Math.max(0, currentSubscriptionY.current - spacing.md),
      animated: true,
    });
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
  const upgradeLabel = (plan: SubscriptionPlan) =>
    checkoutState.status === "creating" && checkoutPlanId === plan.id
      ? "Đang tạo thanh toán..."
      : checkoutState.status === "pending"
        ? "Có giao dịch đang chờ"
        : session
          ? canManageSubscription
            ? "Mua thêm lượt qua PayOS"
            : "Thanh toán qua PayOS"
          : "Đăng nhập để nâng cấp";

  return (
    <Screen scroll scrollRef={scrollRef} contentContainerStyle={styles.content}>
      {showBackHeader ? <MoreBackHeader title="Gói dịch vụ" /> : null}

      <View style={styles.heroGroup}>
        <AppText variant="eyebrow" color={colors.teal}>
          Bảng giá MediMate
        </AppText>
        <AppText variant="h1">Chọn gói phù hợp với cách bạn sử dụng MediMate</AppText>
        <AppText color={colors.muted}>
          So sánh phần dùng ngay được và quyền lợi có hạn mức của gói đăng ký. Giá và thời hạn được lấy từ cấu hình đang
          hoạt động.
        </AppText>
      </View>

      {availableCycles.size > 1 ? (
        <View style={styles.cycleToggle}>
          {(["monthly", "yearly"] as const).map((cycle) => {
            const selected = selectedCycle === cycle;
            const available = availableCycles.has(cycle);
            return (
              <Pressable
                key={cycle}
                accessibilityRole="button"
                disabled={!available}
                onPress={() => setBillingCycle(cycle)}
                style={[styles.cycleButton, selected && styles.cycleButtonActive, !available && styles.cycleButtonDisabled]}
              >
                <AppText variant="bodyStrong" color={selected ? colors.white : colors.subtle}>
                  {cycle === "monthly" ? "Theo tháng" : "Theo năm"}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

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
          {session && visiblePaidPlans.length > 0 && !isPremium && !activeSubscription ? (
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: autoRenew }} onPress={() => setAutoRenew((current) => !current)} style={styles.autoRenewRow}>
              <View style={[styles.checkbox, autoRenew && styles.checkboxChecked]} />
              <View style={styles.autoRenewText}>
                <AppText variant="bodyStrong">Tự động gia hạn</AppText>
                <AppText variant="caption" color={colors.subtle}>
                  Áp dụng cho gói bạn chọn và có thể hủy trong phần gói hiện tại.
                </AppText>
              </View>
            </Pressable>
          ) : null}
          {visiblePaidPlans.map((plan) => (
            <PaidPlanCard
              key={plan.id}
              plan={plan}
              benefits={getPlanBenefits(plan.featureLimitJson, plan.quotas)}
              priceLabel={Number(plan.price) > 0 ? formatPrice(Number(plan.price)) : "Không khả dụng"}
              loading={plansLoading}
              unavailable={paidPlanUnavailable}
              actionLabel={upgradeLabel(plan)}
              actionDisabled={checkoutBusy}
              actionLoading={checkoutState.status === "creating" && checkoutPlanId === plan.id}
              onAction={() => void handleUpgrade(plan)}
            />
          ))}
          {canManageSubscription ? (
            <Button variant="secondary" fullWidth onPress={handleManageSubscription}>
              Quản lý gói hiện tại
            </Button>
          ) : null}
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
          {checkoutState.status === "cancelled" ? <XCircle size={22} color={colors.warning} /> : null}
          {checkoutState.status === "error" ? <XCircle size={22} color={colors.danger} /> : null}
          <View style={styles.checkoutText}>
            <AppText variant="bodyStrong">
              {checkoutState.status === "success"
                ? "Thanh toán thành công"
                : checkoutState.status === "cancelled"
                  ? "Đã hủy thanh toán"
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
            {session && ["pending", "success", "cancelled", "error"].includes(checkoutState.status) ? (
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
        <View onLayout={(event) => { currentSubscriptionY.current = event.nativeEvent.layout.y; }}>
          <CurrentSubscriptionCard
            loading={subscriptionsLoading}
            error={subscriptionsError}
            activeSubscription={activeSubscription}
            onRetry={reloadSubscriptions}
            onCancel={handleCancel}
          />
        </View>
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
  cycleToggle: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.xs,
  },
  cycleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  cycleButtonActive: {
    backgroundColor: colors.teal,
  },
  cycleButtonDisabled: {
    opacity: 0.4,
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
  autoRenewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.paper,
  },
  checkboxChecked: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  autoRenewText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
});
