// Ported from MedicationFormDialog in Web's UserMedicationsPage.jsx.
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BellRing, CalendarDays, Clock3, Pill, Plus, ShieldCheck, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, TextField } from "@/src/components/ui";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";
import { MAX_REMINDER_TIMES, MEDICATION_DISCLAIMER_TEXT, MedicationFormErrors, MedicationFormState } from "@/src/utils/medicationValidation";

type MedicationFormSheetProps = {
  visible: boolean;
  isEditing: boolean;
  form: MedicationFormState;
  errors: MedicationFormErrors;
  submitting: boolean;
  onClose: () => void;
  onSetField: <K extends keyof MedicationFormState>(key: K, value: MedicationFormState[K]) => void;
  onAddReminderTime: (time: string) => void;
  onRemoveReminderTime: (time: string) => void;
  onSubmit: () => void;
};

type ScheduleTone = "active" | "future" | "expired" | "off" | "incomplete";

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  if (!value) return "Chọn ngày";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatTimeDraft(value: string) {
  const cleaned = value.replace(/[^\d:]/g, "");
  if (cleaned.includes(":")) {
    const [hours = "", minutes = ""] = cleaned.split(":");
    return `${hours.slice(0, 2)}${cleaned.endsWith(":") ? ":" : minutes ? ":" : ""}${minutes.slice(0, 2)}`;
  }
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
}

function normalizeTypedTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2})(?::?(\d{1,2}))?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getScheduleState(form: MedicationFormState): { label: string; tone: ScheduleTone; description: string } {
  if (!form.isReminderEnabled) {
    return {
      label: "Chưa bật nhắc",
      tone: "off",
      description: "Bật nhắc để MediMate theo dõi các mốc giờ uống thuốc.",
    };
  }

  if (!form.startDate || !form.endDate || form.reminderTimes.length === 0) {
    return {
      label: "Thiếu lịch nhắc",
      tone: "incomplete",
      description: "Cần ngày bắt đầu, ngày kết thúc và ít nhất một giờ nhắc.",
    };
  }

  const today = toIsoDate(new Date());
  if (today < form.startDate) {
    return {
      label: "Sắp bắt đầu",
      tone: "future",
      description: "Lịch nhắc sẽ bắt đầu khi đến ngày dùng thuốc.",
    };
  }

  if (today > form.endDate) {
    return {
      label: "Đã hết hạn",
      tone: "expired",
      description: "Ngày kết thúc đã qua. Bạn có thể sửa ngày nếu vẫn cần nhắc.",
    };
  }

  return {
    label: "Đang nhắc",
    tone: "active",
    description: "Lịch nhắc đang nằm trong thời gian dùng thuốc.",
  };
}

