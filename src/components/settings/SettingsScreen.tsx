// Web has no dedicated Settings page — this screen collects the only real
// Settings-shaped content that exists on Web: the legal/info pages
// (TrustInfoPage.jsx, linked only from the public marketing footer on Web,
// never from inside the logged-in app) plus logout. Display preferences
// (theme/motion/contrast/text-scale/spacing) are a deliberate scope cut —
// see docs/mobile-progress.md.
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { ChevronRight, ClipboardList, FileWarning, LifeBuoy, LockKeyhole, LogOut } from "lucide-react-native";

import { AppText, Card, Screen } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useLogout } from "@/src/hooks";
import { ROUTES } from "@/src/navigation/routes";

// Keep a secondary entry point in Settings in addition to the persistent
// patient tab so the feature stays discoverable from the account hub.
const FEATURE_LINKS = [{ icon: ClipboardList, label: "Phân tích xét nghiệm", route: ROUTES.PATIENT.RECORDS }] as const;

const LEGAL_LINKS = [
  { icon: LifeBuoy, label: "Trung tâm hỗ trợ", route: ROUTES.PUBLIC.SUPPORT },
  { icon: LockKeyhole, label: "Quyền riêng tư", route: ROUTES.PUBLIC.PRIVACY },
  { icon: FileWarning, label: "Tuyên bố miễn trừ y tế", route: ROUTES.PUBLIC.MEDICAL_DISCLAIMER },
] as const;

type LinkEntry = { icon: typeof ClipboardList; label: string; route: string };

function LinkGroup({ title, links }: { title: string; links: readonly LinkEntry[] }) {
  return (
    <View style={styles.group}>
      <AppText variant="caption" color={colors.subtle}>
        {title}
      </AppText>
      <Card variant="soft" style={styles.card}>
        {links.map(({ icon: Icon, label, route }, index) => (
          <Pressable
            key={route}
            accessibilityRole="button"
            onPress={() => router.push(route as never)}
            style={[styles.row, index > 0 && styles.rowDivider]}
          >
            <View style={styles.rowIcon}>
              <Icon size={18} color={colors.teal} />
            </View>
            <AppText variant="bodyStrong" style={styles.rowLabel}>
              {label}
            </AppText>
            <ChevronRight size={18} color={colors.subtle} />
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

export function SettingsScreen() {
  const { logout, loggingOut } = useLogout();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.headerGroup}>
        <AppText variant="h1">Cài đặt</AppText>
        <AppText color={colors.muted}>Thông tin pháp lý, hỗ trợ và quản lý tài khoản.</AppText>
      </View>

      <LinkGroup title="Tính năng" links={FEATURE_LINKS} />
      <LinkGroup title="Hỗ trợ & pháp lý" links={LEGAL_LINKS} />

      <Pressable accessibilityRole="button" onPress={logout} disabled={loggingOut} style={styles.logoutButton}>
        {loggingOut ? (
          <ActivityIndicator color={colors.danger} size="small" />
        ) : (
          <LogOut size={18} color={colors.danger} />
        )}
        <AppText variant="bodyStrong" color={colors.danger}>
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </AppText>
      </Pressable>

      <AppText variant="caption" color={colors.subtle} center>
        MediMate AI · Phiên bản {version}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  headerGroup: {
    gap: spacing.xs,
  },
  group: {
    gap: spacing.sm,
  },
  card: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  rowIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.mint,
  },
  rowLabel: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    paddingVertical: spacing.md,
  },
});
