// Ported from MedicationFormDialog in Web's UserMedicationsPage.jsx.
import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Plus, X } from "lucide-react-native";

import { AppText, Button, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { MEDICATION_DISCLAIMER_TEXT, MedicationFormErrors, MedicationFormState } from "@/src/utils/medicationValidation";

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

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeLabel(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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
  const [activePicker, setActivePicker] = useState<"startDate" | "endDate" | "reminderTime" | null>(null);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <AppText variant="h3">{isEditing ? "Chỉnh sửa thuốc" : "Thêm thuốc"}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <AppText variant="caption" color={errors.startDate ? colors.danger : colors.muted}>
                Ngày bắt đầu
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActivePicker("startDate")}
                style={[styles.dateInput, errors.startDate && styles.dateInputError]}
              >
                <AppText color={form.startDate ? colors.ink : colors.subtle}>{form.startDate || "Chọn ngày"}</AppText>
              </Pressable>
              {errors.startDate ? (
                <AppText variant="caption" color={colors.danger}>
                  {errors.startDate}
                </AppText>
              ) : null}
            </View>

            <View style={styles.dateField}>
              <AppText variant="caption" color={errors.endDate ? colors.danger : colors.muted}>
                Ngày kết thúc
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActivePicker("endDate")}
                style={[styles.dateInput, errors.endDate && styles.dateInputError]}
              >
                <AppText color={form.endDate ? colors.ink : colors.subtle}>{form.endDate || "Chọn ngày"}</AppText>
              </Pressable>
              {errors.endDate ? (
                <AppText variant="caption" color={colors.danger}>
                  {errors.endDate}
                </AppText>
              ) : null}
            </View>
          </View>

          <View style={styles.reminderToggleRow}>
            <View style={styles.reminderToggleText}>
              <AppText variant="bodyStrong">Bật nhắc nhở</AppText>
              <AppText variant="caption" color={colors.subtle}>
                Ứng dụng sẽ nhắc bạn vào các giờ đã chọn bên dưới.
              </AppText>
            </View>
            <Switch
              value={form.isReminderEnabled}
              onValueChange={(value) => onSetField("isReminderEnabled", value)}
              trackColor={{ false: colors.line, true: colors.lime }}
              thumbColor={colors.paper}
            />
          </View>

          <View style={styles.reminderTimesGroup}>
            <AppText variant="caption" color={errors.reminderTimes ? colors.danger : colors.muted}>
              Giờ nhắc
            </AppText>
            <View style={styles.chipRow}>
              {form.reminderTimes.map((time) => (
                <View key={time} style={styles.chip}>
                  <AppText variant="bodyStrong">{time}</AppText>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Xoá giờ ${time}`} onPress={() => onRemoveReminderTime(time)} hitSlop={6}>
                    <X size={14} color={colors.ink} />
                  </Pressable>
                </View>
              ))}
              <Pressable accessibilityRole="button" onPress={() => setActivePicker("reminderTime")} style={styles.addChip}>
                <Plus size={14} color={colors.ink} />
                <AppText variant="bodyStrong">Thêm giờ</AppText>
              </Pressable>
            </View>
            {errors.reminderTimes ? (
              <AppText variant="caption" color={colors.danger}>
                {errors.reminderTimes}
              </AppText>
            ) : null}
          </View>

          <AppText variant="caption" color={colors.subtle}>
            {MEDICATION_DISCLAIMER_TEXT}
          </AppText>

          {activePicker === "startDate" ? (
            <DateTimePicker
              value={form.startDate ? new Date(form.startDate) : new Date()}
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
              value={form.endDate ? new Date(form.endDate) : new Date()}
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

          {activePicker === "reminderTime" ? (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setActivePicker(Platform.OS === "ios" ? "reminderTime" : null);
                if (event.type === "set" && selectedDate) {
                  onAddReminderTime(toTimeLabel(selectedDate));
                }
              }}
            />
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button variant="secondary" onPress={onClose} disabled={submitting} style={styles.footerButton}>
            Huỷ
          </Button>
          <Button onPress={onSubmit} disabled={submitting} style={styles.footerButton}>
            {submitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </View>
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
    gap: spacing.md,
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
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
    gap: spacing.sm,
  },
  dateInput: {
    minHeight: 48,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  dateInputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  reminderToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  reminderToggleText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  reminderTimesGroup: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerButton: {
    flex: 1,
  },
});
