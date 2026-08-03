import { StyleSheet, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";

import { AppText, Button, Card } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme/tokens";
import { UserSubscription } from "@/src/types/subscription";

type CurrentSubscriptionCardProps = {
  loading: boolean;
  error: string;
  activeSubscription: UserSubscription | null;
  onRetry: () => void;
  onCancel: () => void;
};

export function CurrentSubscriptionCard({ loading, error, activeSubscription, onRetry, onCancel }: CurrentSubscriptionCardProps) {
  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.header}>
        <ShieldCheck size={20} color={colors.limeDark} />
        <AppText variant="caption" color={colors.subtle}>
          Gói của bạn
        </AppText>
      </View>

      <AppText variant="h3">{loading ? "Đang kiểm tra..." : error ? "Chưa thể xác định" : activeSubscription?.planName || "Gói miễn phí"}</AppText>

      {loading ? (
        <AppText color={colors.muted}>Đang đồng bộ thông tin gói của tài khoản.</AppText>
      ) : error ? (
        <AppText color={colors.muted}>{error} Dữ liệu tài khoản của bạn chưa bị thay đổi.</AppText>
      ) : activeSubscription ? (
        <AppText color={colors.muted}>
          Có hiệu lực đến{" "}
          <AppText variant="bodyStrong">
            {activeSubscription.endDate ? new Date(activeSubscription.endDate).toLocaleDateString("vi-VN") : "đang cập nhật"}
          </AppText>
          . Gia hạn tự động: <AppText variant="bodyStrong">{activeSubscription.autoRenew ? "Bật" : "Tắt"}</AppText>.
        </AppText>
      ) : (
        <AppText color={colors.muted}>Bạn chưa có gói trả phí đang hoạt động.</AppText>
      )}

      {error && !loading ? (
        <Button variant="secondary" size="sm" onPress={onRetry}>
          Thử lại
        </Button>
      ) : null}
      {!error && activeSubscription?.autoRenew ? (
        <Button variant="secondary" size="sm" onPress={onCancel}>
          Hủy gia hạn
        </Button>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
