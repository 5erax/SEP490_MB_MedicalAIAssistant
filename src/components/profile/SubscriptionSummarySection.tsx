import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ArrowUpRight, CalendarClock, CreditCard, Sparkles, WalletCards } from "lucide-react-native";

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
        <View style={styles.planTopRow}>
          <View style={styles.planIcon}>
            <WalletCards size={20} color={colors.white} />
          </View>
          <Badge tone={active ? "success" : "neutral"}>{active ? "Đang dùng" : statusLabel}</Badge>
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
        <View style={styles.usageGroup}>
          <View style={styles.usageHeader}>
            <View>
              <AppText variant="bodyStrong">Hạn mức sử dụng</AppText>
              <AppText variant="caption" color={colors.subtle}>
                Theo dõi số lượt còn lại trong chu kỳ hiện tại
              </AppText>
            </View>
            <Badge tone="info">{usageList.length} quyền lợi</Badge>
          </View>
          {usageList.map((item) => (
            <View key={item.quotaCode} style={styles.usageCard}>
              <View style={styles.usageTopRow}>
                <View style={styles.usageTitleWrap}>
                  <AppText variant="bodyStrong" numberOfLines={2}>
                    {item.quotaName || "Hạn mức sử dụng"}
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
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
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
  usageGroup: {
    gap: spacing.sm,
  },
  usageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  usageCard: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
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
