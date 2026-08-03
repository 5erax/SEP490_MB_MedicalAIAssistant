import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { AppText, Badge } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RecoveryPlanRequest } from "@/src/types/recoveryPlan";
import { formatDateOnly, getDiseaseGroupLabel, REQUEST_STATUS } from "@/src/utils/recoveryPlanPresentation";

export function RequestCard({ request, onPress }: { request: RecoveryPlanRequest; onPress: () => void }) {
  const status = REQUEST_STATUS[request.status];

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.main}>
        <AppText variant="bodyStrong">{getDiseaseGroupLabel(request.diseaseGroup)}</AppText>
        <AppText variant="caption" color={colors.subtle}>
          {formatDateOnly(request.requestedAt)}
        </AppText>
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
