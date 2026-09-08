import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ArrowUpRight, CalendarClock, CreditCard, Gauge, Sparkles } from "lucide-react-native";

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

function getUsagePercent(item: SubscriptionUsageQuota) {
  const limit = Number(item.limitValue ?? item.grantedCount);
  const used = Number(item.usedCount) || 0;
  const reserved = Number(item.reservedCount) || 0;
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(100, Math.max(0, ((used + reserved) / limit) * 100));
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

function getQuotaDisplayName(item: SubscriptionUsageQuota, index: number) {
  const name = String(item.quotaName || "").trim();
  if (!name || name.toLowerCase() === "hạn mức sử dụng") {
    return index === 0 ? "Tổng lượt MediMate" : `Quyền lợi ${index + 1}`;
  }
  return name;
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
      <View style={styles.headerRow}>
        <View style={styles.headerTitle}>
          <View style={styles.iconMark}>
            <CreditCard size={18} color={colors.teal} />
          </View>
          <View style={styles.titleCopy}>
            <AppText variant="caption" color={colors.teal}>
              Gói hiện tại
            </AppText>
            <AppText variant="h3">Quyền lợi MediMate</AppText>
          </View>
        </View>
        <Badge tone={active ? "success" : "neutral"}>{statusLabel}</Badge>
      </View>

      <View style={styles.planPanel}>
        <View style={styles.planIcon}>
          <CreditCard size={20} color={colors.white} />
        </View>
        <AppText variant="h2" color={colors.white} numberOfLines={2}>
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

      <Button
        fullWidth
        onPress={() => router.push(ROUTES.PUBLIC.PRICING)}
        leftIcon={<Sparkles size={16} color={colors.white} />}
        rightIcon={<ArrowUpRight size={16} color={colors.white} />}
      >
        Nâng cấp MediMate+
      </Button>

      {usageList.length > 0 ? (
        <View style={styles.usagePanel}>
          <View style={styles.usageHeader}>
            <View style={styles.usageHeaderIcon}>
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

          {usageList.map((item, index) => (
            <View key={item.quotaCode ?? item.code ?? index} style={styles.usageCard}>
              <View style={styles.usageTopRow}>
                <View style={styles.usageTitleWrap}>
                  <AppText variant="bodyStrong" numberOfLines={2}>
                    {getQuotaDisplayName(item, index)}
                  </AppText>
                  <AppText variant="caption" color={colors.subtle}>
                    Đã dùng {formatCount(item.usedCount)}
                    {Number(item.reservedCount) > 0 ? ` · đang giữ ${formatCount(item.reservedCount)}` : ""}
                  </AppText>
                </View>
                <View style={styles.remainingPill}>
                  <AppText variant="caption" color={colors.teal}>
                    Còn lại
                  </AppText>
                  <AppText variant="bodyStrong" color={colors.teal}>
                    {formatCount(item.remainingCount)}/{formatCount(item.limitValue ?? item.grantedCount)}
                  </AppText>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${getUsagePercent(item)}%` }]} />
              </View>
              {item.cycleEnd ? (
                <AppText variant="caption" color={colors.muted}>
                  Làm mới vào {formatDateTime(item.cycleEnd)}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  iconMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.mint,
  },
  titleCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  planPanel: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.teal,
    padding: spacing.lg,
  },
  planIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.14)",
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
  usageHeaderIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
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
  usageCard: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(221,228,213,0.78)",
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  usageTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  usageTitleWrap: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  remainingPill: {
    alignItems: "flex-end",
    gap: spacing.xs / 2,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  progressTrack: {
    height: 7,
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
