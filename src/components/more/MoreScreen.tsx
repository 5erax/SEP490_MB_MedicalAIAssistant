import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, CreditCard, Pill, ReceiptText, ShieldPlus, UserRound } from "lucide-react-native";

import { AppText, Screen } from "@/src/components/ui";
import { ROUTES } from "@/src/navigation/routes";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";

type MoreItem = {
  title: string;
  description: string;
  route: string;
  icon: typeof UserRound;
  tone: "teal" | "green" | "amber" | "blue";
};

const ITEMS: MoreItem[] = [
  {
    title: "Hồ sơ",
    description: "Thông tin cá nhân và hồ sơ y tế.",
    route: ROUTES.PATIENT.PROFILE,
    icon: UserRound,
    tone: "teal",
  },
  {
    title: "Thuốc & lịch nhắc",
    description: "Quản lý thuốc, ngày dùng và giờ nhắc.",
    route: ROUTES.PATIENT.MY_MEDICATIONS,
    icon: Pill,
    tone: "green",
  },
  {
    title: "Gói dịch vụ",
    description: "Xem quyền lợi và nâng cấp gói.",
    route: ROUTES.PATIENT.PRICING,
    icon: CreditCard,
    tone: "amber",
  },
  {
    title: "Lịch sử giao dịch",
    description: "Theo dõi thanh toán và trạng thái giao dịch.",
    route: ROUTES.PATIENT.PAYMENT_HISTORY,
    icon: ReceiptText,
    tone: "blue",
  },
];

const toneStyles = {
  teal: { bg: colors.mint, color: colors.teal },
  green: { bg: colors.successBg, color: colors.success },
  amber: { bg: colors.warningBg, color: colors.warning },
  blue: { bg: "#e8f0ff", color: colors.blue },
};

function getInitials(name?: string | null, email?: string | null) {
  const source = (name || email || "MediMate").trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function MoreListItem({ item }: { item: MoreItem }) {
  const Icon = item.icon;
  const tone = toneStyles[item.tone];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(item.route as never)}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={[styles.itemIcon, { backgroundColor: tone.bg }]}>
        <Icon size={21} color={tone.color} />
      </View>
      <View style={styles.itemCopy}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText variant="caption" color={colors.subtle} numberOfLines={2}>
          {item.description}
        </AppText>
      </View>
      <View style={styles.chevron}>
        <ChevronRight size={18} color={colors.teal} />
      </View>
    </Pressable>
  );
}

export function MoreScreen() {
  const { session } = useAuth();
  const displayName = session?.displayName || session?.name || "MediMate AI";
  const email = session?.email || "";

  return (
    <Screen scroll padded={false} style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <AppText variant="bodyStrong" color={colors.white}>
            {getInitials(displayName, email)}
          </AppText>
        </View>
        <View style={styles.heroCopy}>
          <AppText variant="caption" color={colors.teal}>
            KHÔNG GIAN CÁ NHÂN
          </AppText>
          <AppText variant="h2" numberOfLines={2}>
            Tiện ích của bạn
          </AppText>
          <AppText color={colors.muted} numberOfLines={2}>
            Quản lý hồ sơ, thuốc, gói dịch vụ và lịch sử thanh toán tại một nơi.
          </AppText>
        </View>
      </View>

      <View style={styles.accountCard}>
        <View style={styles.accountIcon}>
          <ShieldPlus size={22} color={colors.teal} />
        </View>
        <View style={styles.accountCopy}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {displayName}
          </AppText>
          {email ? (
            <AppText variant="caption" color={colors.subtle} numberOfLines={1}>
              {email}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.list}>
        {ITEMS.map((item) => (
          <MoreListItem key={item.title} item={item} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: "rgba(231,243,245,0.72)",
    padding: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.teal,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  accountCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
    ...shadows.soft,
  },
  accountIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: spacing.md,
  },
  itemIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  chevron: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
});
