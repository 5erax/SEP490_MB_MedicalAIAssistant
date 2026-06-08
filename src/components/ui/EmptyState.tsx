import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/src/theme/tokens";
import { AppText } from "./AppText";

type StateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: StateProps) {
  return (
    <View style={styles.root}>
      <AppText variant="h3" center>
        {title}
      </AppText>
      {description ? (
        <AppText color={colors.muted} center>
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

export function LoadingState({ title, description }: StateProps) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.teal} />
      <AppText variant="bodyStrong" center>
        {title}
      </AppText>
      {description ? (
        <AppText color={colors.muted} center>
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.lineStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.paperSoft,
    padding: spacing.xl,
  },
});

