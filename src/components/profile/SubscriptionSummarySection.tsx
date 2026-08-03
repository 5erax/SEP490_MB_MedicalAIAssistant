import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Sparkles } from "lucide-react-native";

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

  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headerRow}>
        <AppText variant="h3">Gói dịch vụ</AppText>
        <Badge tone={active ? "success" : "neutral"}>{formatSubscriptionStatus(subscription?.statusName)}</Badge>
      </View>

      <AppText variant="h2">{formatPlanName(subscription?.planName)}</AppText>

      {subscription?.endDate ? (
        <AppText color={colors.muted}>Hiệu lực đến {formatDateTime(subscription.endDate)}</AppText>
      ) : (
        <AppText color={colors.muted}>Bạn đang dùng các quyền lợi miễn phí của MediMate AI.</AppText>
      )}

      <Button onPress={() => router.push(ROUTES.PUBLIC.PRICING)}>
        <View style={styles.upgradeInline}>
          <Sparkles size={16} color={colors.ink} />
          <AppText variant="bodyStrong">Nâng cấp MediMate+</AppText>
        </View>
      </Button>

      {usageList.length > 0 ? (
        <View style={styles.usageGroup}>
          <AppText variant="caption" color={colors.subtle}>
            Hạn mức sử dụng
          </AppText>
          {usageList.map((item) => (
            <View key={item.quotaCode} style={styles.usageCard}>
              <AppText variant="caption" color={colors.subtle}>
                {item.quotaName || "Hạn mức sử dụng"}
              </AppText>
              <AppText variant="h3">
                {item.remainingCount ?? "—"}/{item.limitValue ?? "—"}
              </AppText>
              <AppText variant="caption" color={colors.muted}>
                Đã dùng {item.usedCount ?? 0}
                {Number(item.reservedCount) > 0 ? ` · đang giữ chỗ ${item.reservedCount}` : ""}
                {item.cycleEnd ? ` · làm mới vào ${formatDateTime(item.cycleEnd)}` : ""}
              </AppText>
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
  upgradeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  usageGroup: {
    gap: spacing.sm,
  },
  usageCard: {
    gap: spacing.xs / 2,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
});
