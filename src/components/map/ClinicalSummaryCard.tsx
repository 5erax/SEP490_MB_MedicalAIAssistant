import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, ClipboardCheck, Stethoscope } from "lucide-react-native";

import { AppText, Badge, Button, Card } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ClinicalStatus } from "@/src/hooks/useClinicalRecommendation";
import { ClinicalDepartment } from "@/src/types/symptomAnalysis";
import { ROUTES } from "@/src/navigation/routes";

type ClinicalSummaryCardProps = {
  status: ClinicalStatus;
  notice: string;
  department: ClinicalDepartment | null;
  unavailableCount: number;
  recommendedCount: number;
  sessionId?: string;
};

function confidencePercent(value: number | undefined) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric <= 1 ? numeric * 100 : numeric)));
}

export function ClinicalSummaryCard({ status, notice, department, unavailableCount, recommendedCount, sessionId }: ClinicalSummaryCardProps) {
  if (status === "idle") return null;
  const confidence = confidencePercent(department?.confidenceScore);

  return (
    <Card variant="soft" style={styles.card}>
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
          <View style={styles.readyHead}>
            <View style={styles.iconBox}>
              <Stethoscope size={19} color={colors.teal} />
            </View>
            <View style={styles.titleGroup}>
              <AppText variant="caption" color={colors.teal}>
                Kết quả tư vấn đang dùng để lọc bản đồ
              </AppText>
              <AppText variant="h3" numberOfLines={2}>
                {department?.departmentName || "Chưa xác định chuyên khoa"}
              </AppText>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <AppText variant="caption" color={colors.subtle}>
                Độ phù hợp
              </AppText>
              <AppText variant="bodyStrong" color={colors.teal}>
                {confidence > 0 ? `${confidence}%` : "Đang cập nhật"}
              </AppText>
            </View>
            <View style={styles.metricBox}>
              <AppText variant="caption" color={colors.subtle}>
                Cơ sở phù hợp
              </AppText>
              <AppText variant="bodyStrong" color={colors.teal}>
                {recommendedCount}
              </AppText>
            </View>
          </View>
          {department?.reason ? (
            <AppText color={colors.muted} numberOfLines={3}>
              {department.reason}
            </AppText>
          ) : (
            <AppText color={colors.muted}>
              Chọn một cơ sở bên dưới để xem thông tin, bác sĩ đang hoạt động và mở chỉ đường khi cần.
            </AppText>
          )}
          {unavailableCount > 0 ? (
            <Badge tone="warning">{unavailableCount} cơ sở gợi ý hiện không còn khả dụng</Badge>
          ) : null}
          <Button
            fullWidth
            onPress={() =>
              router.push({
                pathname: ROUTES.PATIENT.PRE_CONSULTATION as never,
                params: sessionId ? { sessionId } : undefined,
              })
            }
          >
            <View style={styles.ctaInline}>
              <ClipboardCheck size={17} color={colors.white} />
              <AppText variant="bodyStrong" color={colors.white}>
                Tư vấn trước khi đến khám
              </AppText>
              <ArrowRight size={17} color={colors.white} />
            </View>
          </Button>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderColor: "rgba(8,127,140,0.22)",
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
    gap: spacing.md,
  },
  readyHead: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  titleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricBox: {
    flex: 1,
    gap: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  ctaInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
