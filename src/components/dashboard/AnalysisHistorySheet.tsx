// Native bottom-sheet port of Web's AnalysisHistoryPanel.jsx.
import { useCallback, useEffect, useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { AppText, Button, EmptyState, LoadingState, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ApiError } from "@/src/api/client";
import { symptomAnalysisApi, unwrapApiData } from "@/src/services/symptomAnalysisService";
import { SymptomAnalysisSession } from "@/src/types/symptomAnalysis";

type SessionType = "department" | "diagnoses";

const SESSION_TYPE_LABELS: Record<string, string> = {
  department: "Gợi ý chuyên khoa",
  diagnoses: "Phân tích lâm sàng",
  diagnosis: "Phân tích lâm sàng",
};

const SESSION_STATUS_LABELS: Record<string, string> = {
  pending: "Đang chờ",
  processing: "Đang xử lý",
  in_progress: "Đang xử lý",
  completed: "Hoàn tất",
  complete: "Hoàn tất",
  failed: "Không thành công",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
};

function getSessionId(session: SymptomAnalysisSession) {
  return session?.sessionId || session?.id || "";
}

function getSessionTitle(session: SymptomAnalysisSession | null, fallback: string) {
  return session?.inputText || session?.userInput || session?.symptoms || fallback;
}

function formatDate(value?: string) {
  if (!value) return "Chưa có ngày tạo";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có ngày tạo";
  return date.toLocaleString("vi-VN");
}

function formatSessionType(value: string | undefined, fallbackType: string) {
  const normalized = String(value || fallbackType || "").trim().toLowerCase();
  return SESSION_TYPE_LABELS[normalized] || SESSION_TYPE_LABELS[fallbackType] || "Phiên phân tích";
}

function formatSessionStatus(value: string | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  return SESSION_STATUS_LABELS[normalized] || "Đang cập nhật";
}

function getSafeHistoryError(error: unknown, detail = false) {
  const apiError = error as ApiError | undefined;
  if (apiError?.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem lịch sử.";
  if (apiError?.status === 403) return "Bạn không có quyền xem phiên phân tích này.";
  if (detail && apiError?.status === 404) return "Không tìm thấy phiên phân tích hoặc phiên này không còn khả dụng.";
  return detail ? "Chưa thể tải chi tiết phiên. Vui lòng thử lại." : "Chưa thể tải lịch sử phân tích. Vui lòng thử lại.";
}

function getDetailSummary(detail: Record<string, unknown>, sessionType: SessionType) {
  const data = (unwrapApiData<Record<string, unknown>>(detail) || detail || {}) as Record<string, unknown>;
  const analysis = (data.analysis || data.Analysis || data) as Record<string, unknown>;
  const department = (analysis.recommendedDepartment || analysis.RecommendedDepartment) as Record<string, unknown> | undefined;
  const facilities = (analysis.recommendedFacilities || analysis.RecommendedFacilities || []) as Record<string, unknown>[];

  if (sessionType === "department") {
    const fallbackDepartment = Array.isArray(facilities)
      ? (facilities.flatMap((facility) => (facility?.departments as unknown[]) || (facility?.Departments as unknown[]) || [])[0] as Record<string, unknown> | undefined)
      : undefined;
    const departmentName =
      (department?.departmentName as string) || (department?.DepartmentName as string) || (fallbackDepartment?.departmentName as string) || (fallbackDepartment?.DepartmentName as string) || "";
    const facilityNames = Array.isArray(facilities)
      ? facilities.map((facility) => (facility?.facilityName || facility?.FacilityName || facility?.name) as string).filter(Boolean).slice(0, 3)
      : [];

    if (departmentName && facilityNames.length > 0) return `Chuyên khoa: ${departmentName}. Cơ sở gợi ý: ${facilityNames.join(", ")}.`;
    if (departmentName) return `Chuyên khoa được gợi ý: ${departmentName}.`;
    if (facilityNames.length > 0) return `Cơ sở được gợi ý: ${facilityNames.join(", ")}.`;
    return (analysis.status as string) || (analysis.Status as string) || "Đang cập nhật gợi ý chuyên khoa";
  }

  const diagnoses = (analysis.diagnoses || analysis.Diagnoses || []) as Record<string, unknown>[];
  if (Array.isArray(diagnoses) && diagnoses.length > 0) {
    return diagnoses.slice(0, 3).map((item) => (item.diseaseName || item.DiseaseName) as string).filter(Boolean).join(", ");
  }
  return (analysis.status as string) || (analysis.Status as string) || "Đang cập nhật";
}

type AnalysisHistorySheetProps = {
  visible: boolean;
  onClose: () => void;
  sessionType?: SessionType;
};

export function AnalysisHistorySheet({ visible, onClose, sessionType = "department" }: AnalysisHistorySheetProps) {
  const [sessions, setSessions] = useState<SymptomAnalysisSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<Record<string, unknown> | { error: string } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const copy =
    sessionType === "department"
      ? { title: "Lịch sử gợi ý chuyên khoa", empty: "Chưa có phiên gợi ý chuyên khoa nào.", fallback: "Phiên gợi ý chuyên khoa" }
      : { title: "Lịch sử phân tích lâm sàng", empty: "Chưa có phiên phân tích lâm sàng nào.", fallback: "Phiên phân tích lâm sàng" };

  const loadSessions = useCallback(async () => {
    setError("");
    try {
      const items = await symptomAnalysisApi.listAllMySessions(sessionType);
      setSessions(items);
    } catch (requestError) {
      setError(getSafeHistoryError(requestError));
    }
  }, [sessionType]);

  useEffect(() => {
    if (!visible) return;
    setSessions([]);
    setSelectedDetail(null);
    setSelectedSessionId("");
    setLoading(true);
    loadSessions().finally(() => setLoading(false));
  }, [visible, loadSessions]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }

  async function loadDetail(sessionId: string) {
    setSelectedSessionId(sessionId);
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      const response = await symptomAnalysisApi.get(sessionId);
      setSelectedDetail((unwrapApiData<Record<string, unknown>>(response) || response) as Record<string, unknown>);
    } catch (requestError) {
      setSelectedDetail({ error: getSafeHistoryError(requestError, true) });
    } finally {
      setDetailLoading(false);
    }
  }

  const detail = selectedDetail as { error?: string } | Record<string, unknown> | null;
  const detailHasError = Boolean(detail && "error" in detail && detail.error);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <AppText variant="h3">{copy.title}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng lịch sử" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.padded}>
            <SkeletonGroup lines={4} />
          </View>
        ) : error ? (
          <EmptyState title="Chưa thể tải lịch sử" description={error} />
        ) : sessions.length === 0 ? (
          <EmptyState title={copy.empty} description="Bắt đầu phiên mới để MediMate lưu lại lịch sử tại đây." />
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(session, index) => getSessionId(session) || String(index)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            renderItem={({ item }) => {
              const sessionId = getSessionId(item);
              const isActive = sessionId === selectedSessionId;
              return (
                <Pressable
                  onPress={() => loadDetail(sessionId)}
                  style={[styles.sessionRow, isActive && styles.sessionRowActive]}
                >
                  <View style={styles.sessionText}>
                    <AppText variant="bodyStrong">{getSessionTitle(item, copy.fallback)}</AppText>
                    <AppText variant="caption" color={colors.subtle}>
                      {formatDate(item.createdAt || item.createdDate)}
                    </AppText>
                    <AppText variant="caption" color={colors.muted}>
                      {formatSessionType(item.sessionType, sessionType)} · {formatSessionStatus(item.status)}
                    </AppText>
                  </View>
                </Pressable>
              );
            }}
            ListFooterComponent={
              selectedSessionId ? (
                <View style={styles.detailCard}>
                  <AppText variant="bodyStrong">Chi tiết phiên</AppText>
                  {detailLoading ? (
                    <LoadingState title="Đang tải chi tiết..." />
                  ) : detailHasError ? (
                    <View style={styles.detailRetry}>
                      <AppText color={colors.danger}>{(detail as { error: string }).error}</AppText>
                      <Button variant="secondary" size="sm" onPress={() => loadDetail(selectedSessionId)}>
                        Thử lại
                      </Button>
                    </View>
                  ) : detail ? (
                    <>
                      <AppText variant="bodyStrong">{getSessionTitle(detail as SymptomAnalysisSession, copy.fallback)}</AppText>
                      <AppText color={colors.muted}>{getDetailSummary(detail as Record<string, unknown>, sessionType)}</AppText>
                    </>
                  ) : null}
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  padded: {
    padding: spacing.lg,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sessionRow: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  sessionRowActive: {
    borderColor: colors.limeDark,
    backgroundColor: colors.mint,
  },
  sessionText: {
    gap: spacing.xs / 2,
  },
  detailCard: {
    marginTop: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.lg,
  },
  detailRetry: {
    gap: spacing.sm,
    alignItems: "flex-start",
  },
});
