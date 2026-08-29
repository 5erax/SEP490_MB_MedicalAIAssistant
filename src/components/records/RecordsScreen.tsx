// Ported from Web's MedicalRecordPage.jsx — redesigned as a native
// history-first screen (session list + FAB to start a new analysis) instead
// of Web's desktop two-column upload/history split, since mobile has no
// room for a persistent side-by-side layout. Detail and upload each get
// their own full-screen sheet, matching this app's established sheet
// pattern (PaymentDetailSheet, MedicationFormSheet).
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Camera, ChevronLeft, ChevronRight, FileSearch, Plus, RefreshCw } from "lucide-react-native";

import { AppText, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useMedicalRecords } from "@/src/hooks";
import { LabSessionStatus } from "@/src/types/labTest";
import { SessionCard } from "./SessionCard";
import { SessionDetailSheet } from "./SessionDetailSheet";
import { UploadRecordSheet } from "./UploadRecordSheet";
import { LabTrendsPanel } from "./LabTrendsPanel";

const FILTERS: { value: LabSessionStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "processing", label: "Đang xử lý" },
  { value: "completed", label: "Hoàn tất" },
  { value: "failed", label: "Thất bại" },
];

export function RecordsScreen() {
  const {
    profile,
    document,
    formError,
    pickImage,
    pickPdf,
    takePhoto,
    clearDocument,
    submissionStatus,
    submissionMessage,
    submitAnalysis,
    sessions,
    historyState,
    historyError,
    historyPage,
    setHistoryPage,
    historyFilter,
    setHistoryFilter,
    historyInfo,
    reloadHistory,
    selectedSession,
    ocrExtracts,
    detailState,
    detailError,
    summaryText,
    summaryState,
    summaryError,
    selectSession,
    clearSelectedSession,
    retryDetail,
    retrySummary,
  } = useMedicalRecords();

  const [uploadVisible, setUploadVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleSubmit() {
    const result = await submitAnalysis();
    if (result === "success") {
      setUploadVisible(false);
      setDetailVisible(true);
    }
  }

  function openSession(session: (typeof sessions)[number]) {
    selectSession(session);
    setDetailVisible(true);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await reloadHistory();
    setRefreshing(false);
  }

  const historyEmptyState = historyState === "loading" ? (
    <View style={styles.padded}>
      <SkeletonGroup lines={5} />
    </View>
  ) : historyState === "error" ? (
    <View style={styles.padded}>
      <EmptyState title="Không tải được lịch sử phân tích" description={historyError} />
    </View>
  ) : (
    <View style={styles.padded}>
      <EmptyState
        title="Chưa có phiên phân tích nào"
        description="Bấm nút + để tải phiếu xét nghiệm đầu tiên và nhận giải thích chỉ số."
      />
    </View>
  );

  return (
    <Screen padded={false} style={styles.screen}>
      <FlatList
        style={styles.historyList}
        data={sessions}
        keyExtractor={(session) => session.sessionId}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.sessionItem}>
            <SessionCard session={item} onPress={() => openSession(item)} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sessionSeparator} />}
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.heroIcon}>
                  <FileSearch size={24} color={colors.teal} />
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Tải lại lịch sử" onPress={handleRefresh} style={styles.refreshButton}>
                  <RefreshCw size={18} color={colors.teal} />
                </Pressable>
              </View>
              <View style={styles.headerCopy}>
                <AppText variant="eyebrow" color={colors.teal}>Phân tích xét nghiệm</AppText>
                <AppText variant="h1" style={styles.heroTitle}>Hiểu phiếu xét nghiệm dễ dàng hơn</AppText>
                <AppText color={colors.muted}>Chụp hoặc tải phiếu lên để xem tổng quan, chỉ số cần chú ý và hướng theo dõi.</AppText>
              </View>
              <Button
                fullWidth
                leftIcon={<Camera size={19} color={colors.white} />}
                onPress={() => setUploadVisible(true)}
              >
                Phân tích phiếu mới
              </Button>
              <View style={styles.stepsRow}>
                <QuickStep number="1" label="Chọn phiếu" />
                <View style={styles.stepLine} />
                <QuickStep number="2" label="AI phân tích" />
                <View style={styles.stepLine} />
                <QuickStep number="3" label="Xem kết quả" />
              </View>
            </View>

            <View style={styles.trends}>
              <LabTrendsPanel onOpenSession={(sessionId) => openSession({ sessionId, status: "completed" })} />
            </View>

            <View style={styles.historyHeader}>
              <View style={styles.historyTitle}>
                <AppText variant="h3">Lịch sử phân tích</AppText>
                <AppText variant="caption" color={colors.subtle}>{historyInfo.totalCount} phiên đã lưu</AppText>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setUploadVisible(true)} style={styles.compactAddButton}>
                <Plus size={16} color={colors.teal} />
                <AppText variant="caption" color={colors.teal}>Tạo mới</AppText>
              </Pressable>
            </View>

            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
              {FILTERS.map(({ value, label }) => {
                const selected = historyFilter === value;
                return (
                  <Pressable
                    key={value || "all"}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setHistoryFilter(value);
                      setHistoryPage(1);
                    }}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                  >
                    <AppText variant="caption" color={selected ? colors.white : colors.muted}>{label}</AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}
        ListEmptyComponent={historyEmptyState}
        ListFooterComponent={historyInfo.totalPages > 1 ? (
          <View style={styles.pagination}>
            <Pressable accessibilityRole="button" accessibilityLabel="Trang trước" disabled={historyPage <= 1} onPress={() => setHistoryPage((current) => current - 1)} style={[styles.pageButton, historyPage <= 1 && styles.pageButtonDisabled]}>
              <ChevronLeft size={18} color={colors.ink} />
            </Pressable>
            <AppText variant="caption" color={colors.subtle}>
              Trang {historyPage}/{historyInfo.totalPages} · {historyInfo.totalCount} phiên
            </AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Trang sau" disabled={historyPage >= historyInfo.totalPages} onPress={() => setHistoryPage((current) => current + 1)} style={[styles.pageButton, historyPage >= historyInfo.totalPages && styles.pageButtonDisabled]}>
              <ChevronRight size={18} color={colors.ink} />
            </Pressable>
          </View>
        ) : null}
      />

      <UploadRecordSheet
        visible={uploadVisible}
        profile={profile}
        document={document}
        formError={formError}
        submissionStatus={submissionStatus}
        submissionMessage={submissionMessage}
        onClose={() => setUploadVisible(false)}
        onPickImage={pickImage}
        onPickPdf={pickPdf}
        onTakePhoto={takePhoto}
        onClearDocument={clearDocument}
        onSubmit={handleSubmit}
      />

      <SessionDetailSheet
        visible={detailVisible}
        session={selectedSession}
        ocrExtracts={ocrExtracts}
        state={detailState}
        error={detailError}
        summary={summaryText}
        summaryState={summaryState}
        summaryError={summaryError}
        onClose={() => {
          setDetailVisible(false);
          clearSelectedSession();
        }}
        onRetry={retryDetail}
        onRetrySummary={retrySummary}
      />
    </Screen>
  );
}

