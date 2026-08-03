/**
 * Screen: ForgotPasswordScreen
 * Workflow: Authentication
 * API: POST /api/authentication/forgot-password
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
import { isValidEmail } from "@/src/utils";

export default function ForgotPasswordScreen() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    setSuccessMessage("");
    setError("");

    if (!trimmedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError("Email chưa đúng định dạng.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await authService.forgotPassword(trimmedEmail);
      const text = response?.message || "Nếu email hợp lệ, hướng dẫn khôi phục sẽ được gửi đến bạn.";
      setSuccessMessage(text);
      showToast({ type: "success", title: "Đã gửi hướng dẫn", message: text });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể gửi yêu cầu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

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
              Khôi phục quyền truy cập.
            </AppText>
            <AppText color="rgba(255,255,255,0.74)" style={styles.heroCopy}>
              Nhập email gắn với tài khoản. Nếu thông tin hợp lệ, hệ thống sẽ gửi hướng dẫn khôi phục cho bạn.
            </AppText>
          </View>

          <View style={styles.formCard}>
            <AppText variant="h2" style={styles.title}>
              Quên mật khẩu
            </AppText>

            <ApiMessage type="error" message={error} />
            <ApiMessage type="success" message={successMessage} />

            <View style={styles.form}>
              <TextField
                label="Email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (error) setError("");
                }}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!submitting}
              />

              <View style={styles.inlineNote}>
                <AppText variant="caption" color={colors.subtle}>
                  Sau khi nhận hướng dẫn, dùng mã xác thực ở bước đặt lại mật khẩu.
                </AppText>
              </View>

              <Button fullWidth disabled={submitting || !email.trim()} onPress={handleSubmit} style={styles.submitButton}>
                {submitting ? (
                  <View style={styles.loadingLabel}>
                    <ActivityIndicator color={colors.white} size="small" />
                    <AppText variant="bodyStrong" color={colors.white}>
                      Đang gửi...
                    </AppText>
                  </View>
                ) : (
                  "Gửi hướng dẫn"
                )}
              </Button>

              <View style={styles.bottomLinks}>
                <Pressable onPress={() => router.push(ROUTES.PUBLIC.CHANGE_PASSWORD)} accessibilityRole="button">
                  <AppText variant="caption" color={colors.teal}>
                    Tôi đã có mã xác thực
                  </AppText>
                </Pressable>
                <Pressable onPress={() => router.replace(ROUTES.PUBLIC.LOGIN)} accessibilityRole="button">
                  <AppText variant="caption" color={colors.teal}>
                    Quay lại đăng nhập
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
    borderWidth: 1,
    borderColor: "rgba(17,20,18,0.28)",
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    padding: spacing.xl,
  },
  brandMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.md,
    backgroundColor: colors.paper,
  },
  heroTitle: { fontSize: 30, lineHeight: 36 },
  heroCopy: { fontSize: 15, lineHeight: 23 },
  formCard: {
    gap: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(17,20,18,0.18)",
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
    ...shadows.soft,
  },
  title: { ...(typography.h2 as object) },
  form: { gap: spacing.xl },
  inlineNote: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
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
