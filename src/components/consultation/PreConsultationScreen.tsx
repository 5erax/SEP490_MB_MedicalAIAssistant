import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import { CalendarClock, CheckCircle2, ClipboardCheck, History, ShieldCheck } from "lucide-react-native";

import { AppText, Badge, Button, Card, EmptyState, Screen, SkeletonGroup, TextField } from "@/src/components/ui";
import { usePreConsultation } from "@/src/hooks/usePreConsultation";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ConsultationSummary } from "@/src/types/consultation";

type ViewMode = "new" | "history";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "Chưa đặt lịch";
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function SummaryCard({ summary }: { summary: ConsultationSummary }) {
  return (
    <Card variant="hard" style={styles.sectionCard}>
      <View style={styles.titleRow}>
        <View style={styles.flexText}>
          <AppText variant="eyebrow" color={colors.teal}>Bản tổng hợp đi khám</AppText>
          <AppText variant="h2">{summary.departmentName || "Chuyên khoa đã chọn"}</AppText>
        </View>
        <Badge tone="success">Hoàn tất</Badge>
      </View>
      <AppText color={colors.muted}>{summary.symptoms || "Không có mô tả triệu chứng."}</AppText>
      <View style={styles.metaBox}>
        <AppText variant="caption" color={colors.subtle}>Thời gian dự kiến</AppText>
        <AppText variant="bodyStrong">{formatDateTime(summary.appointmentTime)}</AppText>
        <AppText variant="caption" color={colors.subtle}>
          {summary.isReminderEnabled ? "Đã bật nhắc lịch" : "Không bật nhắc lịch"}
        </AppText>
      </View>

      {(summary.checklistItems ?? []).length > 0 ? (
        <View style={styles.listGroup}>
          <AppText variant="h3">Danh sách cần chuẩn bị</AppText>
          {(summary.checklistItems ?? []).map((item) => (
            <View key={item.id} style={styles.listRow}>
              <ClipboardCheck size={17} color={colors.teal} />
              <AppText style={styles.flexText}>{item.content || "Mục chuẩn bị"}</AppText>
              {item.isMandatory ? <Badge tone="warning">Bắt buộc</Badge> : null}
            </View>
          ))}
        </View>
      ) : null}

      {(summary.questions ?? []).length > 0 ? (
        <View style={styles.listGroup}>
          <AppText variant="h3">Câu hỏi dành cho bác sĩ</AppText>
          {(summary.questions ?? []).map((question, index) => (
            <View key={question.id || String(index)} style={styles.numberedRow}>
              <View style={styles.numberCircle}><AppText variant="caption" color={colors.white}>{index + 1}</AppText></View>
              <AppText style={styles.flexText}>{question.questionText || "Câu hỏi tư vấn"}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export function PreConsultationScreen() {
  const params = useLocalSearchParams<{ departmentId?: string; facilityId?: string; symptoms?: string }>();
  const model = usePreConsultation({
    departmentId: firstParam(params.departmentId),
    facilityId: firstParam(params.facilityId),
    symptoms: firstParam(params.symptoms),
  });
  const [viewMode, setViewMode] = useState<ViewMode>("new");
  const [picker, setPicker] = useState<"date" | "time" | null>(null);

  if (model.loading) {
    return <Screen contentContainerStyle={styles.content}><SkeletonGroup lines={7} /></Screen>;
  }

  const generatedQuestions = model.session?.questions ?? [];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="eyebrow" color={colors.teal}>Chuẩn bị trước buổi khám</AppText>
        <AppText variant="h1">Tư vấn trước khám</AppText>
        <AppText color={colors.muted}>
          Lưu triệu chứng, tạo bộ câu hỏi cho bác sĩ và nhận danh sách những thứ cần chuẩn bị.
        </AppText>
      </View>

      <View style={styles.safetyNote}>
        <ShieldCheck size={18} color={colors.teal} />
        <AppText variant="caption" color={colors.muted} style={styles.flexText}>
          Nội dung hỗ trợ chuẩn bị trao đổi; không thay thế khám, chẩn đoán hoặc chỉ định của bác sĩ.
        </AppText>
      </View>

      <View style={styles.segmented}>
        <Pressable onPress={() => setViewMode("new")} style={[styles.segment, viewMode === "new" && styles.segmentActive]}>
          <ClipboardCheck size={16} color={viewMode === "new" ? colors.white : colors.subtle} />
          <AppText variant="bodyStrong" color={viewMode === "new" ? colors.white : colors.subtle}>Phiên mới</AppText>
        </Pressable>
        <Pressable onPress={() => setViewMode("history")} style={[styles.segment, viewMode === "history" && styles.segmentActive]}>
          <History size={16} color={viewMode === "history" ? colors.white : colors.subtle} />
          <AppText variant="bodyStrong" color={viewMode === "history" ? colors.white : colors.subtle}>Lịch sử</AppText>
        </Pressable>
      </View>

      {model.error ? <EmptyState title="Chưa thể tiếp tục" description={model.error} /> : null}

      {viewMode === "history" ? (
        <View style={styles.listGroup}>
          {model.history.length === 0 ? (
            <EmptyState title="Chưa có phiên tư vấn" description="Các bản tổng hợp đã hoàn tất sẽ xuất hiện tại đây." />
          ) : (
            model.history.map((item) => (
              <Card key={item.sessionId} variant="soft" style={styles.historyCard}>
                <View style={styles.titleRow}>
                  <View style={styles.flexText}>
                    <AppText variant="bodyStrong">{item.departmentName || "Phiên tư vấn"}</AppText>
                    <AppText variant="caption" color={colors.subtle}>{formatDateTime(item.createdAt)}</AppText>
                  </View>
                  <Badge tone="success">Đã hoàn tất</Badge>
                </View>
                <AppText color={colors.muted} numberOfLines={2}>{item.symptoms || "Không có mô tả triệu chứng."}</AppText>
                <Button variant="secondary" size="sm" disabled={model.busy === "history"} onPress={() => model.openHistory(item)}>
                  Xem bản tổng hợp
                </Button>
              </Card>
            ))
          )}
          {model.summary ? <SummaryCard summary={model.summary} /> : null}
        </View>
      ) : model.summary ? (
        <>
          <SummaryCard summary={model.summary} />
          <Button variant="secondary" fullWidth onPress={model.reset}>Tạo phiên tư vấn mới</Button>
        </>
      ) : model.session?.status === "completed" ? (
        <Card variant="hard" style={styles.sectionCard}>
          <View style={styles.titleRow}>
            <View style={styles.flexText}>
              <AppText variant="eyebrow" color={colors.teal}>Câu hỏi đã tạo</AppText>
              <AppText variant="h2">Mang theo khi gặp bác sĩ</AppText>
            </View>
            <CheckCircle2 size={24} color={colors.teal} />
          </View>
          <View style={styles.listGroup}>
            {generatedQuestions.map((question, index) => (
              <View key={question.id || String(index)} style={styles.numberedRow}>
                <View style={styles.numberCircle}><AppText variant="caption" color={colors.white}>{index + 1}</AppText></View>
                <AppText style={styles.flexText}>{question.questionText || "Câu hỏi tư vấn"}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.reminderRow}>
            <View style={styles.flexText}>
              <AppText variant="bodyStrong">Nhắc lịch trước buổi khám</AppText>
              <AppText variant="caption" color={colors.subtle}>Backend sẽ đăng ký nhắc lịch cho phiên này.</AppText>
            </View>
            <Switch value={model.reminderEnabled} onValueChange={model.setReminderEnabled} trackColor={{ false: colors.line, true: colors.teal }} />
          </View>
          <Button fullWidth disabled={model.busy === "complete"} onPress={model.complete}>
            {model.busy === "complete" ? "Đang hoàn tất..." : "Hoàn tất và tạo checklist"}
          </Button>
          <Button variant="secondary" fullWidth onPress={model.reset}>Bắt đầu lại</Button>
        </Card>
      ) : (
        <Card variant="hard" style={styles.sectionCard}>
          <AppText variant="h3">1. Chọn chuyên khoa dự kiến</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {model.departments.map((department) => {
              const selected = model.departmentId === department.id;
              return (
                <Pressable key={department.id} onPress={() => model.setDepartmentId(department.id)} style={[styles.chip, selected && styles.chipActive]}>
                  <AppText variant="bodyStrong" color={selected ? colors.white : colors.ink}>{department.departmentName || "Chuyên khoa"}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextField
            label="2. Triệu chứng và điều bạn muốn trao đổi"
            value={model.symptoms}
            onChangeText={model.setSymptoms}
            placeholder="Mô tả thời gian xuất hiện, mức độ và triệu chứng đi kèm..."
            multiline
            numberOfLines={5}
            style={styles.multiline}
          />

          <View style={styles.appointmentGroup}>
            <AppText variant="bodyStrong">3. Thời gian khám dự kiến</AppText>
            <View style={styles.dateButtons}>
              <Pressable onPress={() => setPicker("date")} style={styles.dateButton}>
                <CalendarClock size={17} color={colors.teal} />
                <AppText variant="bodyStrong">{model.appointmentTime.toLocaleDateString("vi-VN")}</AppText>
              </Pressable>
              <Pressable onPress={() => setPicker("time")} style={styles.dateButton}>
                <AppText variant="bodyStrong">
                  {model.appointmentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </AppText>
              </Pressable>
            </View>
            {picker ? (
              <DateTimePicker
                value={model.appointmentTime}
                mode={picker}
                is24Hour
                minimumDate={new Date()}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, value) => {
                  if (Platform.OS !== "ios") setPicker(null);
                  if (event.type === "set" && value) model.setAppointmentTime(value);
                }}
              />
            ) : null}
          </View>

          <Button fullWidth disabled={model.busy === "generate"} onPress={model.generate}>
            {model.busy === "generate" ? "AI đang chuẩn bị câu hỏi..." : "Tạo bộ câu hỏi đi khám"}
          </Button>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing["4xl"] },
  header: { gap: spacing.xs },
  safetyNote: { flexDirection: "row", gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.mint, padding: spacing.md },
  flexText: { flex: 1 },
  segmented: { flexDirection: "row", borderRadius: radius.md, backgroundColor: colors.paperSoft, padding: spacing.xs },
  segment: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.xs, borderRadius: radius.sm, padding: spacing.sm },
  segmentActive: { backgroundColor: colors.teal },
  sectionCard: { gap: spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.pill, backgroundColor: colors.paper, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { borderColor: colors.teal, backgroundColor: colors.teal },
  multiline: { minHeight: 112, textAlignVertical: "top", paddingTop: spacing.md },
  appointmentGroup: { gap: spacing.sm },
  dateButtons: { flexDirection: "row", gap: spacing.sm },
  dateButton: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.sm, backgroundColor: colors.paper },
  listGroup: { gap: spacing.md },
  numberedRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  numberCircle: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.teal },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  reminderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.sm, backgroundColor: colors.paperSoft, padding: spacing.md },
  historyCard: { gap: spacing.md },
  metaBox: { gap: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.paperSoft, padding: spacing.md },
});
