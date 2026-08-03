/**
 * Screen: ChangePasswordScreen
 * Workflow: Authentication
 * API: POST /api/authentication/change-password
 */
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiMessage, AppText, Button, TextField } from "@/src/components/ui";
import { ROUTES } from "@/src/navigation";
import { authService } from "@/src/services";
import { useToast } from "@/src/hooks/useToast";
import { colors, radius, shadows, spacing, typography } from "@/src/theme/tokens";

type ChangePasswordForm = {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
};

const initialForm: ChangePasswordForm = { email: "", otp: "", newPassword: "", confirmNewPassword: "" };
const PASSWORD_HINT = "Tối thiểu 8 ký tự, nên có chữ hoa, chữ thường, số và ký tự đặc biệt.";

export default function ChangePasswordScreen() {
  const { showToast } = useToast();
  const [form, setForm] = useState<ChangePasswordForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update<Key extends keyof ChangePasswordForm>(key: Key, value: ChangePasswordForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setSuccessMessage("");
    setError("");

    if (form.newPassword !== form.confirmNewPassword) {
      setError("Mật khẩu mới nhập lại chưa khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await authService.changePassword(form);
      const text = response?.message || "Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.";
      setSuccessMessage(text);
      showToast({ type: "success", title: "Đã đổi mật khẩu", message: text });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting || !form.email.trim() || !form.otp.trim() || !form.newPassword || !form.confirmNewPassword;

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.brandMark}>
              <AppText variant="h3">+</AppText>
            </View>
            <AppText variant="eyebrow" color={colors.teal}>
              Bảo mật tài khoản
            </AppText>
            <AppText variant="h1" color={colors.white} style={styles.heroTitle}>
              Đặt lại mật khẩu.
            </AppText>
            <AppText color="rgba(255,255,255,0.74)" style={styles.heroCopy}>
              Nhập email, mã xác thực đã nhận và mật khẩu mới để hoàn tất khôi phục tài khoản.
            </AppText>
          </View>

          <View style={styles.formCard}>
            <AppText variant="h2" style={styles.title}>
              Đổi mật khẩu
            </AppText>

            <ApiMessage type="error" message={error} />
            <ApiMessage type="success" message={successMessage} />

            <View style={styles.form}>
              <TextField
                label="Email"
                value={form.email}
                onChangeText={(value) => update("email", value)}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!submitting}
              />

              <TextField
                label="Mã xác thực"
                value={form.otp}
                onChangeText={(value) => update("otp", value)}
                placeholder="Nhập mã đã nhận qua email"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                editable={!submitting}
              />

              <View style={styles.passwordWrap}>
                <TextField
                  label="Mật khẩu mới"
                  value={form.newPassword}
                  onChangeText={(value) => update("newPassword", value)}
                  placeholder="Nhập mật khẩu mới"
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  autoCapitalize="none"
                  autoCorrect={false}
                  hint={PASSWORD_HINT}
                  editable={!submitting}
                  style={styles.passwordInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onPress={() => setShowPassword((current) => !current)}
                  style={styles.passwordToggle}
                >
                  <AppText variant="caption" color={colors.teal}>
                    {showPassword ? "Ẩn" : "Hiện"}
                  </AppText>
                </Pressable>
              </View>

              <TextField
                label="Nhập lại mật khẩu mới"
                value={form.confirmNewPassword}
                onChangeText={(value) => update("confirmNewPassword", value)}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
              />

              <Button fullWidth disabled={disabled} onPress={handleSubmit} style={styles.submitButton}>
                {submitting ? (
                  <View style={styles.loadingLabel}>
                    <ActivityIndicator color={colors.white} size="small" />
                    <AppText variant="bodyStrong" color={colors.white}>
                      Đang đổi...
                    </AppText>
                  </View>
                ) : (
                  "Đổi mật khẩu"
                )}
              </Button>

              <View style={styles.bottomLinks}>
                <Pressable onPress={() => router.push(ROUTES.PUBLIC.FORGOT_PASSWORD)} accessibilityRole="button">
                  <AppText variant="caption" color={colors.teal}>
                    Gửi lại mã
                  </AppText>
                </Pressable>
                <Pressable onPress={() => router.replace(ROUTES.PUBLIC.LOGIN)} accessibilityRole="button">
                  <AppText variant="caption" color={colors.teal}>
                    Đăng nhập
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  hero: {
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    padding: spacing.xl,
  },
  brandMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.md,
    backgroundColor: colors.paper,
  },
  heroTitle: { fontSize: 30, lineHeight: 36 },
  heroCopy: { fontSize: 15, lineHeight: 23 },
  formCard: {
    gap: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
    ...shadows.soft,
  },
  title: { ...(typography.h2 as object) },
  form: { gap: spacing.xl },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 64 },
  passwordToggle: {
    position: "absolute",
    right: spacing.md,
    top: 34,
    minWidth: 44,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  submitButton: { marginTop: spacing.xs },
  loadingLabel: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  bottomLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
});
