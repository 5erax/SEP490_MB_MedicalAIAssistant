/**
 * Screen: LoginScreen
 * APIs:
 * - POST /api/authentication/login
 */
import { useMemo, useState } from "react";
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

import { authService } from "@/src/services";
import { AuthSession } from "@/src/types";
import { useAuth } from "@/src/providers";
import { ApiMessage, AppText, Button, TextField } from "@/src/components/ui";
import { colors, radius, shadows, spacing, typography } from "@/src/theme/tokens";

type LoginErrors = {
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeLoginSession(response: Awaited<ReturnType<typeof authService.login>>) {
  return (response.data ?? response) as AuthSession;
}

function validateLoginForm(email: string, password: string) {
  const errors: LoginErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Vui long nhap email.";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Email chua dung dinh dang.";
  }

  if (!password) {
    errors.password = "Vui long nhap mat khau.";
  } else if (password.length < 6) {
    errors.password = "Mat khau can co toi thieu 6 ky tu.";
  }

  return errors;
}

export default function LoginScreen() {
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const disabled = useMemo(() => submitting || !email.trim() || !password, [email, password, submitting]);

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
      const session = normalizeLoginSession(response);

      if (!session?.accessToken) {
        throw new Error("Backend chua tra access token. Vui long thu lai.");
      }

      await setSession(session);
      router.replace("/(tabs)");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Dang nhap that bai. Vui long thu lai.");
    } finally {
      setSubmitting(false);
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
                  Suc khoe ca nhan
                </AppText>
              </View>
            </View>

            <View style={styles.heroCopyGroup}>
              <AppText variant="eyebrow" color={colors.lime}>
                Welcome back
              </AppText>
              <AppText variant="h1" color={colors.white} style={styles.heroTitle}>
                Tiep tuc hanh trinh cham soc suc khoe.
              </AppText>
              <AppText color="rgba(255,255,255,0.74)" style={styles.heroCopy}>
                Dang nhap de mo ho so ca nhan, goi y chuyen khoa va cac buoc theo doi phu hop.
              </AppText>
            </View>

            <View style={styles.heroChips}>
              {["Bao mat", "AI ho tro", "Ho so suc khoe"].map((item) => (
                <View key={item} style={styles.heroChip}>
                  <AppText variant="caption" color={colors.lime}>
                    {item}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.header}>
              <AppText variant="h2" style={styles.title}>
                Dang nhap
              </AppText>
              <AppText color={colors.muted}>Nhap thong tin tai khoan MediMate AI cua ban.</AppText>
            </View>

            <ApiMessage type="error" message={apiError} />

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
                  label="Mat khau"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
                  }}
                  placeholder="Nhap mat khau"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.password}
                  editable={!submitting}
                  style={styles.passwordInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "An mat khau" : "Hien mat khau"}
                  onPress={() => setShowPassword((current) => !current)}
                  style={styles.passwordToggle}
                >
                  <AppText variant="caption" color={colors.teal}>
                    {showPassword ? "An" : "Hien"}
                  </AppText>
                </Pressable>
              </View>

              <Button fullWidth disabled={disabled} onPress={handleLogin} style={styles.submitButton}>
                {submitting ? (
                  <View style={styles.loadingLabel}>
                    <ActivityIndicator color={colors.ink} size="small" />
                    <AppText variant="bodyStrong">Dang dang nhap...</AppText>
                  </View>
                ) : (
                  "Dang nhap"
                )}
              </Button>

              <View style={styles.inlineNote}>
                <AppText variant="caption" color={colors.subtle} style={styles.noteText}>
                  Thong tin dang nhap chi duoc dung de mo tai khoan cua ban.
                </AppText>
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
    paddingTop: spacing.md,
    paddingBottom: spacing["4xl"],
  },
  hero: {
    gap: spacing["2xl"],
    minHeight: 300,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.xl,
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
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.lime,
    ...shadows.hard,
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
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  formCard: {
    gap: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.xl,
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
  inlineNote: {
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  noteText: {
    fontWeight: "600",
  },
  loadingLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
});
