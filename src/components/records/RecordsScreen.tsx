// Ported from Web's MedicalRecordPage.jsx — redesigned as a native
// history-first screen (session list + FAB to start a new analysis) instead
// of Web's desktop two-column upload/history split, since mobile has no
// room for a persistent side-by-side layout. Detail and upload each get
// their own full-screen sheet, matching this app's established sheet
// pattern (PaymentDetailSheet, MedicationFormSheet).
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";

import { AppText, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";
import { useMedicalRecords } from "@/src/hooks";
import { LabSessionStatus } from "@/src/types/labTest";
import { SessionCard } from "./SessionCard";
import { SessionDetailSheet } from "./SessionDetailSheet";
import { UploadRecordSheet } from "./UploadRecordSheet";

const FILTERS: { value: LabSessionStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "processing", label: "Đang xử lý" },
  { value: "completed", label: "Hoàn tất" },
  { value: "failed", label: "Thất bại" },
];

export function RecordsScreen() {
  const {
    profile,
    testDate,
    setTestDate,
    document,
    formError,
    pickDocument,
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
    detailState,
    detailError,
    selectSession,
    clearSelectedSession,
    retryDetail,
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
        <AppText variant="eyebrow" color={colors.teal}>
          Phân tích xét nghiệm
        </AppText>
        <AppText variant="h1">Đọc phiếu xét nghiệm rõ ràng hơn</AppText>
        <AppText color={colors.muted}>Tải phiếu xét nghiệm lên để nhận giải thích chỉ số bằng AI, tham khảo trước khi gặp bác sĩ.</AppText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
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
          <AppText variant="caption" color={colors.subtle}>
            Trang {historyPage}/{historyInfo.totalPages} · {historyInfo.totalCount} phiên
          </AppText>
        </View>
      ) : null}

      <Pressable accessibilityRole="button" accessibilityLabel="Phân tích phiếu xét nghiệm mới" onPress={() => setUploadVisible(true)} style={styles.fab}>
        <Plus size={24} color={colors.white} />
      </Pressable>

      <UploadRecordSheet
        visible={uploadVisible}
        profile={profile}
        testDate={testDate}
        document={document}
        formError={formError}
        submissionStatus={submissionStatus}
        submissionMessage={submissionMessage}
        onClose={() => setUploadVisible(false)}
        onPickDocument={pickDocument}
        onClearDocument={clearDocument}
        onChangeTestDate={setTestDate}
        onSubmit={handleSubmit}
      />

      <SessionDetailSheet
        visible={detailVisible}
        session={selectedSession}
        state={detailState}
        error={detailError}
        onClose={() => {
          setDetailVisible(false);
          clearSelectedSession();
        }}
        onRetry={retryDetail}
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
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterChip: {
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
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
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
