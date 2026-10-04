// Ported from src/components/preConsultation/PreConsultationHistory.jsx (Web).
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { AppText, Badge, Button, EmptyState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { consultationSessionsApi } from "@/src/services/consultationSessionService";
import { ROUTES } from "@/src/navigation/routes";
import {
  CONSULTATION_STATUS_LABELS,
  ConsultationHistorySession,
  formatConsultationDateTime,
  readConsultationSessionList,
} from "@/src/utils/consultationHistory";

type ConsultationHistorySheetProps = {
  embedded?: boolean;
  onStartNew: () => void;
};

export function ConsultationHistorySheet({ onStartNew }: ConsultationHistorySheetProps) {
  const [sessions, setSessions] = useState<ConsultationHistorySession[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await consultationSessionsApi.mySessions(1, 20);
      setSessions(readConsultationSessionList(response));
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

  function openDetail(session: ConsultationHistorySession) {
    router.push({
      pathname: ROUTES.PATIENT.PRE_CONSULTATION_DETAIL as never,
      params: { sessionId: session.sessionId },
    });
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
          const status = CONSULTATION_STATUS_LABELS[String(session.status ?? "").toLowerCase()] || { label: "Đang cập nhật", tone: "warning" as const };
          return (
            <View key={session.sessionId} style={styles.sessionGroup}>
              <Pressable onPress={() => openDetail(session)} style={styles.row}>
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong">{session.departmentName || session.symptoms || "Phiên tư vấn"}</AppText>
                  <AppText variant="caption" color={colors.subtle}>
                    {formatConsultationDateTime(session.appointmentTime)}
                  </AppText>
                </View>
                <Badge tone={status.tone}>{status.label}</Badge>
                <ChevronRight size={18} color={colors.teal} />
              </Pressable>
            </View>
          );
        })
      )}
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
  rowText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  sessionGroup: {
    gap: spacing.xs,
  },
});
