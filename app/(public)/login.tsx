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

import { authService } from "@/src/services";
import { AuthSession } from "@/src/types";
import { useAuth } from "@/src/providers";
import { ApiMessage, AppText, Button, Card, TextField } from "@/src/components/ui";
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <AppText variant="h3" color={colors.ink}>
              +
            </AppText>
          </View>
          <AppText variant="bodyStrong">MediMate AI</AppText>
        </View>

        <View style={styles.heroPanel}>
          <AppText variant="eyebrow" color={colors.lime}>
            MediMate AI
          </AppText>
          <AppText variant="h2" color={colors.white} style={styles.heroTitle}>
            Mot noi gon gang cho hanh trinh di kham
          </AppText>
          <AppText color="rgba(255,255,255,0.76)" style={styles.heroCopy}>
            Nhap trieu chung, luu ho so, xem chuyen khoa phu hop va chuan bi tot hon truoc khi den co so y te.
          </AppText>

          <View style={styles.stepList}>
            {["Ho so ca nhan", "Goi y chuyen khoa", "Theo doi sau kham"].map((item, index) => (
              <View key={item} style={styles.stepItem}>
                <AppText variant="caption" color={colors.lime}>
                  {String(index + 1).padStart(2, "0")}
                </AppText>
                <AppText variant="bodyStrong" color={colors.white}>
                  {item}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.header}>
            <AppText variant="eyebrow" color={colors.limeDark}>
              MediMate AI
            </AppText>
            <AppText variant="h2" style={styles.title}>
              Dang nhap de tiep tuc cham soc suc khoe cua ban.
            </AppText>
            <AppText color={colors.muted}>
              Mo ho so ca nhan, xem lai thong tin da luu va tiep tuc cac buoc theo doi phu hop.
            </AppText>
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

            <View style={styles.inlineNote}>
              <AppText variant="caption" color={colors.subtle} style={styles.noteText}>
                Thong tin dang nhap chi duoc dung de mo tai khoan cua ban.
              </AppText>
            </View>

            <Button fullWidth disabled={disabled} onPress={handleLogin}>
              {submitting ? (
                <View style={styles.loadingLabel}>
                  <ActivityIndicator color={colors.ink} size="small" />
                  <AppText variant="bodyStrong">Dang dang nhap...</AppText>
                </View>
              ) : (
                "Dang nhap"
              )}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
    paddingBottom: spacing["4xl"],
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
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
  heroPanel: {
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.xl,
    backgroundColor: colors.ink,
    padding: spacing.xl,
  },
  heroTitle: {
    maxWidth: 320,
  },
  heroCopy: {
    maxWidth: 330,
  },
  stepList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stepItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: spacing.md,
  },
  formCard: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    ...(typography.h2 as object),
  },
  form: {
    gap: spacing.lg,
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
