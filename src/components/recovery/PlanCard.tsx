import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { AppText, Badge } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RecoveryPlan } from "@/src/types/recoveryPlan";
import { PLAN_STATUS } from "@/src/utils/recoveryPlanPresentation";

export function PlanCard({ plan, onPress }: { plan: RecoveryPlan; onPress: () => void }) {
  const status = PLAN_STATUS[plan.status];

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.main}>
        <AppText variant="bodyStrong">{plan.planName}</AppText>
        {plan.durationDays ? (
          <AppText variant="caption" color={colors.subtle}>
            {plan.durationDays} ngày
          </AppText>
        ) : null}
      </View>
      <Badge tone={status.tone}>{status.label}</Badge>
      <ChevronRight size={18} color={colors.subtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  main: {
    flex: 1,
    gap: spacing.xs / 2,
  },
});
