// Ported from src/pages/PreConsultationPage.jsx (Web) — 5-step wizard:
// Info -> Checklist -> Questions -> Reminder -> Summary. Department,
// symptoms and facility are read-only, filled only by applying a prior
// specialty-triage session (same dependency Web has); appointment time is
// the only free-typed field in step 1.
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BellRing, CalendarDays, Check, ChevronRight, ClipboardCheck, Clock3, FileQuestionMark, MapPin, ShieldCheck, Stethoscope, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, Card, EmptyState, Screen } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useConsultationWizard } from "@/src/hooks/useConsultationWizard";
import { SuggestedConsultationFacility } from "@/src/types/consultation";
import { SymptomAnalysisSession } from "@/src/types/symptomAnalysis";
import { ConsultationHistorySheet } from "./ConsultationHistorySheet";

const STEPS = [
  { label: "Thông tin", hint: "Buổi khám", icon: Stethoscope },
  { label: "Chuẩn bị", hint: "Checklist", icon: ClipboardCheck },
  { label: "Câu hỏi", hint: "Trao đổi", icon: FileQuestionMark },
  { label: "Nhắc lịch", hint: "Tùy chọn", icon: BellRing },
  { label: "Tổng kết", hint: "Xác nhận", icon: ShieldCheck },
];

const CATEGORY_LABELS: Record<string, string> = {
  diagnosis: "Chẩn đoán",
  tests: "Xét nghiệm",
  treatment: "Điều trị",
  lifestyle: "Sinh hoạt",
  followup: "Theo dõi",
};

function formatQuestionCategory(value?: string) {
  const key = String(value || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  return CATEGORY_LABELS[key] || "Câu hỏi tư vấn";
}

function formatDateTime(value?: string, fallback = "Chưa cập nhật") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString("vi-VN", { dateStyle: "long", timeStyle: "short" });
}

function toIsoAtLeastFiveMinutesAhead() {
  return new Date(Date.now() + 5 * 60 * 1000).toISOString();
}

function getSessionTitle(session: SymptomAnalysisSession, fallback: string) {
  return session.inputText || session.userInput || session.symptoms || fallback;
}

function formatHistoryStatus(value?: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["completed", "complete"].includes(normalized)) return "Hoàn tất";
  if (["pending", "processing", "in_progress"].includes(normalized)) return "Đang xử lý";
  if (["cancelled", "canceled"].includes(normalized)) return "Đã hủy";
  if (normalized === "failed") return "Không thành công";
  return "Đang cập nhật";
}

function SectionHead({ step, title, description }: { step: number; title: string; description?: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionHeadBadge}>
        <AppText variant="bodyStrong" color={colors.white}>
          {step}
        </AppText>
      </View>
      <View style={styles.sectionHeadCopy}>
        <AppText variant="h3">{title}</AppText>
        {description ? <AppText color={colors.muted}>{description}</AppText> : null}
      </View>
    </View>
  );
}

