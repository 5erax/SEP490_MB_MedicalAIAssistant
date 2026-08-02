/**
 * Screen: PatientProfileSetupScreen (interim placeholder)
 * Workflow: Authentication → post-login redirect for first-login patients
 *
 * Web forces a full profile-setup form here (PersonalPatientProfilePage /
 * PatientProfileSetupModal) before the app is used. That form belongs to
 * Module 13 (Profile) in the mobile build order, so this screen only hosts
 * the routing decision for now (see shouldSetupPatientProfile in
 * src/utils/roles.ts) and lets the user continue — it intentionally does not
 * fake isProfileCompleted. Replace this body with the real form in Module 13.
 */
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AuthGate } from "@/src/components/auth";
import { AppText, Badge, Button, Card, Screen } from "@/src/components/ui";
import { ROUTES } from "@/src/navigation";
import { colors, spacing } from "@/src/theme/tokens";

function PatientProfileSetupPlaceholder() {
  return (
    <Screen contentContainerStyle={styles.content}>
      <Card variant="hard" style={styles.card}>
        <Badge tone="info">Sắp ra mắt</Badge>
        <AppText variant="h2">Hoàn thiện hồ sơ sức khỏe</AppText>
        <AppText color={colors.muted}>
          Form hoàn thiện hồ sơ cá nhân và hồ sơ bệnh nhân đang được xây dựng trong bản cập nhật tiếp theo. Bạn vẫn có thể
          tiếp tục sử dụng ứng dụng ngay bây giờ.
        </AppText>
        <View style={styles.actions}>
          <Button fullWidth onPress={() => router.replace(ROUTES.PATIENT.HOME)}>
            Tiếp tục vào ứng dụng
          </Button>
        </View>
      </Card>
    </Screen>
  );
}

export default function PatientProfileSetupScreen() {
  return (
    <AuthGate>
      <PatientProfileSetupPlaceholder />
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
  },
  card: {
    gap: spacing.lg,
  },
  actions: {
    marginTop: spacing.sm,
  },
});