function DatePickerButton({
  label,
  value,
  error,
  onPress,
}: {
  label: string;
  value: string;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.dateField}>
      <AppText variant="caption" color={error ? colors.danger : colors.muted}>
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.dateInput, error && styles.dateInputError, pressed && styles.pressed]}
      >
        <CalendarDays size={17} color={value ? colors.teal : colors.subtle} />
        <View style={styles.dateCopy}>
          <AppText variant="bodyStrong" color={value ? colors.ink : colors.subtle} numberOfLines={1}>
            {formatDateLabel(value)}
          </AppText>
          {value ? (
            <AppText variant="caption" color={colors.subtle}>
              {value}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function MedicationFormSheet({
  visible,
  isEditing,
  form,
  errors,
  submitting,
  onClose,
  onSetField,
  onAddReminderTime,
  onRemoveReminderTime,
  onSubmit,
}: MedicationFormSheetProps) {
  const [activePicker, setActivePicker] = useState<"startDate" | "endDate" | null>(null);
  const [timeDraft, setTimeDraft] = useState("");
  const [timeDraftError, setTimeDraftError] = useState("");
  const scheduleState = getScheduleState(form);

  function handleTimeDraftChange(value: string) {
    setTimeDraft(formatTimeDraft(value));
    setTimeDraftError("");
  }

  function handleAddTypedTime() {
    const nextTime = normalizeTypedTime(timeDraft);
    if (!nextTime) {
      setTimeDraftError("Nhập giờ theo dạng HH:mm, ví dụ 07:30 hoặc 17:48.");
      return;
    }
    if (form.reminderTimes.includes(nextTime)) {
      setTimeDraftError("Giờ này đã có trong danh sách.");
      return;
    }
    if (form.reminderTimes.length >= MAX_REMINDER_TIMES) {
      setTimeDraftError(`Tối đa ${MAX_REMINDER_TIMES} giờ nhắc.`);
      return;
    }

    onAddReminderTime(nextTime);
    setTimeDraft("");
    setTimeDraftError("");
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={styles.keyboardRoot} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Pill size={20} color={colors.teal} />
            </View>
            <View style={styles.headerCopy}>
              <AppText variant="caption" color={colors.teal}>
                Thuốc & lịch nhắc
              </AppText>
              <AppText variant="h3">{isEditing ? "Chỉnh sửa thuốc" : "Thêm thuốc mới"}</AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <X size={20} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.statusCard}>
              <View style={[styles.statusIcon, styles[`${scheduleState.tone}Icon`]]}>
                <BellRing size={20} color={scheduleState.tone === "expired" ? colors.danger : colors.teal} />
              </View>
              <View style={styles.statusCopy}>
                <AppText variant="bodyStrong">{scheduleState.label}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  {scheduleState.description}
                </AppText>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionNumber}>
                  <AppText variant="caption" color={colors.teal}>
                    1
                  </AppText>
                </View>
                <View style={styles.sectionTitle}>
                  <AppText variant="bodyStrong">Thông tin thuốc</AppText>
                  <AppText variant="caption" color={colors.subtle}>
                    Ghi tên thuốc và hướng dẫn dùng để dễ nhận diện.
                  </AppText>
                </View>
              </View>

              <TextField
                label="Tên thuốc"
                placeholder="Ví dụ: Paracetamol 500mg"
                value={form.medicineName}
                onChangeText={(value) => onSetField("medicineName", value)}
                error={errors.medicineName}
              />

              <TextField
                label="Hướng dẫn dùng thuốc (tuỳ chọn)"
                placeholder="Ví dụ: Uống sau ăn, 1 viên/lần"
                value={form.dosageInstruction}
                onChangeText={(value) => onSetField("dosageInstruction", value)}
                error={errors.dosageInstruction}
                multiline
                numberOfLines={3}
                style={styles.multiline}
              />
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionNumber}>
                  <AppText variant="caption" color={colors.teal}>
                    2
                  </AppText>
                </View>
                <View style={styles.sectionTitle}>
                  <AppText variant="bodyStrong">Thời gian dùng</AppText>
                  <AppText variant="caption" color={colors.subtle}>
                    Ngày kết thúc quyết định lịch nhắc còn hiệu lực hay không.
                  </AppText>
                </View>
              </View>

              <View style={styles.dateRow}>
                <DatePickerButton
                  label="Ngày bắt đầu"
                  value={form.startDate}
                  error={errors.startDate}
                  onPress={() => setActivePicker("startDate")}
                />
                <DatePickerButton
                  label="Ngày kết thúc"
                  value={form.endDate}
                  error={errors.endDate}
                  onPress={() => setActivePicker("endDate")}
                />
              </View>
            </View>

            <View style={styles.reminderCard}>
              <View style={styles.reminderTop}>
                <View style={styles.reminderTitleRow}>
                  <View style={styles.reminderIcon}>
                    <Clock3 size={18} color={colors.teal} />
                  </View>
                  <View style={styles.reminderTitleCopy}>
                    <AppText variant="bodyStrong">Lịch nhắc uống thuốc</AppText>
                    <AppText variant="caption" color={colors.muted}>
                      Chọn các mốc giờ MediMate cần nhắc trong ngày.
                    </AppText>
                  </View>
                </View>
                <Switch
                  value={form.isReminderEnabled}
                  onValueChange={(value) => onSetField("isReminderEnabled", value)}
                  trackColor={{ false: colors.lineStrong, true: colors.teal }}
                  thumbColor={colors.paper}
                />
              </View>

              <View style={styles.chipRow}>
                {form.reminderTimes.map((time) => (
                  <View key={time} style={styles.chip}>
                    <Clock3 size={14} color={colors.teal} />
                    <AppText variant="bodyStrong">{time}</AppText>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Xoá giờ ${time}`} onPress={() => onRemoveReminderTime(time)} hitSlop={6}>
                      <X size={14} color={colors.ink} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <View style={styles.timeInputPanel}>
                <View style={styles.timeInputCopy}>
                  <AppText variant="caption" color={colors.teal}>
                    Nhập giờ nhắc
                  </AppText>
                  <AppText variant="caption" color={colors.subtle}>
                    Gõ nhanh 1748 hoặc 17:48 rồi bấm thêm.
                  </AppText>
                </View>
                <View style={styles.timeInputRow}>
                  <TextInput
                    accessibilityLabel="Nhập giờ nhắc"
                    value={timeDraft}
                    onChangeText={handleTimeDraftChange}
                    onSubmitEditing={handleAddTypedTime}
                    placeholder="HH:mm"
                    placeholderTextColor={colors.subtle}
                    keyboardType="number-pad"
                    maxLength={5}
                    style={[styles.timeInput, timeDraftError && styles.timeInputError]}
                  />
                  <Pressable accessibilityRole="button" onPress={handleAddTypedTime} style={styles.addTimeButton}>
                    <Plus size={15} color={colors.white} />
                    <AppText variant="bodyStrong" color={colors.white}>
                      Thêm
                    </AppText>
                  </Pressable>
                </View>
                {timeDraftError ? (
                  <AppText variant="caption" color={colors.danger}>
                    {timeDraftError}
                  </AppText>
                ) : null}
              </View>

              {errors.reminderTimes ? (
                <AppText variant="caption" color={colors.danger}>
                  {errors.reminderTimes}
                </AppText>
              ) : null}
            </View>

            <View style={styles.notice}>
              <ShieldCheck size={17} color={colors.teal} />
              <AppText variant="caption" color={colors.muted} style={styles.noticeText}>
                {MEDICATION_DISCLAIMER_TEXT}
              </AppText>
            </View>

            {activePicker === "startDate" ? (
              <DateTimePicker
                value={form.startDate ? new Date(`${form.startDate}T00:00:00`) : new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(event, selectedDate) => {
                  setActivePicker(Platform.OS === "ios" ? "startDate" : null);
                  if (event.type === "set" && selectedDate) {
                    onSetField("startDate", toIsoDate(selectedDate));
                  }
                }}
              />
            ) : null}

            {activePicker === "endDate" ? (
              <DateTimePicker
                value={form.endDate ? new Date(`${form.endDate}T00:00:00`) : new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(event, selectedDate) => {
                  setActivePicker(Platform.OS === "ios" ? "endDate" : null);
                  if (event.type === "set" && selectedDate) {
                    onSetField("endDate", toIsoDate(selectedDate));
                  }
                }}
              />
            ) : null}

          </ScrollView>

          <View style={styles.footer}>
            <Button variant="secondary" onPress={onClose} disabled={submitting} style={styles.footerButton}>
              Hủy
            </Button>
            <Button onPress={onSubmit} disabled={submitting} style={styles.footerButton}>
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboardRoot: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bg,
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.2)",
    borderRadius: radius.xl,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  statusIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
  },
  activeIcon: {
    backgroundColor: colors.paper,
  },
  futureIcon: {
    backgroundColor: colors.paper,
  },
  expiredIcon: {
    backgroundColor: colors.dangerBg,
  },
  offIcon: {
    backgroundColor: colors.paper,
  },
  incompleteIcon: {
    backgroundColor: colors.warningBg,
  },
  statusCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionCard: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    ...shadows.soft,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionNumber: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  dateInput: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.paperSoft,
    paddingHorizontal: spacing.md,
  },
  dateInputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  dateCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  reminderCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.24)",
    borderRadius: radius.xl,
    backgroundColor: colors.mint,
    padding: spacing.lg,
  },
  reminderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  reminderTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  reminderIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
  },
  reminderTitleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.24)",
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  addChip: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.teal,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: spacing.md,
  },
  timeInputPanel: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.2)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.74)",
    padding: spacing.md,
  },
  timeInputCopy: {
    gap: 2,
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timeInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0,
  },
  timeInputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  addTimeButton: {
    minWidth: 92,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.teal,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
    ...shadows.soft,
  },
  footerButton: {
    flex: 1,
    borderRadius: radius.lg,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
});
