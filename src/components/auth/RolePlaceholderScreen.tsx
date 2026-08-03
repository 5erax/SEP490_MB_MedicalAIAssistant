import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card, Screen } from "@/src/components/ui";
import { useLogout } from "@/src/hooks/useLogout";
import { useAuth } from "@/src/providers";
import { colors, spacing } from "@/src/theme/tokens";
import { getSessionRoles } from "@/src/utils/roles";

type RolePlaceholderScreenProps = {
  title: string;
  role: string;
};

function getDisplayName(session: ReturnType<typeof useAuth>["session"]) {
  return String(session?.displayName ?? session?.name ?? session?.userName ?? session?.email ?? "Chưa có tên");
}

export function RolePlaceholderScreen({ title, role }: RolePlaceholderScreenProps) {
  const { session } = useAuth();
  const { logout, loggingOut } = useLogout();
  const roles = getSessionRoles(session);

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <AppText variant="h3">+</AppText>
        </View>
        <View style={styles.headerText}>
          <AppText variant="eyebrow" color={colors.teal}>
            MediMate AI
          </AppText>
          <AppText variant="h2">{title}</AppText>
        </View>
      </View>

      <Card variant="hard" style={styles.card}>
        <View style={styles.row}>
          <AppText variant="caption" color={colors.subtle}>
            Role
          </AppText>
          <Badge tone="info">{role}</Badge>
        </View>
        <View style={styles.row}>
          <AppText variant="caption" color={colors.subtle}>
            User Name
          </AppText>
          <AppText variant="bodyStrong">{getDisplayName(session)}</AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="caption" color={colors.subtle}>
            User Email
          </AppText>
          <AppText variant="bodyStrong">{String(session?.email ?? "Chưa có email")}</AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="caption" color={colors.subtle}>
            Backend Roles
          </AppText>
          <AppText color={colors.muted}>{roles.length ? roles.join(", ") : "patient mặc định"}</AppText>
        </View>

        <Button variant="dark" fullWidth disabled={loggingOut} onPress={logout} style={styles.logoutButton}>
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  brandMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.mint,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  card: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.sm,
  },
  logoutButton: {
    marginTop: spacing.sm,
  },
});
