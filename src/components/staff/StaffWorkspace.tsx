import { StyleSheet, View } from "react-native";
import { LockKeyhole, LogOut, UserRoundCog } from "lucide-react-native";

import { AppText, Badge, Button, Card, Screen } from "@/src/components/ui";
import { useLogout } from "@/src/hooks/useLogout";
import { useAuth } from "@/src/providers";
import { colors, spacing } from "@/src/theme/tokens";

export function StaffWorkspace() {
  const { session } = useAuth();
  const { logout, loggingOut } = useLogout();

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.icon}><UserRoundCog size={24} color={colors.teal} /></View>
        <View style={styles.headerCopy}>
          <AppText variant="eyebrow" color={colors.teal}>Không gian nhân viên</AppText>
          <AppText variant="h1">Tài khoản nội bộ</AppText>
        </View>
      </View>

      <Card style={styles.card}>
        <View style={styles.row}><AppText variant="caption" color={colors.muted}>Tài khoản</AppText><AppText variant="bodyStrong">{String(session?.displayName ?? session?.email ?? "Chưa cập nhật")}</AppText></View>
        <View style={styles.row}><AppText variant="caption" color={colors.muted}>Quyền</AppText><Badge tone="info">Nhân viên</Badge></View>
      </Card>

      <Card variant="soft" style={styles.blocker}>
        <LockKeyhole size={22} color={colors.warning} />
        <View style={styles.blockerCopy}>
          <AppText variant="h3">Chưa có nghiệp vụ được backend cấp cho Staff</AppText>
          <AppText color={colors.muted}>Các API xử lý yêu cầu phục hồi hiện chỉ cho vai trò Doctor; API quản trị chỉ cho Admin. Ứng dụng không tự nâng quyền Staff hoặc hiển thị dữ liệu bệnh nhân khi chưa có contract và phạm vi nghiệp vụ rõ ràng.</AppText>
        </View>
      </Card>

      <Button variant="dark" fullWidth disabled={loggingOut} onPress={logout} leftIcon={<LogOut size={17} color={colors.white} />}>
        {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center", gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", backgroundColor: colors.mint, borderRadius: 16 },
  headerCopy: { flex: 1, gap: spacing.xs },
  card: { gap: spacing.lg },
  row: { gap: spacing.xs },
  blocker: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  blockerCopy: { flex: 1, gap: spacing.sm },
});
