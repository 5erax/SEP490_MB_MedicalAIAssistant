import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ChevronDown, ChevronUp, FileSearch, ShieldAlert, X } from "lucide-react-native";

import { AppText, Badge, Button, EmptyState, LoadingState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { LabOcrExtract, LabResult, LabTestSession } from "@/src/types/labTest";
import { formatDateOnly, getLabSessionDate, getSessionStatusPresentation } from "@/src/utils/labTestPresentation";
import { ResultCard } from "./ResultCard";
import { ResultOverview } from "./ResultOverview";

const GENDER_LABEL: Record<string, string> = { male: "Nam", female: "Nữ" };
const INITIAL_RESULT_LIMIT = 6;
type ResultFilter = "attention" | "normal" | "unknown" | "all";

type SessionDetailSheetProps = {
  visible: boolean;
  session: LabTestSession | null;
  ocrExtracts: LabOcrExtract[];
  state: "idle" | "loading" | "ready" | "error";
  error: string;
  summary: string;
  summaryState: "idle" | "loading" | "ready" | "error";
  summaryError: string;
  onClose: () => void;
  onRetry: () => void;
  onRetrySummary: () => void;
};

function isCritical(result: LabResult) {
  return result.status === "criticalHigh" || result.status === "criticalLow";
}

function isAttention(result: LabResult) {
  return isCritical(result) || result.status === "high" || result.status === "low";
}

function priority(result: LabResult) {
  if (isCritical(result)) return 0;
  if (isAttention(result)) return 1;
  if (result.status === "unknown") return 2;
  return 3;
}

function resultMatchesFilter(result: LabResult, filter: ResultFilter) {
  if (filter === "attention") return isAttention(result);
  if (filter === "normal") return result.status === "normal";
  if (filter === "unknown") return result.status === "unknown";
  return true;
}

export function SessionDetailSheet({ visible, session, ocrExtracts, state, error, summary, summaryState, summaryError, onClose, onRetry, onRetrySummary }: SessionDetailSheetProps) {
  const [showRawText, setShowRawText] = useState(false);
  const [showOcrExtracts, setShowOcrExtracts] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_RESULT_LIMIT);
  const status = session ? getSessionStatusPresentation(session.status) : null;
  const results = useMemo(() => session?.results ?? [], [session?.results]);
  const counts = useMemo(() => ({
    attention: results.filter(isAttention).length,
    normal: results.filter((result) => result.status === "normal").length,
    unknown: results.filter((result) => result.status === "unknown").length,
  }), [results]);
  const orderedResults = useMemo(() => results.map((result, index) => ({ result, index })).sort((left, right) => priority(left.result) - priority(right.result) || left.index - right.index), [results]);
  const filteredResults = useMemo(() => orderedResults.filter(({ result }) => resultMatchesFilter(result, resultFilter)), [orderedResults, resultFilter]);
  const visibleResults = filteredResults.slice(0, visibleLimit);

  useEffect(() => {
    setShowRawText(false);
    setShowOcrExtracts(false);
    setShowFullSummary(false);
    setVisibleLimit(INITIAL_RESULT_LIMIT);
    setResultFilter(results.some(isAttention) ? "attention" : "all");
  }, [session?.sessionId, results]);

  function changeFilter(filter: ResultFilter) {
    setResultFilter(filter);
    setVisibleLimit(INITIAL_RESULT_LIMIT);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.headerMeta}>
              <AppText variant="caption" color={colors.teal}>CHI TIẾT PHÂN TÍCH</AppText>
              {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
            </View>
            <AppText variant="h3">{session ? `Kết quả ngày ${formatDateOnly(getLabSessionDate(session))}` : "Kết quả xét nghiệm"}</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {state === "loading" ? (
            <LoadingState title="Đang tải chi tiết phân tích..." />
          ) : state === "error" ? (
            <View style={styles.errorGroup}>
              <AppText color={colors.danger}>{error}</AppText>
              <Button variant="secondary" onPress={onRetry}>Thử lại</Button>
            </View>
          ) : session ? (
            <>
              <View style={styles.safetyNote}>
                <ShieldAlert size={17} color={colors.teal} />
                <AppText variant="caption" color={colors.muted} style={styles.bannerText}>Kết quả hỗ trợ định hướng. Khi có chỉ số bất thường hoặc triệu chứng đáng lo, hãy trao đổi với nhân viên y tế.</AppText>
              </View>

              <View style={styles.metaCard}>
                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}><AppText variant="caption" color={colors.subtle}>Giới tính</AppText><AppText variant="bodyStrong">{GENDER_LABEL[session.patientGenderAtTest || ""] || "—"}</AppText></View>
                  <View style={styles.metaItem}><AppText variant="caption" color={colors.subtle}>Tuổi</AppText><AppText variant="bodyStrong">{session.patientAgeAtTest ?? "—"}</AppText></View>
                  <View style={styles.metaItem}><AppText variant="caption" color={colors.subtle}>Chỉ số</AppText><AppText variant="bodyStrong">{results.length}</AppText></View>
                </View>
              </View>

              {session.status === "processing" ? <View style={styles.infoBanner}><ActivityIndicator color={colors.teal} size="small" /><AppText color={colors.muted} style={styles.bannerText}>Hệ thống đang đọc phiếu xét nghiệm. Màn hình sẽ tự cập nhật khi có kết quả.</AppText></View> : null}
              {session.status === "failed" ? <View style={styles.dangerBanner}><AppText color={colors.danger}>Phiên phân tích không hoàn tất. Hãy thử gửi lại bằng một phiên mới.</AppText></View> : null}

              {session.status === "completed" && results.length ? (
                <ResultOverview results={results} summary={summary} summaryState={summaryState} summaryError={summaryError} expanded={showFullSummary} onToggleExpanded={() => setShowFullSummary((current) => !current)} onRetrySummary={onRetrySummary} />
              ) : null}
              {session.status === "completed" && !results.length ? <EmptyState title="Chưa nhận được chỉ số" description="Hệ thống chưa trích xuất được chỉ số nào từ tài liệu này." /> : null}

              {results.length ? (
                <View style={styles.resultsSection}>
                  <View style={styles.resultsHeading}>
                    <View style={styles.resultsHeadingCopy}>
                      <AppText variant="eyebrow" color={colors.teal}>Phiếu xét nghiệm</AppText>
                      <AppText variant="h3">{resultFilter === "attention" ? "Chỉ số cần chú ý" : resultFilter === "normal" ? "Chỉ số bình thường" : resultFilter === "unknown" ? "Chỉ số chưa xác định" : "Tất cả chỉ số"}</AppText>
                    </View>
                    <AppText variant="caption" color={colors.subtle}>{filteredResults.length}/{results.length}</AppText>
                  </View>
                  <AppText variant="caption" color={colors.muted}>Ưu tiên xem mục cần chú ý; các chỉ số bình thường được thu gọn để giảm thao tác cuộn.</AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {counts.attention ? <FilterChip label={`Cần chú ý ${counts.attention}`} selected={resultFilter === "attention"} tone="warning" onPress={() => changeFilter("attention")} /> : null}
                    {counts.normal ? <FilterChip label={`Bình thường ${counts.normal}`} selected={resultFilter === "normal"} tone="success" onPress={() => changeFilter("normal")} /> : null}
                    {counts.unknown ? <FilterChip label={`Chưa rõ ${counts.unknown}`} selected={resultFilter === "unknown"} tone="neutral" onPress={() => changeFilter("unknown")} /> : null}
                    <FilterChip label={`Tất cả ${results.length}`} selected={resultFilter === "all"} tone="neutral" onPress={() => changeFilter("all")} />
                  </ScrollView>
                  {visibleResults.map(({ result, index }) => <ResultCard key={result.resultDetailId || `${result.rawExtractedName || "result"}-${index}`} result={result} />)}
                  {visibleResults.length < filteredResults.length ? <Button variant="secondary" fullWidth onPress={() => setVisibleLimit((current) => current + INITIAL_RESULT_LIMIT)}>Xem thêm {Math.min(INITIAL_RESULT_LIMIT, filteredResults.length - visibleResults.length)} chỉ số</Button> : null}
                </View>
              ) : null}

              {ocrExtracts.length ? (
                <View style={styles.rawTextGroup}>
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: showOcrExtracts }} onPress={() => setShowOcrExtracts((current) => !current)} style={styles.ocrToggle}>
                    <View style={styles.sectionTitle}><FileSearch size={18} color={colors.teal} /><View style={styles.ocrTitleCopy}><AppText variant="bodyStrong">Dữ liệu OCR cần đối chiếu</AppText><AppText variant="caption" color={colors.muted}>{ocrExtracts.length} dòng trích xuất từ phiếu gốc</AppText></View></View>
                    {showOcrExtracts ? <ChevronUp size={17} color={colors.teal} /> : <ChevronDown size={17} color={colors.teal} />}
                  </Pressable>
                  {showOcrExtracts ? (
                    <>
                      <AppText variant="caption" color={colors.muted}>Đối chiếu với phiếu gốc vì OCR có thể đọc sai tên, giá trị, đơn vị hoặc khoảng tham chiếu.</AppText>
                      {ocrExtracts.map((extract) => <View key={extract.ocrExtractId} style={styles.extractRow}><AppText variant="bodyStrong">{extract.extractedTestName || `Dòng ${extract.rowIndex + 1}`}</AppText><AppText color={colors.muted}>{[extract.extractedValue, extract.extractedUnit, extract.extractedReferenceText].filter(Boolean).join(" · ") || "Không đọc được giá trị"}</AppText></View>)}
                    </>
                  ) : null}
                </View>
              ) : null}

              {session.rawOcrText ? (
                <View style={styles.rawTextGroup}>
                  <Pressable accessibilityRole="button" onPress={() => setShowRawText((current) => !current)} style={styles.toggle}><AppText variant="bodyStrong" color={colors.teal}>{showRawText ? "Ẩn văn bản trích xuất" : "Xem văn bản trích xuất"}</AppText>{showRawText ? <ChevronUp size={16} color={colors.teal} /> : <ChevronDown size={16} color={colors.teal} />}</Pressable>
                  {showRawText ? <AppText color={colors.muted} style={styles.rawText}>{session.rawOcrText}</AppText> : null}
                </View>
              ) : null}

              <View style={styles.disclaimer}><ShieldAlert size={16} color={colors.warning} /><AppText variant="caption" color={colors.muted} style={styles.disclaimerText}>Kết quả AI chỉ mang tính tham khảo, không thay thế chẩn đoán, kê đơn hoặc tư vấn trực tiếp từ bác sĩ.</AppText></View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function FilterChip({ label, selected, tone, onPress }: { label: string; selected: boolean; tone: "warning" | "success" | "neutral"; onPress: () => void }) {
  const activeColor = tone === "warning" ? colors.warning : tone === "success" ? colors.success : colors.teal;
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.filterChip, selected && { borderColor: activeColor, backgroundColor: activeColor }]}><AppText variant="caption" color={selected ? colors.white : colors.muted}>{label}</AppText></Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  headerText: { flex: 1, gap: spacing.xs / 2 },
  headerMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  closeButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.paperSoft },
  content: { padding: spacing.lg, paddingBottom: spacing["4xl"], gap: spacing.lg },
  errorGroup: { gap: spacing.md, alignItems: "flex-start" },
  safetyNote: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.teal, backgroundColor: colors.mint, padding: spacing.md },
  metaCard: { gap: spacing.md, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, backgroundColor: colors.paper, padding: spacing.md },
  metaGrid: { flexDirection: "row", gap: spacing.sm },
  metaItem: { flex: 1, gap: spacing.xs / 2 },
  infoBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.mint, padding: spacing.md },
  dangerBanner: { borderRadius: radius.md, backgroundColor: colors.dangerBg, padding: spacing.md },
  bannerText: { flex: 1 },
  resultsSection: { gap: spacing.md },
  resultsHeading: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md },
  resultsHeadingCopy: { flex: 1, gap: spacing.xs / 2 },
  filterRow: { gap: spacing.sm },
  filterChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, backgroundColor: colors.paper, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  rawTextGroup: { gap: spacing.sm },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  ocrToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, minHeight: 56, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.paper, padding: spacing.md },
  ocrTitleCopy: { gap: spacing.xs / 2 },
  toggle: { flexDirection: "row", alignItems: "center", gap: spacing.xs, alignSelf: "flex-start" },
  rawText: { borderRadius: radius.md, backgroundColor: colors.paperSoft, padding: spacing.md },
  extractRow: { gap: spacing.xs, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.paperSoft, padding: spacing.md },
  disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.warningBg, padding: spacing.md },
  disclaimerText: { flex: 1 },
});
