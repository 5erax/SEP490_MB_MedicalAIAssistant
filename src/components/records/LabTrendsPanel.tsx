import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AlertTriangle, BarChart3, ChevronLeft, RefreshCw, TrendingUp, X } from "lucide-react-native";

import { ApiMessage, AppText, Card, EmptyState, LoadingState } from "@/src/components/ui";
import { labTestsApi } from "@/src/services/labTestService";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { LabIndicatorTrend, LabTrendIndicator } from "@/src/types/labTest";
import { formatDateOnly } from "@/src/utils/labTestPresentation";
import { LabTrendChart } from "./LabTrendChart";

type RangeKey = "all" | "3m" | "6m" | "1y";

const RANGE_OPTIONS: { value: RangeKey; label: string; months?: number }[] = [
  { value: "all", label: "Tất cả" },
  { value: "3m", label: "3 tháng", months: 3 },
  { value: "6m", label: "6 tháng", months: 6 },
  { value: "1y", label: "1 năm", months: 12 },
];

const TREND_LABELS: Record<string, string> = {
  insufficientData: "Chưa đủ dữ liệu để xác định xu hướng",
  inRange: "Đang duy trì trong khoảng tham chiếu",
  towardReferenceRange: "Đang tiến gần khoảng tham chiếu",
  awayFromReferenceRange: "Đang xa khoảng tham chiếu hơn",
  stable: "Xu hướng tương đối ổn định",
};

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getRange(key: RangeKey) {
  const option = RANGE_OPTIONS.find((item) => item.value === key);
  if (!option?.months) return {};
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - option.months);
  return { from: toDateValue(from), to: toDateValue(to) };
}

function indicatorLabel(indicator: LabTrendIndicator) {
  if (indicator.name && indicator.symbol) return `${indicator.name} (${indicator.symbol})`;
  return indicator.name || indicator.symbol || "Chỉ số chưa đặt tên";
}

