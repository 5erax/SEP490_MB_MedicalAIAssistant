import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, ShieldAlert } from "lucide-react-native";

import { AppText, Button, Card } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { LabResult } from "@/src/types/labTest";
import { cleanAiSummary } from "@/src/utils/labTestPresentation";

type SummaryState = "idle" | "loading" | "ready" | "error";

type ResultOverviewProps = {
  results: LabResult[];
  summary: string;
  summaryState: SummaryState;
  summaryError: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  onRetrySummary: () => void;
};

function isCritical(result: LabResult) {
  return result.status === "criticalHigh" || result.status === "criticalLow";
}

function isAttention(result: LabResult) {
  return isCritical(result) || result.status === "high" || result.status === "low";
}

function resultName(result: LabResult) {
  return result.indicator?.fullName || result.rawExtractedName || result.indicator?.symbol || "Chỉ số chưa đặt tên";
}

function fallbackSummary(results: LabResult[]) {
  const critical = results.filter(isCritical);
  const attention = results.filter((result) => !isCritical(result) && isAttention(result));
  const normal = results.filter((result) => result.status === "normal");
  const unknown = results.filter((result) => result.status === "unknown");
  const focus = [...critical, ...attention].slice(0, 3).map(resultName);

  if (!results.length) return "Phiên đã hoàn tất nhưng chưa có đủ chỉ số để tạo nhận định tổng quan.";
  if (critical.length) return `Có ${critical.length} chỉ số ở mức cần xử lý sớm${focus.length ? `, gồm ${focus.join(", ")}` : ""}. Hãy trao đổi với nhân viên y tế, đặc biệt khi bạn có triệu chứng bất thường.`;
  if (attention.length) return `${normal.length}/${results.length} chỉ số nằm trong khoảng tham chiếu. Có ${attention.length} chỉ số cần chú ý${focus.length ? `: ${focus.join(", ")}` : ""}.`;
  if (normal.length && !unknown.length) return "Các chỉ số đã nhận diện đều nằm trong khoảng tham chiếu. Bạn vẫn nên theo dõi sức khỏe và thực hiện theo hướng dẫn của bác sĩ nếu có.";
  return `Có ${unknown.length} chỉ số chưa đủ dữ liệu để đánh giá. Các chỉ số này không được xem là bình thường và cần đối chiếu thêm với phiếu gốc.`;
}

