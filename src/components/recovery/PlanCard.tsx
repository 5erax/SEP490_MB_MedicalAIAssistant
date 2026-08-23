import { Pressable, StyleSheet, View } from "react-native";
import { CalendarDays, ChevronRight, Route } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RecoveryPlan } from "@/src/types/recoveryPlan";
import { PLAN_STATUS, StatusTone } from "@/src/utils/recoveryPlanPresentation";

const toneStyle: Record<StatusTone, { bg: string; fg: string }> = {
  warning: { bg: colors.warningBg, fg: colors.warning },
  success: { bg: colors.successBg, fg: colors.success },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  neutral: { bg: colors.paperSoft, fg: colors.muted },
};

export function PlanCard({ plan, onPress }: { plan: RecoveryPlan; onPress: () => void }) {
  const status = PLAN_STATUS[plan.status];
  const tone = toneStyle[status.tone];
  const phasesCount = plan.phases?.length ?? 0;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.rail}>
        <View style={styles.railDot}>
          <Route size={17} color={colors.teal} />
        </View>
        <View style={styles.railLine} />
      </View>
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong" style={styles.title} numberOfLines={2}>
            {plan.planName}
          </AppText>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <AppText variant="caption" color={tone.fg} numberOfLines={1}>
              {status.label}
            </AppText>
          </View>
        </View>
        <View style={styles.metaRow}>
          {plan.durationDays ? (
            <View style={styles.metaChip}>
              <CalendarDays size={14} color={colors.teal} />
              <AppText variant="caption" color={colors.muted}>
                {plan.durationDays} ngày
              </AppText>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <AppText variant="caption" color={colors.muted}>
              {phasesCount} giai đoạn
            </AppText>
          </View>
        </View>
        {plan.summary ? (
          <AppText variant="caption" color={colors.muted} numberOfLines={2}>
            {plan.summary}
          </AppText>
        ) : null}
      </View>
      <ChevronRight size={18} color={colors.subtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  rail: {
    width: 42,
    alignItems: "center",
  },
  railDot: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  railLine: {
    flex: 1,
    width: 2,
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  statusPill: {
    maxWidth: 134,
    minHeight: 28,
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaChip: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
    paddingHorizontal: spacing.sm,
  },
});
