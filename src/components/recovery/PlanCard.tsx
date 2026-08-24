import { Pressable, StyleSheet, View } from "react-native";
import { CalendarDays, ChevronRight, ClipboardList, Route } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RecoveryPlan } from "@/src/types/recoveryPlan";
import { PLAN_STATUS, StatusTone } from "@/src/utils/recoveryPlanPresentation";

const toneStyle: Record<StatusTone, { bg: string; fg: string }> = {
  warning: { bg: colors.warningBg, fg: colors.warning },
  success: { bg: colors.successBg, fg: colors.success },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  neutral: { bg: colors.paperSoft, fg: colors.muted },
  cancelled: { bg: "#FFE4ED", fg: "#BE123C" },
};

export function PlanCard({ plan, onPress }: { plan: RecoveryPlan; onPress: () => void }) {
  const status = PLAN_STATUS[plan.status];
  const tone = toneStyle[status.tone];
  const phasesCount = plan.phases?.length ?? 0;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.accent} />
      <View style={styles.iconWrap}>
        <Route size={18} color={colors.teal} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <AppText variant="h3" style={styles.title} numberOfLines={1}>
            {plan.planName}
          </AppText>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <AppText variant="caption" color={tone.fg} numberOfLines={1}>
              {status.label}
            </AppText>
          </View>
        </View>

        {plan.summary ? (
          <AppText variant="caption" color={colors.muted} numberOfLines={2} style={styles.summary}>
            {plan.summary}
          </AppText>
        ) : null}

        <View style={styles.metaRow}>
          {plan.durationDays ? (
            <View style={styles.metaChip}>
              <CalendarDays size={13} color={colors.teal} />
              <AppText variant="caption" color={colors.muted}>
                {plan.durationDays} ngày
              </AppText>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <ClipboardList size={13} color={colors.ink} />
            <AppText variant="caption" color={colors.muted}>
              {phasesCount} giai đoạn
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.chevron}>
        <ChevronRight size={18} color={colors.subtle} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 118,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  cardPressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.teal,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  statusPill: {
    maxWidth: 132,
    minHeight: 28,
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
  summary: {
    paddingRight: spacing.md,
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
  chevron: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
});