export function PreConsultationScreen() {
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const wizard = useConsultationWizard();
  const [tab, setTab] = useState<"new" | "history">("new");
  const [sessionPickerVisible, setSessionPickerVisible] = useState(false);
  const [facilityPickerVisible, setFacilityPickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);

  useEffect(() => {
    if (!params.sessionId || autoApplied) return;
    setAutoApplied(true);
    void wizard.applySuggestedSession(String(params.sessionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionId, autoApplied]);

  async function openSessionPicker() {
    setSessionPickerVisible(true);
    if (wizard.suggestedSessionsState === "idle") await wizard.loadSuggestedSessions();
  }

  async function handleApplySession(sessionId: string) {
    const success = await wizard.applySuggestedSession(sessionId);
    if (success) setSessionPickerVisible(false);
  }

  function combineDateAndTime(base: Date, part: Date, mode: "date" | "time") {
    const next = new Date(base);
    if (mode === "date") {
      next.setFullYear(part.getFullYear(), part.getMonth(), part.getDate());
    } else {
      next.setHours(part.getHours(), part.getMinutes(), 0, 0);
    }
    return next;
  }

  const appointmentDate = wizard.form.appointmentTime ? new Date(wizard.form.appointmentTime) : new Date(toIsoAtLeastFiveMinutesAhead());

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTab("new")}
          style={[styles.tabItem, tab === "new" && styles.tabItemActive]}
        >
          <AppText variant="bodyStrong" color={tab === "new" ? colors.white : colors.ink}>
            Tư vấn mới
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTab("history")}
          style={[styles.tabItem, tab === "history" && styles.tabItemActive]}
        >
          <AppText variant="bodyStrong" color={tab === "history" ? colors.white : colors.ink}>
            Lịch sử tư vấn
          </AppText>
        </Pressable>
      </View>

      {tab === "history" ? (
        <ConsultationHistorySheet
          embedded
          onStartNew={() => {
            wizard.resetWizard();
            setTab("new");
          }}
        />
      ) : (
        <>
          <View style={styles.heroPanel}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <ClipboardCheck size={22} color={colors.white} />
              </View>
              <View style={styles.heroPill}>
                <AppText variant="caption" color={colors.white}>
                  Chuẩn bị trước buổi khám
                </AppText>
              </View>
            </View>
            <AppText variant="h1" color={colors.white} style={styles.heroTitle}>
              Tư vấn trước khám
            </AppText>
            <AppText color="rgba(255,255,255,0.86)" style={styles.heroCopy}>
              Ghi lại thông tin cần thiết, xem danh sách chuẩn bị và tổng hợp câu hỏi dành cho bác sĩ.
            </AppText>
          </View>

          <View style={[styles.stepperCard, styles.stepperCardContent]}>
            {STEPS.map((item, index) => {
              const Icon = item.icon;
              const active = index === wizard.step;
              const done = index < wizard.step;
              return (
                <View key={item.label} style={[styles.stepColumn, index > 0 && styles.stepDivider, active && styles.stepColumnActive]}>
                  <View style={[styles.stepIcon, active && styles.stepIconActive, done && styles.stepIconDone]}>
                    {done ? <Check size={15} color="#15803d" /> : <Icon size={15} color={active ? colors.white : colors.subtle} />}
                  </View>
                  <AppText variant="caption" color={active ? colors.teal : colors.ink} numberOfLines={1}>
                    {item.label}
                  </AppText>
                </View>
              );
            })}
          </View>

          {wizard.error ? (
            <View style={styles.errorBanner}>
              <AppText color={colors.danger}>{wizard.error}</AppText>
            </View>
          ) : null}

          {wizard.step === 0 ? (
            <Card variant="hard" style={styles.card}>
              <SectionHead
                step={1}
                title="Thông tin buổi khám"
                description="Chọn phiên gợi ý chuyên khoa để điền chuyên khoa, triệu chứng và bệnh viện, sau đó chọn thời gian dự kiến khám."
              />

              <Pressable accessibilityRole="button" onPress={openSessionPicker}>
                <Card variant="soft" style={styles.pickerRow}>
                  <View style={styles.pickerRowText}>
                    <AppText variant="caption" color={colors.subtle}>
                      Phiên gợi ý chuyên khoa
                    </AppText>
                    <AppText variant="bodyStrong">
                      {wizard.appliedSessionTitle || "Danh sách phiên gợi ý chuyên khoa"}
                    </AppText>
                  </View>
                  <ChevronRight size={18} color={colors.teal} />
                </Card>
              </Pressable>

              <View style={styles.readonlyGrid}>
                <View style={[styles.readonlyBox, wizard.formErrors.departmentId && styles.readonlyBoxError]}>
                  <AppText variant="caption" color={colors.subtle}>
                    Chuyên khoa
                  </AppText>
                  <AppText variant="bodyStrong">{wizard.form.departmentName || "Chọn phiên gợi ý để hiển thị"}</AppText>
                  {wizard.formErrors.departmentId ? (
                    <AppText variant="caption" color={colors.danger}>
                      {wizard.formErrors.departmentId}
                    </AppText>
                  ) : wizard.form.departmentName ? (
                    <AppText variant="caption" color={colors.subtle}>
                      Được điền tự động từ phiên gợi ý đã chọn.
                    </AppText>
                  ) : null}
                </View>

                <View style={[styles.readonlyBox, wizard.formErrors.symptoms && styles.readonlyBoxError]}>
                  <AppText variant="caption" color={colors.subtle}>
                    Triệu chứng
                  </AppText>
                  <AppText>{wizard.form.symptoms || "Chọn phiên gợi ý để hiển thị"}</AppText>
                  {wizard.formErrors.symptoms ? (
                    <AppText variant="caption" color={colors.danger}>
                      {wizard.formErrors.symptoms}
                    </AppText>
                  ) : wizard.form.symptoms ? (
                    <AppText variant="caption" color={colors.subtle}>
                      Được điền tự động từ phiên gợi ý đã chọn.
                    </AppText>
                  ) : null}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => wizard.suggestedFacilities.length > 0 && setFacilityPickerVisible(true)}
                disabled={wizard.suggestedFacilities.length === 0}
              >
                <Card
                  variant="soft"
                  style={[styles.pickerRow, wizard.formErrors.facilityId && styles.readonlyBoxError, wizard.suggestedFacilities.length === 0 && styles.pickerRowDisabled]}
                >
                  <View style={styles.pickerRowText}>
                    <AppText variant="caption" color={colors.subtle}>
                      Bệnh viện dự kiến
                    </AppText>
                    <AppText variant="bodyStrong">
                      {wizard.form.facilityName
                        || (wizard.suggestedFacilities.length === 0
                          ? "Chọn phiên gợi ý chuyên khoa trước"
                          : `Chọn bệnh viện gợi ý (${wizard.suggestedFacilities.length})`)}
                    </AppText>
                  </View>
                  <ChevronRight size={18} color={colors.teal} />
                </Card>
              </Pressable>
              {wizard.formErrors.facilityId ? (
                <AppText variant="caption" color={colors.danger}>
                  {wizard.formErrors.facilityId}
                </AppText>
              ) : null}

              <View style={styles.fieldGroup}>
                <AppText variant="caption" color={wizard.formErrors.appointmentTime ? colors.danger : colors.muted}>
                  Thời gian dự kiến khám
                </AppText>
                <View style={styles.dateTimeRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setDatePickerVisible(true)}
                    style={[styles.dateInput, wizard.formErrors.appointmentTime && styles.readonlyBoxError]}
                  >
                    <CalendarDays size={16} color={colors.teal} />
                    <AppText>{wizard.form.appointmentTime ? appointmentDate.toLocaleDateString("vi-VN") : "Chọn ngày"}</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setTimePickerVisible(true)}
                    style={[styles.dateInput, wizard.formErrors.appointmentTime && styles.readonlyBoxError]}
                  >
                    <Clock3 size={16} color={colors.teal} />
                    <AppText>
                      {wizard.form.appointmentTime
                        ? appointmentDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                        : "Chọn giờ"}
                    </AppText>
                  </Pressable>
                </View>
                {wizard.formErrors.appointmentTime ? (
                  <AppText variant="caption" color={colors.danger}>
                    {wizard.formErrors.appointmentTime}
                  </AppText>
                ) : null}
                {datePickerVisible ? (
                  <DateTimePicker
                    value={appointmentDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setDatePickerVisible(false);
                      if (event.type === "set" && selectedDate) {
                        wizard.updateAppointmentTime(combineDateAndTime(appointmentDate, selectedDate, "date").toISOString());
                      }
                    }}
                  />
                ) : null}
                {timePickerVisible ? (
                  <DateTimePicker
                    value={appointmentDate}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      setTimePickerVisible(false);
                      if (event.type === "set" && selectedTime) {
                        wizard.updateAppointmentTime(combineDateAndTime(appointmentDate, selectedTime, "time").toISOString());
                      }
                    }}
                  />
                ) : null}
              </View>

              <Button fullWidth disabled={wizard.busy === "generate"} onPress={() => wizard.startConsultation()}>
                {wizard.busy === "generate" ? (
                  <View style={styles.loadingLabel}>
                    <ActivityIndicator color={colors.white} size="small" />
                    <AppText variant="bodyStrong" color={colors.white}>
                      Đang tạo phiên...
                    </AppText>
                  </View>
                ) : (
                  "Bắt đầu tư vấn"
                )}
              </Button>
            </Card>
          ) : null}

          {wizard.step === 1 ? (
            <Card variant="hard" style={styles.card}>
              <SectionHead
                step={2}
                title="Danh sách chuẩn bị"
                description="Đọc các lưu ý dưới đây để chủ động chuẩn bị trước khi đến khám."
              />
              {wizard.busy === "checklist" ? (
                <ActivityIndicator color={colors.teal} />
              ) : wizard.checklistItems.length > 0 ? (
                <View style={styles.checklist}>
                  {wizard.checklistItems.map((item, index) => (
                    <View key={item.id} style={styles.checklistRow}>
                      <View style={styles.checklistNumber}>
                        <AppText variant="caption" color={colors.white}>
                          {index + 1}
                        </AppText>
                      </View>
                      <View style={styles.checklistText}>
                        <View style={[styles.checklistBadge, item.isMandatory ? styles.checklistBadgeWarning : styles.checklistBadgeInfo]}>
                          <AppText variant="caption" color={item.isMandatory ? colors.warning : colors.teal}>
                            {item.isMandatory ? "Cần lưu ý" : "Khuyến nghị"}
                          </AppText>
                        </View>
                        <AppText variant="bodyStrong">{item.content}</AppText>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState title="Chuyên khoa này chưa có checklist riêng" description="Bạn vẫn có thể tiếp tục để xem câu hỏi gợi ý cho buổi khám." />
              )}
              <View style={styles.actionsRow}>
                <Button variant="secondary" onPress={() => wizard.setStep(0)}>
                  Quay lại
                </Button>
                <Button disabled={wizard.busy === "session"} onPress={() => wizard.continueFromChecklist()}>
                  {wizard.busy === "session" ? "Đang tổng hợp..." : "Tiếp tục"}
                </Button>
              </View>
            </Card>
          ) : null}

          {wizard.step === 2 ? (
            <Card variant="hard" style={styles.card}>
              <SectionHead
                step={3}
                title="Câu hỏi nên trao đổi với bác sĩ"
                description="Lưu lại những câu phù hợp. Đây là gợi ý chuẩn bị, không phải chẩn đoán y tế."
              />
              {wizard.questions.length > 0 ? (
                <View style={styles.checklist}>
                  {wizard.questions.map((question, index) => (
                    <View key={question.id} style={styles.checklistRow}>
                      <View style={styles.checklistNumber}>
                        <AppText variant="caption" color={colors.white}>
                          {index + 1}
                        </AppText>
                      </View>
                      <View style={styles.checklistText}>
                        <View style={[styles.checklistBadge, styles.checklistBadgeInfo]}>
                          <AppText variant="caption" color={colors.teal}>
                            {formatQuestionCategory(question.category)}
                          </AppText>
                        </View>
                        <AppText variant="bodyStrong">{question.text}</AppText>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState title="Chưa có câu hỏi gợi ý" description="Bạn vẫn có thể dùng phần mô tả triệu chứng khi trao đổi trực tiếp với bác sĩ." />
              )}
              <View style={styles.actionsRow}>
                <Button variant="secondary" onPress={() => wizard.setStep(1)}>
                  Quay lại
                </Button>
                <Button onPress={() => wizard.setStep(3)}>Thiết lập nhắc lịch</Button>
              </View>
            </Card>
          ) : null}

          {wizard.step === 3 ? (
            <Card variant="hard" style={styles.card}>
              <SectionHead
                step={4}
                title="Bạn có muốn được nhắc lịch?"
                description="Nếu bật, thông báo nhắc lịch sẽ được gửi tới email của tài khoản này."
              />

              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: wizard.reminderEnabled === true }}
                onPress={() => wizard.chooseReminder(true)}
              >
                <Card variant="soft" style={[styles.reminderOption, wizard.reminderEnabled === true && styles.reminderOptionSelected]}>
                  <View style={[styles.reminderOptionIcon, wizard.reminderEnabled === true && styles.reminderOptionIconSelected]}>
                    <BellRing size={18} color={wizard.reminderEnabled === true ? colors.white : colors.subtle} />
                  </View>
                  <View style={styles.reminderOptionCopy}>
                    <AppText variant="bodyStrong">Có, nhắc tôi</AppText>
                    <AppText variant="caption" color={colors.muted}>
                      Đăng ký nhận thông báo cho lịch khám này.
                    </AppText>
                  </View>
                  {wizard.reminderEnabled === true ? <Check size={20} color={colors.teal} /> : null}
                </Card>
              </Pressable>

              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: wizard.reminderEnabled === false }}
                onPress={() => wizard.chooseReminder(false)}
              >
                <Card variant="soft" style={[styles.reminderOption, wizard.reminderEnabled === false && styles.reminderOptionSelected]}>
                  <View style={[styles.reminderOptionIcon, wizard.reminderEnabled === false && styles.reminderOptionIconSelected]}>
                    <BellRing size={18} color={wizard.reminderEnabled === false ? colors.white : colors.subtle} />
                  </View>
                  <View style={styles.reminderOptionCopy}>
                    <AppText variant="bodyStrong">Không cần nhắc</AppText>
                    <AppText variant="caption" color={colors.muted}>
                      Tôi sẽ tự theo dõi lịch khám.
                    </AppText>
                  </View>
                  {wizard.reminderEnabled === false ? <Check size={20} color={colors.teal} /> : null}
                </Card>
              </Pressable>

              <View style={styles.actionsRow}>
                <Button variant="secondary" onPress={() => wizard.setStep(2)}>
                  Quay lại
                </Button>
                <Button disabled={wizard.busy === "reminder"} onPress={() => wizard.saveReminderAndOpenSummary()}>
                  {wizard.busy === "reminder" ? "Đang lưu..." : "Xác nhận lựa chọn"}
                </Button>
              </View>
            </Card>
          ) : null}

          {wizard.step === 4 ? (
            <Card variant="hard" style={styles.card}>
              <SectionHead
                step={5}
                title={wizard.completed ? "Đã hoàn thành tư vấn trước khám" : "Kiểm tra bản tổng kết"}
                description={
                  wizard.completed
                    ? "Thông tin đã được lưu để bạn chuẩn bị cho buổi khám."
                    : "Xem lại nội dung trước khi xác nhận hoàn thành phiên."
                }
              />
              {wizard.completed ? (
                <View style={styles.successBanner}>
                  <Check size={18} color={colors.teal} />
                  <AppText color={colors.muted} style={{ flex: 1 }}>
                    Bạn có thể mở lại phần này khi đến khám.
                  </AppText>
                </View>
              ) : null}

              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryItemHeader}>
                    <Stethoscope size={16} color={colors.teal} />
                    <AppText variant="caption" color={colors.subtle}>
                      Chuyên khoa
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong">{wizard.summary?.departmentName || wizard.form.departmentName || "Chưa cập nhật"}</AppText>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryItemHeader}>
                    <CalendarDays size={16} color={colors.teal} />
                    <AppText variant="caption" color={colors.subtle}>
                      Thời gian khám
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong">{formatDateTime(wizard.summary?.appointmentTime || wizard.form.appointmentTime)}</AppText>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryItemHeader}>
                    <BellRing size={16} color={colors.teal} />
                    <AppText variant="caption" color={colors.subtle}>
                      Nhắc lịch
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong">{wizard.reminderEnabled ? "Đã đăng ký" : "Không đăng ký"}</AppText>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryItemHeader}>
                    <FileQuestionMark size={16} color={colors.teal} />
                    <AppText variant="caption" color={colors.subtle}>
                      Điều cần tư vấn
                    </AppText>
                  </View>
                  <AppText color={colors.muted}>{wizard.summary?.symptoms || wizard.form.symptoms}</AppText>
                </View>
              </View>

              <View style={styles.actionsRow}>
                {!wizard.completed ? (
                  <>
                    <Button variant="secondary" onPress={() => wizard.setStep(3)}>
                      Quay lại
                    </Button>
                    <Button disabled={wizard.busy === "complete"} onPress={() => wizard.completeConsultation()}>
                      {wizard.busy === "complete" ? "Đang xác nhận..." : "Xác nhận hoàn thành"}
                    </Button>
                  </>
                ) : (
                  <Button
                    fullWidth
                    onPress={() => {
                      wizard.resetWizard();
                      router.push("/(patient)/home" as never);
                    }}
                  >
                    Về trang tư vấn chuyên khoa
                  </Button>
                )}
              </View>
            </Card>
          ) : null}
        </>
      )}

      <Modal visible={sessionPickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSessionPickerVisible(false)}>
        <SafeAreaView style={styles.sheetRoot} edges={["top", "bottom"]}>
          <View style={styles.sheetHeader}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerTitleWrap}>
              <AppText variant="h3" center>
                Danh sách phiên gợi ý chuyên khoa
              </AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setSessionPickerVisible(false)} style={styles.closeButton} hitSlop={8}>
              <X size={20} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {wizard.suggestedSessionsState === "loading" ? (
              <ActivityIndicator color={colors.teal} />
            ) : wizard.suggestedSessionsState === "error" ? (
              <EmptyState title="Chưa thể tải danh sách" description={wizard.suggestedSessionsError} />
            ) : wizard.suggestedSessions.length === 0 ? (
              <EmptyState
                title="Bạn chưa có phiên gợi ý chuyên khoa nào"
                description="Hãy mở Tư vấn chuyên khoa để tạo một phiên trước."
              />
            ) : (
              wizard.suggestedSessions.map((item, index) => {
                const sessionId = item.sessionId || item.id || `session-${index}`;
                return (
                  <Pressable
                    key={sessionId}
                    disabled={Boolean(wizard.applyingSessionId)}
                    onPress={() => handleApplySession(sessionId)}
                    style={styles.sessionRow}
                  >
                    <View style={styles.pickerRowText}>
                      <AppText variant="bodyStrong" numberOfLines={2}>
                        {getSessionTitle(item, "Phiên gợi ý chuyên khoa")}
                      </AppText>
                      <AppText variant="caption" color={colors.subtle}>
                        {formatDateTime(item.createdAt || item.createdDate, "Chưa có ngày tạo")}
                      </AppText>
                      <View style={styles.pickerStatusBadge}>
                        <AppText variant="caption" color={colors.teal}>
                          Gợi ý chuyên khoa · {formatHistoryStatus(item.status)}
                        </AppText>
                      </View>
                    </View>
                    {wizard.applyingSessionId === sessionId ? <ActivityIndicator color={colors.teal} size="small" /> : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={facilityPickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFacilityPickerVisible(false)}>
        <SafeAreaView style={styles.sheetRoot} edges={["top", "bottom"]}>
          <View style={styles.sheetHeader}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerTitleWrap}>
              <AppText variant="h3" center>
                Chọn bệnh viện gợi ý
              </AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setFacilityPickerVisible(false)} style={styles.closeButton} hitSlop={8}>
              <X size={20} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {wizard.suggestedFacilities.map((facility: SuggestedConsultationFacility) => {
              const selected = facility.facilityId === wizard.form.facilityId;
              return (
                <Pressable
                  key={facility.facilityId}
                  onPress={() => {
                    wizard.selectSuggestedFacility(facility);
                    setFacilityPickerVisible(false);
                  }}
                  style={[styles.sessionRow, selected && styles.reminderOptionSelected]}
                >
                  <View style={[styles.reminderOptionIcon, selected && styles.reminderOptionIconSelected]}>
                    <MapPin size={18} color={selected ? colors.white : colors.subtle} />
                  </View>
                  <View style={styles.pickerRowText}>
                    <AppText variant="bodyStrong">{facility.facilityName}</AppText>
                    {facility.address ? (
                      <AppText variant="caption" color={colors.subtle}>
                        {facility.address}
                      </AppText>
                    ) : null}
                  </View>
                  {selected ? <Check size={20} color={colors.teal} /> : <ChevronRight size={18} color={colors.teal} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  heroPanel: {
    gap: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.limeDark,
    padding: spacing.xl,
    shadowColor: colors.limeDark,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 4,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroPill: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: spacing.md,
  },
  heroTitle: {
    maxWidth: 300,
  },
  heroCopy: {
    maxWidth: 330,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: colors.teal,
  },
  stepperCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
  },
  stepperCardContent: {
    flexDirection: "row",
  },
  stepColumn: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs / 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  stepColumnActive: {
    backgroundColor: colors.mint,
  },
  stepDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
  },
  stepIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  stepIconActive: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  stepIconDone: {
    borderColor: "#8dd9b2",
    backgroundColor: colors.mint,
  },
  errorBanner: {
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: "row",
    gap: spacing.md,
  },
  sectionHeadBadge: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.teal,
  },
  sectionHeadCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.teal,
  },
  pickerRowDisabled: {
    opacity: 0.6,
  },
  pickerRowText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  readonlyGrid: {
    gap: spacing.md,
  },
  readonlyBox: {
    gap: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 4,
    borderLeftColor: colors.teal,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  readonlyBoxError: {
    borderColor: colors.danger,
    borderLeftColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateInput: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  loadingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checklist: {
    gap: spacing.md,
  },
  checklistRow: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  checklistNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.teal,
  },
  checklistText: {
    flex: 1,
    gap: spacing.xs,
  },
  checklistBadge: {
    alignSelf: "flex-start",
    minHeight: 22,
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
  checklistBadgeWarning: {
    backgroundColor: colors.warningBg,
  },
  checklistBadgeInfo: {
    backgroundColor: colors.mint,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  reminderOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  reminderOptionSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.mint,
  },
  reminderOptionIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  reminderOptionIconSelected: {
    backgroundColor: colors.teal,
  },
  reminderOptionCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  summaryGrid: {
    gap: spacing.md,
  },
  summaryItem: {
    gap: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  summaryItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sheetRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  pickerStatusBadge: {
    alignSelf: "flex-start",
    minHeight: 28,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
  },
});
