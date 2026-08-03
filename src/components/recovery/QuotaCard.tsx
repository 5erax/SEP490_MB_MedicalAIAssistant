import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Sparkles } from "lucide-react-native";

import { AppText, Button, Card } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";
import { SubscriptionUsageQuota } from "@/src/types/subscription";
import { formatDateOnly } from "@/src/utils/recoveryPlanPresentation";

type QuotaCardProps = {
  state: "loading" | "ready" | "error";
  quota: SubscriptionUsageQuota | null;
  message: string;
  needsSubscription: boolean;
  onRetry: () => void;
};

export function QuotaCard({ state, quota, message, needsSubscription, onRetry }: QuotaCardProps) {
  if (state === "loading") {
    return (
      <Card variant="soft" style={styles.card}>
        <AppText color={colors.subtle}>Đang tải hạn mức...</AppText>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card variant="soft" style={styles.card}>
        <AppText color={colors.danger}>{message}</AppText>
        {needsSubscription ? (
          <Button onPress={() => router.push(ROUTES.PUBLIC.PRICING as never)}>Xem gói dịch vụ</Button>
        ) : (
          <Button variant="secondary" onPress={onRetry}>
            Thử lại
          </Button>
        )}
      </Card>
    );
  }

  if (!quota) {
    return (
      <Card variant="soft" style={styles.card}>
        <AppText color={colors.subtle}>Chưa có thông tin hạn mức.</AppText>
      </Card>
    );
  }

  const limit = Number(quota.limitValue) || 0;
  const used = Number(quota.usedCount) || 0;
  const reserved = Number(quota.reservedCount) || 0;
  const remaining = Number(quota.remainingCount) || 0;
  const progress = limit > 0 ? Math.min(1, (used + reserved) / limit) : 0;

  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headerRow}>
        <AppText variant="bodyStrong">Hạn mức yêu cầu</AppText>
        <AppText variant="h3">
          {remaining}/{limit}
        </AppText>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.statRow}>
        <AppText variant="caption" color={colors.subtle}>
          Đã dùng {used} · Đang giữ chỗ {reserved}
        </AppText>
      </View>
      {quota.cycleStart || quota.cycleEnd ? (
        <AppText variant="caption" color={colors.subtle}>
          Chu kỳ {formatDateOnly(quota.cycleStart)} – {formatDateOnly(quota.cycleEnd)}
        </AppText>
      ) : null}
      {remaining <= 0 ? (
        <View style={styles.exhaustedBanner}>
          <Sparkles size={14} color={colors.warning} />
          <AppText variant="caption" color={colors.warning} style={styles.exhaustedText}>
            Bạn đã dùng hết lượt trong chu kỳ hiện tại.
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exhaustedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    padding: spacing.sm,
  },
  exhaustedText: {
    flex: 1,
  },
});
