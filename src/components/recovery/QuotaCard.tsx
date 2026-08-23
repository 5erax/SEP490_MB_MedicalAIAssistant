import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { RefreshCcw, Sparkles } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
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
      <View style={styles.card}>
        <ActivityIndicator color={colors.teal} />
        <AppText variant="bodyStrong" color={colors.muted}>
          Đang tải hạn mức...
        </AppText>
      </View>
    );
  }

  if (state === "error") {
    const tone = needsSubscription ? colors.warning : colors.danger;
    const toneBg = needsSubscription ? colors.warningBg : colors.dangerBg;
    return (
      <View style={[styles.card, styles.errorCard, { borderColor: needsSubscription ? "#f3d9ae" : "#f1b7b0" }]}>
        <View style={styles.titleRow}>
          <View style={[styles.badgeIcon, { backgroundColor: toneBg }]}>
            <Sparkles size={18} color={tone} />
          </View>
          <AppText variant="bodyStrong" color={tone}>
            {needsSubscription ? "Chưa thể tạo yêu cầu mới" : "Chưa tải được hạn mức"}
          </AppText>
        </View>
        <AppText color={colors.muted}>{message}</AppText>
        <Pressable
          accessibilityRole="button"
          onPress={needsSubscription ? () => router.push(ROUTES.PUBLIC.PRICING as never) : onRetry}
          style={styles.secondaryButton}
        >
          <RefreshCcw size={15} color={colors.teal} />
          <AppText variant="caption" color={colors.teal}>
            {needsSubscription ? "Xem gói dịch vụ" : "Thử lại"}
          </AppText>
        </Pressable>
      </View>
    );
  }

  if (!quota) {
    return (
      <View style={styles.card}>
        <AppText variant="bodyStrong" color={colors.muted}>
          Chưa có thông tin hạn mức.
        </AppText>
      </View>
    );
  }

  const limit = Number(quota.grantedCount ?? quota.limitValue) || 0;
  const used = Number(quota.usedCount) || 0;
  const reserved = Number(quota.reservedCount) || 0;
  const remaining = Number(quota.remainingCount) || 0;
  const progress = limit > 0 ? Math.min(1, (used + reserved) / limit) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.badgeIcon}>
          <Sparkles size={17} color={colors.teal} />
        </View>
        <View style={styles.titleText}>
          <AppText variant="bodyStrong">Còn {remaining} lượt có thể yêu cầu</AppText>
          <AppText variant="caption" color={colors.muted}>
            Hạn mức dịch vụ MediMate
          </AppText>
        </View>
        <View style={styles.remainingPill}>
          <AppText variant="h3" color={colors.teal}>
            {remaining}
          </AppText>
          <AppText variant="caption" color={colors.muted}>
            /{limit}
          </AppText>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <AppText variant="caption" color={colors.muted}>
            Đã dùng {used}
          </AppText>
        </View>
        <View style={styles.metaChip}>
          <AppText variant="caption" color={colors.muted}>
            Đang giữ {reserved}
          </AppText>
        </View>
      </View>

      {quota.cycleStart || quota.cycleEnd ? (
        <AppText variant="caption" color={colors.muted}>
          Chu kỳ {formatDateOnly(quota.cycleStart)} - {formatDateOnly(quota.cycleEnd)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "#b8d7cd",
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
    padding: spacing.lg,
  },
  errorCard: {
    borderColor: colors.lineStrong,
    backgroundColor: colors.paperSoft,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.paper,
  },
  titleText: {
    flex: 1,
    minWidth: 0,
  },
  remainingPill: {
    minWidth: 68,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: "rgba(17,20,18,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metaChip: {
    minHeight: 30,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.18)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: spacing.md,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
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
