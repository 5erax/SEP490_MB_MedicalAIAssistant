import { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Check, CircleDollarSign, Gift, ShieldCheck } from "lucide-react-native";

import { AppText, Badge, Button, Card } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { PUBLIC_ACCESS_BENEFITS, formatPrice, getDurationLabel, getPlanBenefits, getPlanDisplayName } from "@/src/utils/subscriptionPlanPresentation";
import { getPricingSnapshot } from "@/src/utils/subscriptionOffers";
import { SubscriptionPlan, SubscriptionPlanOffer } from "@/src/types/subscription";

export function FreePlanCard({ plan, onExplore }: { plan?: SubscriptionPlan; onExplore: () => void }) {
  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.iconMark}>
          <ShieldCheck size={20} color={colors.teal} />
        </View>
        <Badge tone="neutral">Không cần mua gói</Badge>
      </View>
      <AppText variant="caption" color={colors.subtle}>
        Truy cập công khai
      </AppText>
      <AppText variant="h2">{plan?.planName || "Miễn phí"}</AppText>
      <AppText variant="h3">0 ₫</AppText>
      <AppText color={colors.muted}>Phù hợp để tìm hiểu MediMate và chuẩn bị thông tin cơ bản trước khi đi khám.</AppText>

      <View style={styles.benefitList}>
        {PUBLIC_ACCESS_BENEFITS.map((feature) => (
          <View key={feature} style={styles.benefitRow}>
            <Check size={16} color={colors.teal} />
            <AppText color={colors.muted} style={styles.benefitText}>
              {feature}
            </AppText>
          </View>
        ))}
      </View>

      <Button variant="secondary" fullWidth onPress={onExplore}>
        Khám phá MediMate
      </Button>
    </Card>
  );
}

type PaidPlanCardProps = {
  planOffer: SubscriptionPlanOffer;
  loading: boolean;
  unavailable: boolean;
  actionLabel: string;
  actionDisabled: boolean;
  actionLoading: boolean;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  autoRenewControl?: ReactNode;
};

export function PaidPlanCard({
  planOffer,
  loading,
  unavailable,
  actionLabel,
  actionDisabled,
  actionLoading,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  autoRenewControl,
}: PaidPlanCardProps) {
  const { plan, offer, originalPrice, effectivePrice, baseCredit, bonusCredit, grantedCredit } = planOffer;
  const hasSale = offer != null;
  const hasDiscount = hasSale && effectivePrice < originalPrice;
  const validSnapshot = Boolean(getPricingSnapshot(planOffer));
  const benefits = getPlanBenefits(plan.featureLimitJson, plan.quotas?.filter(
    (quota) => String(quota.quotaCode ?? "").trim().toUpperCase() !== "SERVICE_CREDIT",
  ));
  const endDate = offer?.endAt ? new Date(offer.endAt) : null;
  const endLabel = endDate && Number.isFinite(endDate.getTime())
    ? endDate.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Card variant="hard" style={[styles.card, hasSale && styles.saleCard]}>
      <View style={styles.headingRow}>
        <View style={styles.iconMarkPremium}>
          <CircleDollarSign size={20} color={colors.white} />
        </View>
        <View style={styles.badgeWrap}>
          <Badge tone={hasSale ? "warning" : "success"}>{hasSale ? offer.badgeText || "Ưu đãi" : "Gói đăng ký"}</Badge>
        </View>
      </View>
      <AppText variant="caption" color={colors.subtle}>
        Quyền lợi có hạn mức
      </AppText>
      <AppText variant="h2">{getPlanDisplayName(plan.planName)}</AppText>
      {hasSale && offer.campaignName ? <AppText variant="bodyStrong" color={colors.teal}>{offer.campaignName}</AppText> : null}
      {hasDiscount ? (
        <AppText color={colors.subtle} style={styles.originalPrice} accessibilityLabel={`Giá gốc ${formatPrice(originalPrice)}`}>
          {formatPrice(originalPrice)}
        </AppText>
      ) : null}
      <View style={styles.priceRow}>
        {loading ? <ActivityIndicator color={colors.teal} /> : <AppText variant="h2" color={hasSale ? colors.teal : colors.ink}>{validSnapshot ? formatPrice(effectivePrice) : "Chưa có giá"}</AppText>}
        {getDurationLabel(plan.durationInDays) ? (
          <AppText variant="caption" color={colors.subtle}>
            / {getDurationLabel(plan.durationInDays)}
          </AppText>
        ) : null}
      </View>
      {hasSale && offer.description ? <AppText color={colors.muted}>{offer.description}</AppText> : null}
      <View style={styles.creditSummary}>
        <AppText variant="bodyStrong" color={colors.teal}>
          Tổng nhận: {grantedCredit?.toLocaleString("vi-VN") ?? "—"} lượt
        </AppText>
        {bonusCredit > 0 ? (
          <View style={styles.benefitRow}>
            <Gift size={16} color={colors.warning} />
            <AppText color={colors.warning} style={styles.benefitText}>
              {baseCredit.toLocaleString("vi-VN")} lượt gốc +{bonusCredit.toLocaleString("vi-VN")} lượt khuyến mãi
            </AppText>
          </View>
        ) : null}
        <AppText variant="caption" color={colors.muted}>Sử dụng cho các dịch vụ MediMate áp dụng lượt.</AppText>
      </View>
      {hasSale && (typeof offer.remainingRedemptions === "number" || endLabel) ? (
        <View style={styles.offerMeta}>
          {typeof offer.remainingRedemptions === "number" ? (
            <AppText variant="caption" color={colors.warning}>Còn {offer.remainingRedemptions.toLocaleString("vi-VN")} suất ưu đãi</AppText>
          ) : null}
          {endLabel ? <AppText variant="caption" color={colors.muted}>Ưu đãi đến {endLabel}</AppText> : null}
        </View>
      ) : null}
      <AppText color={colors.muted}>
        {unavailable
          ? "Giá và hạn mức sẽ hiển thị lại khi kết nối được khôi phục."
          : "Dành cho người cần sử dụng thường xuyên các tính năng có giới hạn theo gói."}
      </AppText>

      {benefits.length > 0 ? (
        <View style={styles.benefitList}>
          {benefits.map((feature) => (
            <View key={feature} style={styles.benefitRow}>
              <Check size={16} color={colors.teal} />
              <AppText color={colors.muted} style={styles.benefitText}>
                {feature}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {autoRenewControl}

      <Button fullWidth disabled={actionDisabled || loading || unavailable || !validSnapshot} onPress={onAction}>
        {actionLoading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color={colors.ink} />
            <AppText variant="bodyStrong">{actionLabel}</AppText>
          </View>
        ) : (
          actionLabel
        )}
      </Button>
      {secondaryActionLabel && onSecondaryAction ? (
        <Button variant="secondary" fullWidth onPress={onSecondaryAction}>
          {secondaryActionLabel}
        </Button>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  badgeWrap: {
    flexShrink: 1,
  },
  saleCard: {
    borderColor: colors.teal,
  },
  originalPrice: {
    textDecorationLine: "line-through",
  },
  creditSummary: {
    padding: spacing.md,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  offerMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  iconMark: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  iconMarkPremium: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.teal,
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  benefitList: {
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  benefitText: {
    flex: 1,
  },
  loadingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
