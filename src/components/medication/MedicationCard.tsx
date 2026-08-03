import { StyleSheet, View } from "react-native";
import { Pencil, Trash2 } from "lucide-react-native";

import { AppText, Badge, Button, Card } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { UserMedication } from "@/src/types/medication";
import { formatMedicationDateRange } from "@/src/utils/medicationValidation";

type MedicationCardProps = {
  medication: UserMedication;
  removing: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

export function MedicationCard({ medication, removing, onEdit, onRemove }: MedicationCardProps) {
  const reminderTimes = (medication.reminderTimes ?? [])
    .map((entry) => (entry?.timeOfDay ? String(entry.timeOfDay).slice(0, 5) : ""))
    .filter(Boolean);

  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <AppText variant="h3">{medication.medicineName}</AppText>
          <AppText variant="caption" color={colors.subtle}>
            {formatMedicationDateRange(medication.startDate, medication.endDate)}
          </AppText>
        </View>
        <Badge tone={medication.isReminderEnabled ? "success" : "neutral"}>
          {medication.isReminderEnabled ? "Đang nhắc" : "Không nhắc"}
        </Badge>
      </View>

      {medication.dosageInstruction ? <AppText color={colors.muted}>{medication.dosageInstruction}</AppText> : null}

      {reminderTimes.length > 0 ? (
        <View style={styles.chipRow}>
          {reminderTimes.map((time) => (
            <View key={time} style={styles.chip}>
              <AppText variant="caption">{time}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button variant="secondary" size="sm" onPress={onEdit} style={styles.actionButton}>
          <View style={styles.actionInline}>
            <Pencil size={15} color={colors.ink} />
            <AppText variant="bodyStrong">Sửa</AppText>
          </View>
        </Button>
        <Button variant="danger" size="sm" onPress={onRemove} disabled={removing} style={styles.actionButton}>
          <View style={styles.actionInline}>
            <Trash2 size={15} color={colors.white} />
            <AppText variant="bodyStrong" color={colors.white}>
              {removing ? "Đang xoá..." : "Xoá"}
            </AppText>
          </View>
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  actionInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
