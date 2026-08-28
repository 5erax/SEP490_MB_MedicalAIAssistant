import { Pressable, StyleSheet, View } from "react-native";
import { Bell, CalendarDays, Clock3, Pencil, Pill, Trash2 } from "lucide-react-native";

import { AppText, Badge } from "@/src/components/ui";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";
import { UserMedication } from "@/src/types/medication";
import { formatMedicationDateRange } from "@/src/utils/medicationValidation";

type MedicationCardProps = {
  medication: UserMedication;
  removing: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

function getReminderTimes(medication: UserMedication) {
  return (medication.reminderTimes ?? [])
    .map((entry) => (entry?.timeOfDay ? String(entry.timeOfDay).slice(0, 5) : ""))
    .filter(Boolean)
    .sort();
}

export function MedicationCard({ medication, removing, onEdit, onRemove }: MedicationCardProps) {
  const reminderTimes = getReminderTimes(medication);
  const hasReminder = medication.isReminderEnabled && reminderTimes.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Pill size={20} color={colors.teal} />
        </View>
        <View style={styles.titleWrap}>
          <AppText variant="h3" numberOfLines={2}>
            {medication.medicineName}
          </AppText>
          <View style={styles.metaRow}>
            <CalendarDays size={14} color={colors.subtle} />
            <AppText variant="caption" color={colors.subtle} numberOfLines={1} style={styles.metaText}>
              {formatMedicationDateRange(medication.startDate, medication.endDate)}
            </AppText>
          </View>
        </View>
        <Badge tone={hasReminder ? "success" : "neutral"}>{hasReminder ? "Đang nhắc" : "Không nhắc"}</Badge>
      </View>

      {medication.dosageInstruction ? (
        <View style={styles.instructionBox}>
          <AppText variant="caption" color={colors.subtle}>
            Hướng dẫn dùng
          </AppText>
          <AppText color={colors.ink}>{medication.dosageInstruction}</AppText>
        </View>
      ) : null}

      <View style={styles.reminderPanel}>
        <View style={styles.reminderHead}>
          <Bell size={16} color={hasReminder ? colors.teal : colors.subtle} />
          <AppText variant="bodyStrong" color={hasReminder ? colors.ink : colors.subtle}>
            {hasReminder ? "Giờ nhắc trong ngày" : "Chưa bật lịch nhắc"}
          </AppText>
        </View>
        {hasReminder ? (
          <View style={styles.timeRow}>
            {reminderTimes.map((time) => (
              <View key={time} style={styles.timeChip}>
                <Clock3 size={13} color={colors.teal} />
                <AppText variant="caption" color={colors.teal}>
                  {time}
                </AppText>
              </View>
            ))}
          </View>
        ) : (
          <AppText variant="caption" color={colors.subtle}>
            Bấm Sửa để chọn ngày dùng thuốc và giờ nhắc.
          </AppText>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
          <Pencil size={15} color={colors.ink} />
          <AppText variant="bodyStrong">Sửa</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onRemove}
          disabled={removing}
          style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && !removing && styles.pressed, removing && styles.disabled]}
        >
          <Trash2 size={15} color={colors.danger} />
          <AppText variant="bodyStrong" color={colors.danger}>
            {removing ? "Đang xóa..." : "Xóa"}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: spacing.lg,
    ...shadows.soft,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    flex: 1,
  },
  instructionBox: {
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  reminderPanel: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.18)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(231,243,245,0.5)",
    padding: spacing.md,
  },
  reminderHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  timeChip: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  deleteButton: {
    borderColor: "rgba(180,35,24,0.3)",
    backgroundColor: colors.dangerBg,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
