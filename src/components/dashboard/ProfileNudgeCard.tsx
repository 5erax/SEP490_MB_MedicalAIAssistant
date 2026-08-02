import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AppText, Button, Card } from "@/src/components/ui";
import { ROUTES } from "@/src/navigation/routes";
import { colors, spacing } from "@/src/theme/tokens";

// Session-only dismiss (module-level, resets on app restart) — mirrors
// Web's sessionStorage flag "medimate.profile.prompt.dismissed" (cleared
// when the browser tab closes; an app restart is the mobile equivalent).
let dismissedThisSession = false;

export function isProfileNudgeDismissed() {
  return dismissedThisSession;
}

export function dismissProfileNudgeForSession() {
  dismissedThisSession = true;
}

export function ProfileNudgeCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.textGroup}>
        <AppText variant="bodyStrong">Hoàn thiện hồ sơ khi bạn sẵn sàng</AppText>
        <AppText color={colors.muted}>
          Hồ sơ giúp gợi ý theo bối cảnh sức khỏe tốt hơn, nhưng bạn vẫn có thể dùng tư vấn chuyên khoa ngay.
        </AppText>
      </View>
      <View style={styles.actions}>
        <Button variant="secondary" size="sm" onPress={onDismiss}>
          Để sau
        </Button>
        <Button size="sm" onPress={() => router.push(ROUTES.SETUP.PATIENT_PROFILE)}>
          Cập nhật hồ sơ
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  textGroup: {
    gap: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
