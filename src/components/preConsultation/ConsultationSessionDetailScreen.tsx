import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CalendarClock, Check, Clock3, FileQuestionMark, Stethoscope } from "lucide-react-native";

import { AppText, Badge, Button, EmptyState, Screen } from "@/src/components/ui";
import { checklistItemsApi, consultationSessionsApi } from "@/src/services/consultationSessionService";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ChecklistItem, ConsultationQuestion, ConsultationSummary } from "@/src/types/consultation";
import {
  CONSULTATION_STATUS_LABELS,
  ConsultationHistorySession,
  formatConsultationDateTime,
  normalizeConsultationChecklistItem,
  readConsultationSessionDetail,
  readConsultationSummary,
} from "@/src/utils/consultationHistory";
import { unwrapApiData } from "@/src/services/symptomAnalysisService";

type DetailState = "loading" | "ready" | "error";

function readChecklistItems(response: unknown) {
  const data = unwrapApiData<unknown>(response);
  const record = (data && typeof data === "object" ? data : response) as Record<string, unknown>;
  const items =
    (Array.isArray(data) ? data : null)
    ?? (Array.isArray(record.items) ? record.items : null)
    ?? (Array.isArray(record.Items) ? record.Items : null)
    ?? [];

  return items.map(normalizeConsultationChecklistItem).filter((item) => item.content);
}

function mergeUniqueByText<T extends { id: string }>(items: T[], getText: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getText(item).trim().toLowerCase() || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function InfoBox({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <View style={styles.infoBox}>
      <View style={styles.infoLabelRow}>
        {icon}
        <AppText variant="caption" color={colors.subtle}>
          {label}
        </AppText>
      </View>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

export function ConsultationSessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [state, setState] = useState<DetailState>("loading");
  const [error, setError] = useState("");
  const [session, setSession] = useState<ConsultationHistorySession | null>(null);
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const load = useCallback(async () => {
    if (!sessionId) {
      setError("Thiếu mã phiên tư vấn.");
      setState("error");
      return;
    }

    setState("loading");
    setError("");
    try {
      const detailResponse = await consultationSessionsApi.get(String(sessionId));
      const detail = readConsultationSessionDetail(detailResponse);
      if (!detail) throw new Error("Không tìm thấy phiên tư vấn.");
      setSession(detail);

      const [summaryResult, checklistResult] = await Promise.allSettled([
        consultationSessionsApi.getSummary(detail.sessionId),
        detail.departmentId ? checklistItemsApi.byDepartment(detail.departmentId) : Promise.resolve(null),
      ]);

      const nextSummary = summaryResult.status === "fulfilled" ? readConsultationSummary(summaryResult.value) : null;
      setSummary(nextSummary);
      setChecklist(checklistResult.status === "fulfilled" && checklistResult.value ? readChecklistItems(checklistResult.value) : []);
      setState("ready");
    } catch (requestError) {
      setError((requestError as Error)?.message || "Chưa thể tải chi tiết tư vấn trước khám.");
      setState("error");
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const status = CONSULTATION_STATUS_LABELS[String(session?.status ?? "").toLowerCase()] || { label: "Đang cập nhật", tone: "warning" as const };
  const questions = useMemo(() => {
    const items = [
      ...(session?.questions ?? []),
      ...((summary?.questions ?? []) as ConsultationQuestion[]),
    ];
    return mergeUniqueByText(items, (item) => item.text).sort((left, right) => left.priority - right.priority);
  }, [session?.questions, summary?.questions]);
  const checklistItems = useMemo(() => {
    const items = [
      ...(session?.checklistItems ?? []),
      ...((summary?.checklistItems ?? []) as ChecklistItem[]),
      ...checklist,
    ];
    return mergeUniqueByText(items, (item) => item.content);
  }, [checklist, session?.checklistItems, summary?.checklistItems]);

  if (state === "loading") {
    return (
      <Screen contentContainerStyle={styles.centerContent}>
        <ActivityIndicator color={colors.teal} />
        <AppText color={colors.muted}>Đang tải chi tiết tư vấn...</AppText>
      </Screen>
    );
  }

  if (state === "error" || !session) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color={colors.teal} />
          <AppText variant="bodyStrong" color={colors.teal}>Quay lại</AppText>
        </Pressable>
        <EmptyState title="Không thể tải chi tiết" description={error} />
        <Button onPress={load}>Thử lại</Button>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={18} color={colors.teal} />
        <AppText variant="bodyStrong" color={colors.teal}>Quay lại lịch sử</AppText>
      </Pressable>

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <FileQuestionMark size={24} color={colors.white} />
        </View>
        <View style={styles.headerText}>
          <AppText variant="h1">Chi tiết tư vấn trước khám</AppText>
          <AppText color={colors.muted}>Xem lại nội dung đã chuẩn bị trước khi trao đổi với bác sĩ.</AppText>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <InfoBox label="Chuyên khoa" value={session.departmentName || summary?.departmentName || "Chưa cập nhật"} icon={<Stethoscope size={14} color={colors.teal} />} />
        <InfoBox label="Thời gian khám" value={formatConsultationDateTime(session.appointmentTime || summary?.appointmentTime, { dateStyle: "medium", timeStyle: "short" })} icon={<CalendarClock size={14} color={colors.teal} />} />
        <InfoBox label="Tạo lúc" value={formatConsultationDateTime(session.createdAt, { dateStyle: "medium", timeStyle: "short" })} icon={<Clock3 size={14} color={colors.teal} />} />
        <View style={styles.infoBox}>
          <AppText variant="caption" color={colors.subtle}>Trạng thái</AppText>
          <Badge tone={status.tone}>{status.label}</Badge>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Điều cần tư vấn</AppText>
        <AppText color={colors.muted}>{session.symptoms || summary?.symptoms || "Chưa có mô tả triệu chứng."}</AppText>
        {session.facilityName ? <AppText variant="caption" color={colors.subtle}>Bệnh viện: {session.facilityName}</AppText> : null}
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Danh sách chuẩn bị</AppText>
        {checklistItems.length ? checklistItems.map((item) => (
          <View key={item.id} style={styles.bulletRow}>
            <Check size={15} color={colors.teal} />
            <AppText style={styles.bulletText}>{item.content}</AppText>
          </View>
        )) : <AppText color={colors.muted}>Chưa có checklist chuẩn bị cho phiên này.</AppText>}
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Câu hỏi dành cho bác sĩ</AppText>
        {questions.length ? questions.map((question, index) => (
          <View key={question.id} style={styles.questionRow}>
            <AppText variant="bodyStrong" color={colors.teal}>{index + 1}.</AppText>
            <AppText style={styles.bulletText}>{question.text}</AppText>
          </View>
        )) : <AppText color={colors.muted}>Chưa có câu hỏi được tạo cho phiên này.</AppText>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.18)",
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  headerIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.teal,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  infoGrid: {
    gap: spacing.sm,
  },
  infoBox: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.18)",
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  bulletText: {
    flex: 1,
  },
});
