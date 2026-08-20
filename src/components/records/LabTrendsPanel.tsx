import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";

import { ApiMessage, AppText, Button, Card, EmptyState, LoadingState } from "@/src/components/ui";
import { labTestsApi } from "@/src/services/labTestService";
import { colors, spacing } from "@/src/theme/tokens";
import { LabIndicatorTrend, LabTrendIndicator } from "@/src/types/labTest";

export function LabTrendsPanel() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [indicators, setIndicators] = useState<LabTrendIndicator[]>([]);
  const [trend, setTrend] = useState<LabIndicatorTrend | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true); setError("");
    labTestsApi.trendIndicators().then((response) => setIndicators(response.data ?? [])).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Không thể tải xu hướng chỉ số.")).finally(() => setLoading(false));
  }, [visible]);

  async function openTrend(indicator: LabTrendIndicator) {
    setLoading(true); setError(""); setTrend(null);
    try { const response = await labTestsApi.indicatorTrend(indicator.indicatorId); setTrend(response.data ?? null); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Không thể tải lịch sử chỉ số."); }
    finally { setLoading(false); }
  }

  return <>
    <Button variant="secondary" onPress={() => setVisible(true)}>Xem xu hướng chỉ số</Button>
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVisible(false)}>
      <View style={styles.root}><View style={styles.header}><View style={styles.copy}><AppText variant="eyebrow" color={colors.teal}>Dữ liệu xét nghiệm</AppText><AppText variant="h2">Xu hướng chỉ số</AppText></View><Button variant="secondary" size="sm" onPress={() => setVisible(false)}>Đóng</Button></View>
        <ScrollView contentContainerStyle={styles.content}>
          <ApiMessage type="info" message="So sánh chỉ dùng dữ liệu xét nghiệm đã lưu trong tài khoản. Khoảng tham chiếu và đơn vị có thể khác giữa cơ sở; không tự diễn giải xu hướng thành chẩn đoán." />
          <ApiMessage type="error" message={error} />
          {loading ? <LoadingState title="Đang tải dữ liệu xu hướng..." /> : null}
          {!loading && !trend && !indicators.length ? <EmptyState title="Chưa đủ dữ liệu" description="Cần có chỉ số được đo qua các phiên xét nghiệm để tạo xu hướng." /> : null}
          {!loading && !trend ? indicators.map((indicator) => <Card key={indicator.indicatorId} style={styles.card}><AppText variant="bodyStrong">{indicator.name || indicator.symbol || "Chỉ số"}</AppText><AppText variant="caption" color={colors.muted}>{indicator.measurementCount} lần đo · {indicator.unit || "Đơn vị chưa xác định"}</AppText><Button variant="secondary" onPress={() => void openTrend(indicator)}>Xem lịch sử</Button></Card>) : null}
          {trend ? <><Button variant="secondary" onPress={() => setTrend(null)}>Quay lại danh sách</Button><Card style={styles.card}><AppText variant="h3">{trend.name || trend.symbol || "Chỉ số"}</AppText><AppText color={colors.muted}>Giá trị mới nhất: {trend.latestValue ?? "—"} {trend.unit || ""}</AppText>{trend.hasMixedUnits ? <ApiMessage type="warning" message="Các lần đo có đơn vị khác nhau; không so sánh trực tiếp nếu chưa được bác sĩ xác nhận." /> : null}</Card>{(trend.points ?? []).map((point) => <Card key={`${point.sessionId}-${point.testDate}`} variant="soft" style={styles.card}><AppText variant="bodyStrong">{point.testDate}: {point.value} {point.unit || trend.unit || ""}</AppText><AppText variant="caption" color={colors.muted}>Khoảng tham chiếu từ phiên này: {point.referenceMin ?? "—"} – {point.referenceMax ?? "—"} {point.unit || ""}</AppText>{point.facilityName ? <AppText variant="caption" color={colors.muted}>Nguồn: {point.facilityName}</AppText> : null}</Card>)}</> : null}
        </ScrollView>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line },
  copy: { flex: 1, gap: spacing.xs },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing["4xl"] },
  card: { gap: spacing.sm },
});
