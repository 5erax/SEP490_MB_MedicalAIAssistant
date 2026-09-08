import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { CalendarClock, CreditCard, Gauge, Sparkles } from "lucide-react-native";

import { AppText, Badge, Button, Card, LoadingState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";
import { SubscriptionUsageQuota, UserSubscription } from "@/src/types/subscription";
import { formatDateTime } from "@/src/utils/paymentPresentation";
import { isActiveSubscription } from "@/src/utils/subscriptionPlanPresentation";

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Đang hoạt động",
  pending: "Đang chờ",
  expired: "Đã hết hạn",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
  inactive: "Không hoạt động",
};

function formatPlanName(planName: unknown) {
  const normalized = String(planName ?? "").trim();
  if (!normalized) return "Miễn phí";
  if (["free", "freemium"].includes(normalized.toLowerCase())) return "Miễn phí";
  return normalized;
}

function formatSubscriptionStatus(statusName: unknown) {
  const normalized = String(statusName ?? "").trim();
  if (!normalized) return "Chưa có gói trả phí";
  return SUBSCRIPTION_STATUS_LABELS[normalized.toLowerCase()] ?? normalized;
}

function formatCount(value: unknown) {
  const count = Number(value);
  if (!Number.isFinite(count)) return "—";
  return count.toLocaleString("vi-VN");
}

function getUsageSummary(usageList: SubscriptionUsageQuota[]) {
  return usageList.reduce(
    (summary, item) => {
      const limit = Number(item.limitValue ?? item.grantedCount);
      const remaining = Number(item.remainingCount);
      summary.used += Number(item.usedCount) || 0;
      summary.reserved += Number(item.reservedCount) || 0;
      if (Number.isFinite(limit)) summary.limit += limit;
      if (Number.isFinite(remaining)) summary.remaining += remaining;
      return summary;
    },
    { limit: 0, remaining: 0, used: 0, reserved: 0 },
  );
}

export function SubscriptionSummarySection({
  state,
  subscription,
  usageList,
  onRetry,
}: {
  state: "loading" | "ready" | "error";
  subscription: UserSubscription | null;
  usageList: SubscriptionUsageQuota[];
  onRetry: () => void;
}) {
  if (state === "loading") {
    return <LoadingState title="Đang tải gói dịch vụ..." />;
  }

  if (state === "error") {
    return (
      <Card variant="soft" style={styles.card}>
        <AppText color={colors.danger}>Không thể tải thông tin gói dịch vụ.</AppText>
        <Button variant="secondary" onPress={onRetry}>
          Thử lại
        </Button>
      </Card>
    );
  }

  const active = isActiveSubscription(subscription);
  const statusLabel = formatSubscriptionStatus(subscription?.statusName);
  const planName = formatPlanName(subscription?.planName);
  const usageSummary = getUsageSummary(usageList);
  const summaryPercent = usageSummary.limit > 0
    ? Math.min(100, Math.max(0, ((usageSummary.used + usageSummary.reserved) / usageSummary.limit) * 100))
    : 0;

  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headerBlock}>
        <View style={styles.packageHeader}>
          <View style={styles.packageTitleRow}>
            <View style={styles.iconMark}>
              <CreditCard size={18} color={colors.teal} />
            </View>
            <View style={styles.packageHeaderCopy}>
              <AppText variant="h3">Gói hiện tại</AppText>
              <AppText variant="caption" color={colors.subtle}>
                Quyền lợi MediMate
              </AppText>
            </View>
          </View>
          <Badge tone={active ? "success" : "neutral"}>{statusLabel}</Badge>
        </View>
      </View>

      <View style={styles.planPanel}>
        <AppText variant="h2" color={colors.white} numberOfLines={2} style={styles.planName}>
          {planName}
        </AppText>
        {subscription?.endDate ? (
          <View style={styles.dateRow}>
            <CalendarClock size={15} color="rgba(255,255,255,0.82)" />
            <AppText color="rgba(255,255,255,0.86)">Hiệu lực đến {formatDateTime(subscription.endDate)}</AppText>
          </View>
        ) : (
          <AppText color="rgba(255,255,255,0.86)">
            Bạn đang dùng các quyền lợi miễn phí của MediMate AI.
          </AppText>
        )}
      </View>

      {usageList.length > 0 ? (
        <View style={styles.usagePanel}>
          <View style={styles.usageHeader}>
            <View style={styles.iconMark}>
              <Gauge size={18} color={colors.teal} />
            </View>
            <View style={styles.usageHeaderCopy}>
              <AppText variant="h3">Hạn mức sử dụng</AppText>
              <AppText variant="caption" color={colors.subtle}>
                Số lượt còn lại trong chu kỳ hiện tại
              </AppText>
            </View>
          </View>

          <View style={styles.usageSummaryCard}>
            <View style={styles.usageMetricPrimary}>
              <AppText variant="caption" color={colors.teal}>
                Còn lại
              </AppText>
              <AppText variant="h2" color={colors.teal}>
                {formatCount(usageSummary.remaining)}/{formatCount(usageSummary.limit)}
              </AppText>
            </View>
            <View style={styles.usageMetric}>
              <AppText variant="caption" color={colors.subtle}>
                Đã dùng
              </AppText>
              <AppText variant="bodyStrong">{formatCount(usageSummary.used)}</AppText>
            </View>
            {usageSummary.reserved > 0 ? (
              <View style={styles.usageMetric}>
                <AppText variant="caption" color={colors.subtle}>
                  Đang giữ
                </AppText>
                <AppText variant="bodyStrong">{formatCount(usageSummary.reserved)}</AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.progressTrackLarge}>
            <View style={[styles.progressFill, { width: `${summaryPercent}%` }]} />
          </View>
        </View>
      ) : null}

      <Button
        fullWidth
        onPress={() => router.push(ROUTES.PUBLIC.PRICING)}
        leftIcon={<Sparkles size={16} color={colors.white} />}
      >
        Nâng cấp MediMate+
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headerBlock: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  packageTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  packageHeaderCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  iconMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bee5ea",
    backgroundColor: "#dcf4f6",
  },
  planPanel: {
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  planName: {
    fontSize: 24,
    lineHeight: 30,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  usagePanel: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  usageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  usageHeaderCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  usageSummaryCard: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  usageMetricPrimary: {
    flex: 1.35,
    gap: spacing.xs / 2,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  usageMetric: {
    flex: 1,
    gap: spacing.xs / 2,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  progressTrackLarge: {
    height: 10,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
});
