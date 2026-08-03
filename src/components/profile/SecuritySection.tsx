import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { KeyRound } from "lucide-react-native";

import { AppText, Button, Card } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";

export function SecuritySection() {
  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headerTitle}>
        <View style={styles.iconMark}>
          <KeyRound size={18} color={colors.teal} />
        </View>
        <AppText variant="h3">Bảo mật</AppText>
      </View>
      <AppText color={colors.muted}>Mật khẩu được xác nhận bằng mã OTP gửi qua email.</AppText>
      <Button onPress={() => router.push(ROUTES.PUBLIC.FORGOT_PASSWORD)}>Gửi mã đổi mật khẩu</Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headerTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.mint,
  },
});
