import { Pressable, StyleSheet, View } from "react-native";
import { Bell, CalendarDays, Clock3, Pencil, Pill, Trash2 } from "lucide-react-native";

import { AppText, Badge } from "@/src/components/ui";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";
import { UserMedication } from "@/src/types/medication";
import { formatMedicationDateRange } from "@/src/utils/medicationValidation";
import { getMedicationReminderStatus, getMedicationReminderTimes } from "@/src/utils/medicationReminderStatus";

type MedicationCardProps = {
  medication: UserMedication;
  removing: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

export function MedicationCard({ medication, removing, onEdit, onRemove }: MedicationCardProps) {
  const reminderStatus = getMedicationReminderStatus(medication);
  const reminderTimes = getMedicationReminderTimes(medication);

  return (
    <View style={styles.card}>
      <View style={styles.accent} />

      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Pill size={20} color={colors.teal} />
        </View>
        <View style={styles.titleWrap}>
          <View style={styles.nameRow}>
            <AppText variant="h3" numberOfLines={2} style={styles.name}>
              {medication.medicineName}
            </AppText>
            <Badge tone={reminderStatus.tone}>{reminderStatus.label}</Badge>
          </View>
          <View style={styles.metaRow}>
            <CalendarDays size={14} color={colors.subtle} />
            <AppText variant="caption" color={colors.subtle} numberOfLines={1} style={styles.metaText}>
              {formatMedicationDateRange(medication.startDate, medication.endDate)}
            </AppText>
          </View>
        </View>
      </View>

      {medication.dosageInstruction ? (
        <View style={styles.instructionBox}>
          <AppText variant="caption" color={colors.subtle}>
            Hướng dẫn dùng
          </AppText>
          <AppText color={colors.ink}>{medication.dosageInstruction}</AppText>
        </View>
      ) : null}

      <View style={[styles.reminderPanel, !reminderStatus.active && styles.reminderPanelMuted]}>
        <View style={styles.reminderHead}>
          <View style={[styles.reminderIcon, reminderStatus.active && styles.reminderIconActive]}>
            <Bell size={15} color={reminderStatus.active ? colors.white : colors.subtle} />
          </View>
          <View style={styles.reminderCopy}>
            <AppText variant="bodyStrong" color={reminderStatus.active ? colors.ink : colors.subtle}>
              {reminderStatus.active ? "Giờ nhắc trong ngày" : reminderStatus.emptyText}
            </AppText>
            {!reminderStatus.active ? (
              <AppText variant="caption" color={colors.subtle}>
                {reminderStatus.key === "expired"
                  ? "Bấm Sửa để gia hạn nếu bạn vẫn cần theo dõi."
                  : "Bấm Sửa để chọn ngày dùng thuốc và giờ nhắc."}
              </AppText>
            ) : null}
          </View>
        </View>

        {reminderStatus.active ? (
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
        ) : null}
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
    position: "relative",
    overflow: "hidden",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    ...shadows.soft,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: spacing.lg,
    bottom: spacing.lg,
    width: 4,
    borderTopRightRadius: radius.pill,
    borderBottomRightRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  iconBox: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    minWidth: 0,
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
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  reminderPanel: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.2)",
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  reminderPanelMuted: {
    borderColor: colors.line,
    backgroundColor: colors.paperSoft,
  },
  reminderHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reminderIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
  },
  reminderIconActive: {
    backgroundColor: colors.teal,
  },
  reminderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  timeChip: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.18)",
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
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  deleteButton: {
    borderColor: "rgba(180,35,24,0.22)",
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
