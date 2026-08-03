import { Pressable, ScrollView, StyleSheet } from "react-native";
import { CreditCard, FileHeart, LucideIcon, ReceiptText, ShieldCheck, User } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";

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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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
            <Icon size={16} color={selected ? colors.white : colors.muted} />
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
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paper,
  },
  tabSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.teal,
  },
});
