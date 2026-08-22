// Ported from src/components/preConsultation/PreConsultationHistory.jsx (Web).
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Badge, Button, EmptyState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { consultationSessionsApi } from "@/src/services/consultationSessionService";
import { unwrapApiData } from "@/src/services/symptomAnalysisService";
import { ConsultationSession } from "@/src/types/consultation";

const STATUS_LABELS: Record<string, { label: string; tone: "warning" | "success" | "danger" }> = {
  processing: { label: "Đang phân tích", tone: "warning" },
  completed: { label: "Đã hoàn tất", tone: "success" },
  failed: { label: "Không thành công", tone: "danger" },
};

function formatDateTime(value?: string) {
  if (!value) return "Chưa có thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thời gian";
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

type ConsultationHistorySheetProps = {
  embedded?: boolean;
  onStartNew: () => void;
};

export function ConsultationHistorySheet({ onStartNew }: ConsultationHistorySheetProps) {
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<ConsultationSession | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await consultationSessionsApi.mySessions(1, 20);
      const data = unwrapApiData<{ items?: ConsultationSession[] }>(response);
      setSessions(data?.items ?? []);
      setState("ready");
    } catch (requestError) {
      setError((requestError as Error)?.message || "Chưa thể tải lịch sử tư vấn. Vui lòng thử lại.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    setState("loading");
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function openDetail(sessionId: string) {
    setSelectedId(sessionId);
    setDetailLoading(true);
    try {
      const response = await consultationSessionsApi.get(sessionId);
      setSelectedDetail(unwrapApiData<ConsultationSession>(response) ?? null);
    } catch {
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  if (state === "loading") {
    return <ActivityIndicator color={colors.teal} style={styles.spinner} />;
  }

  if (state === "error") {
    return (
      <View style={styles.errorState}>
        <EmptyState title="Không thể tải lịch sử" description={error} />
        <Button onPress={load}>Thử lại</Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Button variant="secondary" onPress={onStartNew}>
        Bắt đầu tư vấn mới
      </Button>

      {sessions.length === 0 ? (
        <EmptyState title="Chưa có phiên tư vấn nào" description="Phiên mới sẽ xuất hiện ở đây sau khi bạn bắt đầu tư vấn trước khám." />
      ) : (
        sessions.map((session) => {
          const status = STATUS_LABELS[String(session.status ?? "").toLowerCase()] || { label: "Đang cập nhật", tone: "warning" as const };
          const isActive = session.sessionId === selectedId;
          return (
            <Pressable key={session.sessionId} onPress={() => openDetail(session.sessionId)} style={[styles.row, isActive && styles.rowActive]}>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">{session.departmentName || session.symptoms || "Phiên tư vấn"}</AppText>
                <AppText variant="caption" color={colors.subtle}>
                  {formatDateTime(session.appointmentTime)}
                </AppText>
              </View>
              <Badge tone={status.tone}>{status.label}</Badge>
            </Pressable>
          );
        })
      )}

      {selectedId ? (
        <View style={styles.detailCard}>
          {detailLoading ? (
            <ActivityIndicator color={colors.teal} />
          ) : selectedDetail ? (
            <>
              <AppText variant="bodyStrong">{selectedDetail.departmentName || "Chi tiết phiên"}</AppText>
              <AppText color={colors.muted}>{selectedDetail.symptoms || "Không có mô tả triệu chứng."}</AppText>
              <AppText variant="caption" color={colors.subtle}>
                {selectedDetail.facilityName || "Chưa chọn bệnh viện"}
              </AppText>
            </>
          ) : (
            <AppText color={colors.danger}>Không thể tải chi tiết phiên này.</AppText>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  spinner: {
    marginTop: spacing.xl,
  },
  errorState: {
    gap: spacing.md,
  },
  root: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing["4xl"],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  rowActive: {
    borderColor: colors.teal,
    backgroundColor: colors.mint,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  detailCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.lg,
  },
});
