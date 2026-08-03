import { Pressable, ScrollView, StyleSheet } from "react-native";
import { CreditCard, FileHeart, LucideIcon, ReceiptText, ShieldCheck, User } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";

export type ProfileTabId = "info" | "medical" | "package" | "transactions" | "security";

const TABS: { id: ProfileTabId; label: string; icon: LucideIcon }[] = [
  { id: "info", label: "Thông tin", icon: User },
  { id: "medical", label: "Y tế", icon: FileHeart },
  { id: "package", label: "Gói dịch vụ", icon: CreditCard },
  { id: "transactions", label: "Giao dịch", icon: ReceiptText },
  { id: "security", label: "Bảo mật", icon: ShieldCheck },
];

export function ProfileTabs({ activeTab, onChange }: { activeTab: ProfileTabId; onChange: (tab: ProfileTabId) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.root}
      contentContainerStyle={styles.row}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const selected = activeTab === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(id)}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Icon size={15} color={selected ? colors.white : colors.muted} />
            <AppText variant="caption" color={selected ? colors.white : colors.muted}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.paperSoft,
  },
  tabSelected: {
    backgroundColor: colors.teal,
    ...shadows.soft,
  },
});
