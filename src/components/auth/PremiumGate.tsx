// Mirrors Web's route access:"premium" (src/router/access.js): requires
// auth first (same redirect-to-login as AuthGate), then requires
// hasPremiumAccess(session) or shows an upgrade prompt instead of a
// redirect-to-/pricing — Web redirects to /pricing, but Subscription
// (Module 8) doesn't exist on mobile yet, so this shows an inline upsell
// card for now (see docs/mobile-progress.md).
import { ReactNode } from "react";
import { Redirect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Sparkles } from "lucide-react-native";

import { AppText, Button, Card, LoadingState, Screen } from "@/src/components/ui";
import { useToast } from "@/src/hooks/useToast";
import { ROUTES } from "@/src/navigation/routes";
import { useAuth } from "@/src/providers";
import { colors, spacing } from "@/src/theme/tokens";
import { hasPremiumAccess } from "@/src/utils/premium";

function PremiumUpsell() {
  const { showToast } = useToast();

  return (
    <Screen contentContainerStyle={styles.content}>
      <Card variant="hard" style={styles.card}>
        <View style={styles.iconMark}>
          <Sparkles size={22} color={colors.limeDark} />
        </View>
        <AppText variant="h2">Tính năng dành cho gói MediMate+</AppText>
        <AppText color={colors.muted}>
          Nâng cấp gói dịch vụ để trò chuyện không giới hạn với trợ lý AI của MediMate.
        </AppText>
        <Button
          fullWidth
          onPress={() => showToast({ type: "info", message: "Trang gói dịch vụ sẽ có ở bản cập nhật tiếp theo." })}
        >
          Xem gói dịch vụ
        </Button>
      </Card>
    </Screen>
  );
}

export function PremiumGate({ children }: { children: ReactNode }) {
  const { session, isRestoring } = useAuth();

  if (isRestoring) {
    return <LoadingState title="Đang kiểm tra quyền truy cập..." />;
  }

  if (!session) {
    return <Redirect href={ROUTES.PUBLIC.LOGIN} />;
  }

  if (!hasPremiumAccess(session)) {
    return <PremiumUpsell />;
  }

  return children;
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
  },
  card: {
    gap: spacing.md,
  },
  iconMark: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.lime,
  },
});
