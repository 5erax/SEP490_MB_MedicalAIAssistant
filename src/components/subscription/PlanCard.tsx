import { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Check, CircleDollarSign, Sparkles } from "lucide-react-native";

import { AppText, Badge, Button, Card } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme/tokens";
import { PUBLIC_ACCESS_BENEFITS, getDurationLabel, getPlanDisplayName } from "@/src/utils/subscriptionPlanPresentation";
import { SubscriptionPlan } from "@/src/types/subscription";

export function FreePlanCard({ plan, onExplore }: { plan?: SubscriptionPlan; onExplore: () => void }) {
  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.iconMark}>
          <Sparkles size={20} color={colors.limeDark} />
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
  plan?: SubscriptionPlan;
  benefits: string[];
  priceLabel: string;
  loading: boolean;
  unavailable: boolean;
  actionLabel: string;
  actionDisabled: boolean;
  actionLoading: boolean;
  onAction: () => void;
  autoRenewControl?: ReactNode;
};

export function PaidPlanCard({
  plan,
  benefits,
  priceLabel,
  loading,
  unavailable,
  actionLabel,
  actionDisabled,
  actionLoading,
  onAction,
  autoRenewControl,
}: PaidPlanCardProps) {
  return (
    <Card variant="hard" style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.iconMarkPremium}>
          <CircleDollarSign size={20} color={colors.white} />
        </View>
        <Badge tone="success">Gói đăng ký</Badge>
      </View>
      <AppText variant="caption" color={colors.subtle}>
        Quyền lợi có hạn mức
      </AppText>
      <AppText variant="h2">{plan ? getPlanDisplayName(plan.planName) : "MediMate Plus"}</AppText>
      <View style={styles.priceRow}>
        {loading ? <ActivityIndicator color={colors.teal} /> : <AppText variant="h3">{priceLabel}</AppText>}
        {plan ? (
          <AppText variant="caption" color={colors.subtle}>
            / {getDurationLabel(plan.durationInDays)}
          </AppText>
        ) : null}
      </View>
      <AppText color={colors.muted}>
        {unavailable
          ? "Giá và hạn mức sẽ hiển thị lại khi kết nối được khôi phục."
          : "Dành cho người cần sử dụng thường xuyên các tính năng có giới hạn theo gói."}
      </AppText>

      <View style={styles.benefitList}>
        {benefits.length > 0 ? (
          benefits.map((feature) => (
            <View key={feature} style={styles.benefitRow}>
              <Check size={16} color={colors.teal} />
              <AppText color={colors.muted} style={styles.benefitText}>
                {feature}
              </AppText>
            </View>
          ))
        ) : (
          <AppText variant="caption" color={colors.subtle}>
            {loading ? "Đang tải hạn mức quyền lợi..." : unavailable ? "Quyền lợi chưa khả dụng." : "Chưa có hạn mức quyền lợi được công bố."}
          </AppText>
        )}
      </View>

      {autoRenewControl}

      <Button fullWidth disabled={actionDisabled} onPress={onAction}>
        {actionLoading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color={colors.ink} />
            <AppText variant="bodyStrong">{actionLabel}</AppText>
          </View>
        ) : (
          actionLabel
        )}
      </Button>
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
    backgroundColor: colors.limeDark,
  },
  priceRow: {
    flexDirection: "row",
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
