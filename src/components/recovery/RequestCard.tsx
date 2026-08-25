import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight, ClipboardList } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RecoveryPlanRequest } from "@/src/types/recoveryPlan";
import { formatDateOnly, getDiseaseGroupLabel, REQUEST_STATUS, StatusTone } from "@/src/utils/recoveryPlanPresentation";

const toneStyle: Record<StatusTone, { bg: string; fg: string }> = {
  warning: { bg: colors.warningBg, fg: colors.warning },
  success: { bg: colors.successBg, fg: colors.success },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  neutral: { bg: colors.paperSoft, fg: colors.muted },
  cancelled: { bg: "#FFE4ED", fg: "#BE123C" },
};

export function RequestCard({ request, onPress, highlighted = false }: { request: RecoveryPlanRequest; onPress: () => void; highlighted?: boolean }) {
  const status = REQUEST_STATUS[request.status];
  const tone = toneStyle[status.tone];

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row, highlighted && styles.rowHighlighted]}>
      <View style={[styles.iconWrap, highlighted && styles.iconWrapHighlighted]}>
        <ClipboardList size={19} color={highlighted ? colors.white : colors.teal} />
      </View>
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong" style={styles.title} numberOfLines={1}>
            {getDiseaseGroupLabel(request.diseaseGroup)}
          </AppText>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <AppText variant="caption" color={tone.fg} numberOfLines={1}>
              {status.label}
            </AppText>
          </View>
        </View>
        <View style={styles.timelineRow}>
          <View style={styles.dot} />
          <AppText variant="caption" color={colors.muted}>
            Gửi ngày {formatDateOnly(request.requestedAt)}
          </AppText>
        </View>
      </View>
      <ChevronRight size={18} color={colors.subtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  rowHighlighted: {
    borderColor: "rgba(8,127,140,0.32)",
    backgroundColor: "rgba(232,246,244,0.9)",
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  iconWrapHighlighted: {
    backgroundColor: colors.teal,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  statusPill: {
    maxWidth: 142,
    minHeight: 28,
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
});