export function LabTrendsPanel({ onOpenSession }: { onOpenSession: (sessionId: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [rangeKey, setRangeKey] = useState<RangeKey>("all");
  const [indicators, setIndicators] = useState<LabTrendIndicator[]>([]);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState("");
  const [trend, setTrend] = useState<LabIndicatorTrend | null>(null);
  const [indicatorState, setIndicatorState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [trendState, setTrendState] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");
  const [error, setError] = useState("");

  const loadTrend = useCallback(async (indicatorId: string, nextRangeKey: RangeKey) => {
    if (!indicatorId) return;
    setTrendState("loading");
    setError("");
    try {
      const response = await labTestsApi.indicatorTrend(indicatorId, getRange(nextRangeKey));
      setTrend(response.data ?? null);
      setTrendState(response.data ? "ready" : "empty");
    } catch (requestError) {
      const status = (requestError as { status?: number }).status;
      setTrend(null);
      setTrendState(status === 404 ? "empty" : "error");
      setError(status === 404 ? "Chưa có dữ liệu trong khoảng thời gian này." : (requestError as Error)?.message || "Không thể tải lịch sử chỉ số.");
    }
  }, []);

  const loadIndicators = useCallback(async (nextRangeKey: RangeKey, preferredId = "") => {
    setIndicatorState("loading");
    setError("");
    try {
      const response = await labTestsApi.trendIndicators(getRange(nextRangeKey));
      const nextIndicators = response.data ?? [];
      setIndicators(nextIndicators);
      setIndicatorState("ready");
      const nextId = nextIndicators.some((item) => item.indicatorId === preferredId) ? preferredId : nextIndicators[0]?.indicatorId ?? "";
      setSelectedIndicatorId(nextId);
      if (nextId) await loadTrend(nextId, nextRangeKey);
      else {
        setTrend(null);
        setTrendState("idle");
      }
    } catch (requestError) {
      setIndicators([]);
      setTrend(null);
      setIndicatorState("error");
      setTrendState("idle");
      setError((requestError as Error)?.message || "Không thể tải danh sách chỉ số có thể theo dõi.");
    }
  }, [loadTrend]);

  useEffect(() => {
    if (visible && indicatorState === "idle") void loadIndicators(rangeKey);
  }, [visible, indicatorState, loadIndicators, rangeKey]);

  function changeRange(nextRangeKey: RangeKey) {
    setRangeKey(nextRangeKey);
    void loadIndicators(nextRangeKey, selectedIndicatorId);
  }

  function changeIndicator(indicatorId: string) {
    setSelectedIndicatorId(indicatorId);
    void loadTrend(indicatorId, rangeKey);
  }

  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setVisible(true)} style={styles.entryCard}>
        <View style={styles.entryIcon}><TrendingUp size={21} color={colors.teal} /></View>
        <View style={styles.entryCopy}>
          <AppText variant="bodyStrong">Theo dõi xu hướng chỉ số</AppText>
          <AppText variant="caption" color={colors.muted}>So sánh các lần xét nghiệm đã lưu theo thời gian</AppText>
        </View>
        <BarChart3 size={20} color={colors.teal} />
      </Pressable>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVisible(false)}>
        <View style={styles.root}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText variant="eyebrow" color={colors.teal}>Dữ liệu xét nghiệm</AppText>
              <AppText variant="h2">Xu hướng chỉ số</AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={() => setVisible(false)} style={styles.closeButton}>
              <X size={20} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <ApiMessage type="info" message="Biểu đồ chỉ hiển thị dữ liệu và phân loại do hệ thống trả về; không tự suy luận thành chẩn đoán." />

            <View style={styles.section}>
              <AppText variant="caption" color={colors.subtle}>KHOẢNG THỜI GIAN</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {RANGE_OPTIONS.map((option) => (
                  <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: rangeKey === option.value }} onPress={() => changeRange(option.value)} style={[styles.chip, rangeKey === option.value && styles.chipSelected]}>
                    <AppText variant="caption" color={rangeKey === option.value ? colors.white : colors.muted}>{option.label}</AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {indicatorState === "loading" && !indicators.length ? <LoadingState title="Đang tải các chỉ số có thể theo dõi…" /> : null}
            {indicatorState === "error" ? <EmptyState title="Không thể tải xu hướng" description={error} /> : null}
            {indicatorState === "ready" && !indicators.length ? <EmptyState title="Chưa có dữ liệu xu hướng" description="Cần có kết quả xét nghiệm đã phân tích để theo dõi thay đổi theo thời gian." /> : null}

            {indicators.length ? (
              <View style={styles.section}>
                <AppText variant="caption" color={colors.subtle}>CHỌN CHỈ SỐ</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {indicators.map((indicator) => (
                    <Pressable key={indicator.indicatorId} accessibilityRole="button" accessibilityState={{ selected: selectedIndicatorId === indicator.indicatorId }} onPress={() => changeIndicator(indicator.indicatorId)} style={[styles.chip, selectedIndicatorId === indicator.indicatorId && styles.chipSelected]}>
                      <AppText variant="caption" color={selectedIndicatorId === indicator.indicatorId ? colors.white : colors.muted}>{indicatorLabel(indicator)}</AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {trendState === "loading" ? <LoadingState title="Đang tải xu hướng chỉ số…" /> : null}
            {trendState === "error" || trendState === "empty" ? <EmptyState title="Chưa thể hiển thị xu hướng" description={error || "Hãy thử chỉ số hoặc khoảng thời gian khác."} /> : null}

            {trendState === "ready" && trend ? (
              <>
                <Card style={styles.trendCard}>
                  <View style={styles.trendHeader}>
                    <View style={styles.trendHeading}>
                      <AppText variant="h3">{trend.name || trend.symbol || "Chỉ số"}</AppText>
                      <AppText variant="caption" color={colors.muted}>{trend.measurementCount} lần đo · {trend.unit || "Chưa rõ đơn vị"}</AppText>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel="Tải lại xu hướng" onPress={() => loadTrend(selectedIndicatorId, rangeKey)} style={styles.refreshButton}>
                      <RefreshCw size={17} color={colors.teal} />
                    </Pressable>
                  </View>
                  <View style={styles.metrics}>
                    <View style={styles.metric}><AppText variant="caption" color={colors.subtle}>Gần nhất</AppText><AppText variant="h3">{trend.latestValue ?? "—"} {trend.unit || ""}</AppText></View>
                    <View style={styles.metric}><AppText variant="caption" color={colors.subtle}>Lần trước</AppText><AppText variant="h3">{trend.previousValue ?? "—"} {trend.unit || ""}</AppText></View>
                  </View>
                  <View style={styles.trendLabel}><TrendingUp size={17} color={colors.teal} /><AppText variant="bodyStrong" color={colors.teal}>{TREND_LABELS[trend.trend || ""] || "Chưa có kết luận xu hướng"}</AppText></View>
                  {trend.hasMixedUnits ? <View style={styles.warning}><AlertTriangle size={17} color={colors.warning} /><AppText variant="caption" color={colors.muted} style={styles.flexText}>Các lần đo dùng nhiều đơn vị khác nhau; hệ thống không tự chuyển đổi để so sánh.</AppText></View> : null}
                  <LabTrendChart trend={trend} />
                </Card>

                <View style={styles.section}>
                  <AppText variant="bodyStrong">Các lần đo</AppText>
                  {(trend.points ?? []).slice().reverse().map((point, index) => (
                    <Pressable key={`${point.sessionId}-${point.testDate}-${index}`} accessibilityRole="button" onPress={() => { setVisible(false); onOpenSession(point.sessionId); }} style={styles.pointRow}>
                      <View style={styles.pointCopy}><AppText variant="bodyStrong">{formatDateOnly(point.testDate)}</AppText><AppText variant="caption" color={colors.muted}>{point.facilityName || "Không ghi nhận cơ sở"}</AppText></View>
                      <AppText variant="bodyStrong" color={point.status === "normal" ? colors.success : colors.warning}>{point.value} {point.unit || trend.unit || ""}</AppText>
                      <ChevronLeft size={16} color={colors.subtle} style={{ transform: [{ rotate: "180deg" }] }} />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  entryCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, backgroundColor: colors.paper, padding: spacing.lg },
  entryIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.mint },
  entryCopy: { flex: 1, gap: spacing.xs / 2 },
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line },
  headerCopy: { flex: 1, gap: spacing.xs / 2 },
  closeButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.paperSoft },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing["4xl"] },
  section: { gap: spacing.sm },
  chipRow: { gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, backgroundColor: colors.paper, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipSelected: { borderColor: colors.teal, backgroundColor: colors.teal },
  trendCard: { gap: spacing.lg },
  trendHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  trendHeading: { flex: 1, gap: spacing.xs / 2 },
  refreshButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md },
  metrics: { flexDirection: "row", gap: spacing.sm },
  metric: { flex: 1, gap: spacing.xs / 2, borderRadius: radius.md, backgroundColor: colors.paperSoft, padding: spacing.md },
  trendLabel: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.mint, padding: spacing.md },
  warning: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.warningBg, padding: spacing.md },
  flexText: { flex: 1 },
  pointRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.paper, padding: spacing.md },
  pointCopy: { flex: 1, gap: spacing.xs / 2 },
});