function QuickStep({ number, label }: { number: string; label: string }) {
  return (
    <View style={styles.quickStep}>
      <View style={styles.stepNumber}><AppText variant="caption" color={colors.teal}>{number}</AppText></View>
      <AppText variant="caption" color={colors.muted}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  historyList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["4xl"],
  },
  header: {
    gap: spacing.md,
    padding: spacing.lg,
    margin: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  heroIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.lg, backgroundColor: colors.mint },
  headerCopy: { flex: 1, gap: spacing.sm },
  heroTitle: { fontSize: 31, lineHeight: 35 },
  refreshButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.paper },
  stepsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quickStep: { alignItems: "center", gap: spacing.xs },
  stepNumber: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.mint },
  stepLine: { flex: 1, height: 1, marginHorizontal: spacing.sm, backgroundColor: colors.line },
  trends: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  historyTitle: { gap: spacing.xs / 2 },
  compactAddButton: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 38, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.pill, backgroundColor: colors.paper },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterChip: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paper,
  },
  filterChipSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  padded: {
    padding: spacing.lg,
  },
  sessionItem: {
    paddingHorizontal: spacing.lg,
  },
  sessionSeparator: {
    height: spacing.md,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  pageButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.paper },
  pageButtonDisabled: { opacity: 0.35 },
});
