/**
 * Screen: LoginScreen
 * APIs:
 * - POST /api/authentication/login
 * - POST /api/authentication/google (when Google Sign-In is configured)
 */
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

import { authService, normalizeAuthSession } from "@/src/services";
import { useAuth } from "@/src/providers";
import { useToast } from "@/src/hooks/useToast";
import { ApiMessage, AppText, Button, TextField } from "@/src/components/ui";
import { getInitialRouteForSession, ROUTES } from "@/src/navigation";
import { colors, radius, shadows, spacing, typography } from "@/src/theme/tokens";
import { isValidEmail } from "@/src/utils";
import { env, isGoogleAuthConfigured } from "@/src/config/env";

type LoginErrors = {
  email?: string;
  password?: string;
};

// Matches Web: only required + email-format are enforced client-side.
// Password length is not gated here — Web only shows a hint, backend is
// the source of truth for password policy.
function validateLoginForm(email: string, password: string) {
  const errors: LoginErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Vui lòng nhập email.";
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = "Email chưa đúng định dạng.";
  }

  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  }

  return errors;
}

const PASSWORD_HINT = "Tối thiểu 8 ký tự, nên có chữ hoa, chữ thường, số và ký tự đặc biệt.";

export default function LoginScreen() {
  const { isRestoring, session, setSession } = useAuth();
  const { showToast } = useToast();
  const googleLoginEnabled = isGoogleAuthConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const disabled = useMemo(() => submitting || googleSubmitting || !email.trim() || !password, [email, password, googleSubmitting, submitting]);
  const googleDisabled = submitting || googleSubmitting || !googleLoginEnabled;

  useEffect(() => {
    if (!isRestoring && session) {
      router.replace(getInitialRouteForSession(session));
    }
  }, [isRestoring, session]);

  useEffect(() => {
    if (!googleLoginEnabled) return;

    GoogleSignin.configure({
      webClientId: env.googleWebClientId,
      iosClientId: env.googleIosClientId || undefined,
      scopes: ["profile", "email"],
      offlineAccess: false,
    });
  }, [googleLoginEnabled]);

  async function handleLogin() {
    const nextErrors = validateLoginForm(email, password);
    setErrors(nextErrors);
    setApiError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      });
      const nextSession = normalizeAuthSession(response);

      if (!nextSession?.accessToken) {
        throw new Error("Backend chưa trả access token. Vui lòng thử lại.");
      }

      await setSession(nextSession);
      showToast({ type: "success", title: "Đăng nhập thành công", message: "Đang mở không gian phù hợp với tài khoản của bạn." });
      router.replace(getInitialRouteForSession(nextSession));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setApiError("");

    if (!googleLoginEnabled) {
      setApiError("Dang nhap Google chua duoc cau hinh. Hay them EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.");
      return;
    }

    setGoogleSubmitting(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut().catch(() => null);

      const result = await GoogleSignin.signIn();
      if (result.type === "cancelled") {
        setGoogleSubmitting(false);
        return;
      }

      const idToken = result.data.idToken || (await GoogleSignin.getTokens()).idToken;
      if (!idToken) {
        throw new Error("Google chua tra idToken. Kiem tra webClientId va Android OAuth SHA-1 trong Google Cloud.");
      }

      const response = await authService.googleLogin(idToken);
      const nextSession = normalizeAuthSession(response);

      if (!nextSession?.accessToken) {
        throw new Error("Backend chua tra access token. Vui long thu lai.");
      }

      await setSession(nextSession);
      showToast({
        type: "success",
        title: "Dang nhap Google thanh cong",
        message: "Dang mo khong gian phu hop voi tai khoan cua ban.",
      });
      router.replace(getInitialRouteForSession(nextSession));
    } catch (error) {
      const errorCode = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (errorCode === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      if (errorCode === statusCodes.IN_PROGRESS) {
        setApiError("Google Sign-In dang duoc xu ly. Vui long cho trong giay lat.");
        return;
      }
      if (errorCode === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setApiError("Thiet bi chua co Google Play Services hoac can cap nhat.");
        return;
      }
      if (errorCode === "10" || errorCode === "DEVELOPER_ERROR") {
        setApiError(
          "Google Sign-In bi DEVELOPER_ERROR. Kiem tra Android OAuth client: package com.medimate.medicalaiassistant, SHA-1 debug, va Web Client ID dung de lay idToken.",
        );
        return;
      }

      const message = error instanceof Error ? error.message : "";
      if (message.includes("DEVELOPER_ERROR")) {
        setApiError(
          "Google Sign-In bi DEVELOPER_ERROR. Kiem tra Android OAuth client: package com.medimate.medicalaiassistant, SHA-1 debug, va Web Client ID dung de lay idToken.",
        );
        return;
      }
      if (message.includes("RNGoogleSignin") || message.includes("native module")) {
        setApiError("Google Sign-In native can development build. Hay chay npx expo run:android thay vi Expo Go.");
        return;
      }

      setApiError(message || "Dang nhap Google that bai. Vui long thu lai.");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <AppText variant="h3" color={colors.ink}>
                  +
                </AppText>
              </View>
              <View>
                <AppText variant="bodyStrong" color={colors.white}>
                  MediMate AI
                </AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.62)">
                  Sức khỏe cá nhân
                </AppText>
              </View>
            </View>

            <View style={styles.heroCopyGroup}>
              <AppText variant="eyebrow" color={colors.teal}>
                Welcome back
              </AppText>
              <AppText variant="h1" color={colors.white} style={styles.heroTitle}>
                Tiếp tục hành trình chăm sóc sức khỏe.
              </AppText>
              <AppText color="rgba(255,255,255,0.74)" style={styles.heroCopy}>
                Đăng nhập để mở hồ sơ cá nhân, gợi ý chuyên khoa và các bước theo dõi phù hợp.
              </AppText>
            </View>

            <View style={styles.heroChips}>
              {["Bảo mật", "AI hỗ trợ", "Hồ sơ sức khỏe"].map((item) => (
                <View key={item} style={styles.heroChip}>
                  <AppText variant="caption" color={colors.white}>
                    {item}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.header}>
              <AppText variant="h2" style={styles.title}>
                Đăng nhập
              </AppText>
              <AppText color={colors.muted}>Nhập thông tin tài khoản MediMate AI của bạn.</AppText>
            </View>

            <ApiMessage type="error" message={apiError} />

            <Button
              variant="secondary"
              fullWidth
              disabled={googleDisabled}
              onPress={handleGoogleLogin}
              style={styles.googleButton}
            >
              {googleSubmitting ? (
                <View style={styles.loadingLabel}>
                  <ActivityIndicator color={colors.ink} size="small" />
                  <AppText variant="bodyStrong" color={colors.ink}>
                    Dang mo Google...
                  </AppText>
                </View>
              ) : (
                <View style={styles.googleLabel}>
                  <View style={styles.googleMark}>
                    <AppText variant="bodyStrong" color={colors.teal}>
                      G
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    Tiep tuc voi Google
                  </AppText>
                </View>
              )}
            </Button>

            {!googleLoginEnabled ? (
              <View style={styles.inlineNote}>
                <AppText variant="caption" color={colors.subtle} style={styles.noteText}>
                  Đăng nhập Google chưa được cấu hình cho ứng dụng di động. Bạn vẫn có thể đăng nhập bằng email và mật khẩu.
                </AppText>
              </View>
            ) : null}

            <View style={styles.form}>
              <TextField
                label="Email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
                }}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                error={errors.email}
                editable={!submitting}
              />

              <View style={styles.passwordWrap}>
                <TextField
                  label="Mật khẩu"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
                  }}
                  placeholder="Nhập mật khẩu"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.password}
                  hint={errors.password ? undefined : PASSWORD_HINT}
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

              <View style={styles.forgotRow}>
                <AppText variant="caption" color={colors.subtle} style={styles.noteText}>
                  Thông tin đăng nhập chỉ được dùng để mở tài khoản của bạn.
                </AppText>
                <Pressable onPress={() => router.push(ROUTES.PUBLIC.FORGOT_PASSWORD)} accessibilityRole="button">
                  <AppText variant="caption" color={colors.teal}>
                    Quên mật khẩu?
                  </AppText>
                </Pressable>
              </View>

              <Button fullWidth disabled={disabled} onPress={handleLogin} style={styles.submitButton}>
                {submitting ? (
                  <View style={styles.loadingLabel}>
                    <ActivityIndicator color={colors.white} size="small" />
                    <AppText variant="bodyStrong" color={colors.white}>
                      Đang đăng nhập...
                    </AppText>
                  </View>
                ) : (
                  "Đăng nhập"
                )}
              </Button>

              <View style={styles.bottomLink}>
                <AppText variant="caption" color={colors.muted}>
                  Chưa có tài khoản?
                </AppText>
                <Pressable onPress={() => router.push(ROUTES.PUBLIC.REGISTER)} accessibilityRole="button">
                  <AppText variant="caption" color={colors.teal}>
                    Tạo tài khoản miễn phí
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
  keyboard: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  hero: {
    gap: spacing["2xl"],
    minHeight: 300,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(17,20,18,0.28)",
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    padding: spacing.xl,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
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
  heroCopyGroup: {
    gap: spacing.md,
    maxWidth: 330,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 39,
  },
  heroCopy: {
    fontSize: 15,
    lineHeight: 23,
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  heroChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
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
  header: {
    gap: spacing.sm,
  },
  title: {
    ...(typography.h2 as object),
  },
  form: {
    gap: spacing.xl,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 64,
  },
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
  submitButton: {
    marginTop: spacing.xs,
  },
  googleButton: {
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
  },
  googleLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  googleMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperSoft,
  },
  inlineNote: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  forgotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  noteText: {
    flexShrink: 1,
    fontWeight: "600",
  },
  loadingLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  bottomLink: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
