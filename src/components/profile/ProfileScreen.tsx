// Ported from Web's UserProfilePage.jsx tabs (info/medical/package/
// transactions/security) — redesigned as a native pill-tab switcher instead
// of Web's sidebar tab list. "Giao dịch" reuses the existing
// PaymentHistoryScreen (Module 9) exactly as Web nests PaymentHistoryPanel
// inside this same page, rather than duplicating that list.
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LogOut } from "lucide-react-native";

import { AppText, Screen } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useLogout, useProfile } from "@/src/hooks";
import { useAuth } from "@/src/providers";
import { PaymentHistoryScreen } from "@/src/components/payment";
import { MedicalProfileSection } from "./MedicalProfileSection";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { ProfileTabId, ProfileTabs } from "./ProfileTabs";
import { SecuritySection } from "./SecuritySection";
import { SubscriptionSummarySection } from "./SubscriptionSummarySection";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "MM"
  );
}

export function ProfileScreen() {
  const { session } = useAuth();
  const { logout, loggingOut } = useLogout();
  const [activeTab, setActiveTab] = useState<ProfileTabId>("info");
  const profile = useProfile();
  const userId = String(session?.userId || (session as Record<string, unknown> | null)?.id || "");

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <AppText variant="bodyStrong" color={colors.teal}>
              {initials(profile.personalForm.displayName)}
            </AppText>
          </View>
          <View style={styles.identityText}>
            <AppText variant="h3">{profile.personalForm.displayName || "Người dùng"}</AppText>
            <AppText variant="caption" color={colors.subtle}>
              {profile.email}
            </AppText>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Đăng xuất" onPress={logout} disabled={loggingOut} style={styles.logoutButton}>
          {loggingOut ? <ActivityIndicator size="small" color={colors.danger} /> : <LogOut size={18} color={colors.danger} />}
        </Pressable>
      </View>

      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "transactions" ? (
        <PaymentHistoryScreen />
      ) : (
        <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabBody} keyboardShouldPersistTaps="handled">
          {activeTab === "info" ? (
            <PersonalInfoSection
              state={profile.personalState}
              email={profile.email}
              form={profile.personalForm}
              errors={profile.personalErrors}
              saveError={profile.personalSaveError}
              isEditing={profile.isEditingPersonal}
              saving={profile.savingPersonal}
              onStartEditing={profile.startEditingPersonal}
              onCancel={profile.cancelEditingPersonal}
              onChange={profile.updatePersonalField}
              onSave={() => profile.savePersonal(userId)}
              onRetry={profile.reload}
            />
          ) : null}

          {activeTab === "medical" ? (
            <MedicalProfileSection
              state={profile.medicalState}
              form={profile.medicalForm}
              errors={profile.medicalErrors}
              saveError={profile.medicalSaveError}
              isEditing={profile.isEditingMedical}
              saving={profile.savingMedical}
              onStartEditing={profile.startEditingMedical}
              onCancel={profile.cancelEditingMedical}
              onChange={profile.updateMedicalField}
              onAddDisease={profile.addChronicDisease}
              onRemoveDisease={profile.removeChronicDisease}
              onUpdateDisease={profile.updateChronicDisease}
              onSave={() => profile.saveMedical(userId)}
              onRetry={profile.reload}
            />
          ) : null}

          {activeTab === "package" ? (
            <SubscriptionSummarySection
              state={profile.subscriptionState}
              subscription={profile.subscription}
              usageList={profile.usageList}
              onRetry={profile.reload}
            />
          ) : null}

          {activeTab === "security" ? <SecuritySection /> : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.lg,
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  identityText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.dangerBg,
  },
  tabScroll: {
    flex: 1,
  },
  tabBody: {
    padding: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
});
