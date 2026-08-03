import { StyleSheet } from "react-native";
import { router } from "expo-router";

import { AppText, Button, Card } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";

export function SecuritySection() {
  return (
    <Card variant="soft" style={styles.card}>
      <AppText variant="h3">Bảo mật</AppText>
      <AppText color={colors.muted}>Mật khẩu được xác nhận bằng mã OTP gửi qua email.</AppText>
      <Button onPress={() => router.push(ROUTES.PUBLIC.FORGOT_PASSWORD)}>Gửi mã đổi mật khẩu</Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
});
