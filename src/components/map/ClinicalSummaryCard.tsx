import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AppText, Badge, Button, Card } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme/tokens";
import { ClinicalStatus } from "@/src/hooks/useClinicalRecommendation";
import { ClinicalDepartment } from "@/src/types/symptomAnalysis";
import { ROUTES } from "@/src/navigation/routes";

type ClinicalSummaryCardProps = {
  status: ClinicalStatus;
  notice: string;
  department: ClinicalDepartment | null;
  unavailableCount: number;
};

export function ClinicalSummaryCard({ status, notice, department, unavailableCount }: ClinicalSummaryCardProps) {
  if (status === "idle") return null;

  return (
    <Card variant="soft" style={styles.card}>
      <AppText variant="caption" color={colors.subtle}>
        Gợi ý từ tư vấn chuyên khoa
      </AppText>

      {status === "loading" ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.teal} size="small" />
          <AppText color={colors.muted}>Đang khôi phục kết quả gợi ý...</AppText>
        </View>
      ) : null}

      {status === "locked" ? (
        <View style={styles.noticeGroup}>
          <AppText color={colors.muted}>{notice}</AppText>
          <Button size="sm" onPress={() => router.push(ROUTES.PUBLIC.LOGIN)}>
            Đăng nhập
          </Button>
        </View>
      ) : null}

      {status === "error" ? (
        <View style={styles.noticeGroup}>
          <AppText color={colors.warning}>{notice}</AppText>
          <Button variant="secondary" size="sm" onPress={() => router.replace(ROUTES.PATIENT.HOME)}>
            Quay lại trang chủ
          </Button>
        </View>
      ) : null}

      {status === "ready" ? (
        <View style={styles.readyGroup}>
          <AppText variant="h3">{department?.departmentName || "Chưa xác định chuyên khoa"}</AppText>
          {unavailableCount > 0 ? (
            <Badge tone="warning">{unavailableCount} cơ sở gợi ý hiện không còn khả dụng</Badge>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  noticeGroup: {
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  readyGroup: {
    gap: spacing.xs,
  },
});