export function ResultOverview({
  results,
  summary,
  summaryState,
  summaryError,
  expanded,
  onToggleExpanded,
  onRetrySummary,
}: ResultOverviewProps) {
  const criticalCount = results.filter(isCritical).length;
  const attentionCount = results.filter((result) => !isCritical(result) && isAttention(result)).length;
  const normalCount = results.filter((result) => result.status === "normal").length;
  const unknownCount = results.filter((result) => result.status === "unknown").length;
  const cleanedSummary = cleanAiSummary(summary);
  const preview = fallbackSummary(results);
  const priorityResults = results.filter(isAttention).slice(0, 3);

  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headingRow}>
        <View style={[styles.iconBox, criticalCount ? styles.iconDanger : styles.iconWarning]}>
          {criticalCount ? <ShieldAlert size={21} color={colors.danger} /> : <ClipboardCheck size={21} color={colors.warning} />}
        </View>
        <View style={styles.headingText}>
          <AppText variant="eyebrow" color={colors.teal}>Tổng quan kết quả</AppText>
          <AppText variant="h3">
            {criticalCount ? "Có chỉ số cần xử lý sớm" : attentionCount ? "Có một số chỉ số cần chú ý" : "Kết quả nhìn chung ổn định"}
          </AppText>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric label="Nguy cấp" value={criticalCount} tone="danger" />
        <Metric label="Cần chú ý" value={attentionCount} tone="warning" />
        <Metric label="Bình thường" value={normalCount} tone="success" />
        <Metric label="Chưa rõ" value={unknownCount} tone="neutral" />
      </View>

      <View style={styles.summaryBox}>
        <AppText variant="caption" color={colors.subtle}>NHẬN ĐỊNH CHUNG</AppText>
        <AppText>{preview}</AppText>
        {summaryState === "loading" ? (
          <View style={styles.summaryState}>
            <ActivityIndicator size="small" color={colors.teal} />
            <AppText variant="caption" color={colors.muted}>Đang tạo bản tóm tắt đầy đủ…</AppText>
          </View>
        ) : null}
        {summaryState === "error" ? (
          <View style={styles.summaryError}>
            <AppText variant="caption" color={colors.danger}>{summaryError}</AppText>
            <Button size="sm" variant="secondary" onPress={onRetrySummary}>Thử lại</Button>
          </View>
        ) : null}
      </View>

      {priorityResults.length ? (
        <View style={styles.priorityGroup}>
          <View style={styles.sectionTitle}>
            <AlertTriangle size={17} color={colors.warning} />
            <AppText variant="bodyStrong">Nên xem trước</AppText>
          </View>
          {priorityResults.map((result, index) => (
            <View key={result.resultDetailId || `${resultName(result)}-${index}`} style={styles.priorityRow}>
              <View style={styles.priorityCopy}>
                <AppText variant="bodyStrong">{resultName(result)}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  {result.userValue ?? result.rawExtractedValue ?? "—"} {result.referenceRangeUsed?.unit ?? result.referenceUnitUsed ?? ""}
                </AppText>
              </View>
              <AppText variant="caption" color={isCritical(result) ? colors.danger : colors.warning}>
                {isCritical(result) ? "Nguy cấp" : result.status === "high" ? "Cao" : "Thấp"}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.allGood}>
          <CheckCircle2 size={17} color={colors.success} />
          <AppText variant="caption" color={colors.muted}>Chưa ghi nhận chỉ số nằm ngoài khoảng tham chiếu.</AppText>
        </View>
      )}

      {cleanedSummary ? (
        <View style={styles.fullSummary}>
          <Pressable accessibilityRole="button" onPress={onToggleExpanded} style={styles.summaryToggle}>
            <AppText variant="bodyStrong" color={colors.teal}>{expanded ? "Thu gọn phân tích tổng quan" : "Xem phân tích tổng quan đầy đủ"}</AppText>
            {expanded ? <ChevronUp size={17} color={colors.teal} /> : <ChevronDown size={17} color={colors.teal} />}
          </Pressable>
          {expanded ? <AppText color={colors.muted}>{cleanedSummary}</AppText> : null}
        </View>
      ) : null}
    </Card>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "danger" | "warning" | "success" | "neutral" }) {
  const toneColor = tone === "danger" ? colors.danger : tone === "warning" ? colors.warning : tone === "success" ? colors.success : colors.muted;
  return (
    <View style={styles.metric}>
      <AppText variant="h3" color={toneColor}>{value}</AppText>
      <AppText variant="caption" color={colors.muted}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg, borderTopWidth: 3, borderTopColor: colors.teal },
  headingRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconBox: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.md },
  iconWarning: { backgroundColor: colors.warningBg },
  iconDanger: { backgroundColor: colors.dangerBg },
  headingText: { flex: 1, gap: spacing.xs / 2 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: { minWidth: "47%", flexGrow: 1, gap: spacing.xs / 2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.paper, padding: spacing.md },
  summaryBox: { gap: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.warning, borderRadius: radius.sm, backgroundColor: colors.warningBg, padding: spacing.md },
  summaryState: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  summaryError: { gap: spacing.sm, alignItems: "flex-start" },
  priorityGroup: { gap: spacing.sm },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.paper, padding: spacing.md },
  priorityCopy: { flex: 1, gap: spacing.xs / 2 },
  allGood: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  fullSummary: { gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  summaryToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
});
