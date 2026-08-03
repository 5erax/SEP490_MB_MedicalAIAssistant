import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight, Clock } from "lucide-react-native";

import { AppText, Badge } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { LabTestSession } from "@/src/types/labTest";
import { formatDateOnly, getSessionStatusPresentation } from "@/src/utils/labTestPresentation";

export function SessionCard({ session, onPress }: { session: LabTestSession; onPress: () => void }) {
  const status = getSessionStatusPresentation(session.status);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.iconMark}>
        <Clock size={18} color={colors.teal} />
      </View>
      <View style={styles.main}>
        <AppText variant="bodyStrong">{formatDateOnly(session.testDate)}</AppText>
        <AppText variant="caption" color={colors.subtle}>
          {session.facilityName || "Chưa rõ cơ sở y tế"}
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
  iconMark: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  main: {
    flex: 1,
    gap: spacing.xs / 2,
  },
});
