// Ported from Web's MedicalRecordPage.jsx — redesigned as a native
// history-first screen (session list + FAB to start a new analysis) instead
// of Web's desktop two-column upload/history split, since mobile has no
// room for a persistent side-by-side layout. Detail and upload each get
// their own full-screen sheet, matching this app's established sheet
// pattern (PaymentDetailSheet, MedicationFormSheet).
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react-native";

import { AppText, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";
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

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow" color={colors.teal}>Phân tích xét nghiệm</AppText>
            <AppText variant="h1">Đọc phiếu xét nghiệm rõ ràng hơn</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Tải lại lịch sử" onPress={handleRefresh} style={styles.refreshButton}>
            <RefreshCw size={18} color={colors.teal} />
          </Pressable>
        </View>
        <AppText color={colors.muted}>Tải phiếu lên, xem tổng quan AI, chỉ số cần chú ý và theo dõi thay đổi qua các lần xét nghiệm.</AppText>
      </View>

      <View style={styles.trends}>
        <LabTrendsPanel onOpenSession={(sessionId) => openSession({ sessionId, status: "completed" })} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
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
              <AppText variant="bodyStrong" color={selected ? colors.white : colors.muted}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {historyState === "loading" && sessions.length === 0 ? (
        <View style={styles.padded}>
          <SkeletonGroup lines={5} />
        </View>
      ) : historyState === "error" ? (
        <View style={styles.padded}>
          <EmptyState title="Không tải được lịch sử phân tích" description={historyError} />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.padded}>
          <EmptyState
            title="Chưa có phiên phân tích nào"
            description="Bấm nút + để tải phiếu xét nghiệm đầu tiên và nhận giải thích chỉ số."
          />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(session) => session.sessionId}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => <SessionCard session={item} onPress={() => openSession(item)} />}
        />
      )}

      {historyInfo.totalPages > 1 ? (
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

      <Pressable accessibilityRole="button" accessibilityLabel="Phân tích phiếu xét nghiệm mới" onPress={() => setUploadVisible(true)} style={styles.fab}>
        <Plus size={24} color={colors.white} />
      </Pressable>

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  headerTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.sm },
  refreshButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.paper },
  trends: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
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
    minHeight: 40,
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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["4xl"],
    gap: spacing.md,
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
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    ...shadows.soft,
  },
});
