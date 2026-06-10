/**
 * Screen: RegisterScreen
 * Workflow: Authentication
 * API: POST /api/authentication/register
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

import { ApiMessage, AppText, Button, TextField } from "@/src/components/ui";
import { ROUTES } from "@/src/navigation";
import { authService, RegisterPayload } from "@/src/services";
import { colors, radius, shadows, spacing, typography } from "@/src/theme/tokens";
import { isValidEmail } from "@/src/utils";

type RegisterForm = {
  displayName: string;
  email: string;
  userName: string;
  address: string;
  gender: "1" | "2";
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
};

type RegisterErrors = Partial<Record<keyof RegisterForm | "accepted", string>>;

const initialForm: RegisterForm = {
  displayName: "",
  email: "",
  userName: "",
  address: "",
  gender: "1",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",
};

function validateRegisterForm(form: RegisterForm, accepted: boolean) {
  const errors: RegisterErrors = {};

  if (!form.displayName.trim()) errors.displayName = "Vui lòng nhập họ tên.";
  if (!form.email.trim()) {
    errors.email = "Vui lòng nhập email.";
  } else if (!isValidEmail(form.email)) {
    errors.email = "Email chưa đúng định dạng.";
  }
  if (!form.userName.trim()) errors.userName = "Vui lòng nhập tên đăng nhập.";
  if (!form.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (form.password.length < 6) {
    errors.password = "Mật khẩu cần có tối thiểu 6 ký tự.";
  }
  if (!form.confirmPassword) {
    errors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
  }
  if (form.dateOfBirth.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())) {
    errors.dateOfBirth = "Ngày sinh cần có định dạng YYYY-MM-DD.";
  }
  if (!accepted) {
    errors.accepted = "Bạn cần đồng ý điều khoản sử dụng và lưu ý y tế.";
  }

  return errors;
}

function buildRegisterPayload(form: RegisterForm): RegisterPayload {
  return {
    email: form.email.trim(),
    userName: form.userName.trim(),
    displayName: form.displayName.trim(),
    address: form.address.trim(),
    gender: Number(form.gender),
    dateOfBirth: form.dateOfBirth.trim() || null,
    password: form.password,
    confirmPassword: form.confirmPassword,
  };
}

export default function RegisterScreen() {
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const disabled = useMemo(() => submitting, [submitting]);

  function updateField<Key extends keyof RegisterForm>(key: Key, value: RegisterForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  async function handleRegister() {
    const nextErrors = validateRegisterForm(form, accepted);
    setErrors(nextErrors);
    setApiError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await authService.register(buildRegisterPayload(form));
      router.replace(ROUTES.PUBLIC.LOGIN);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Tạo tài khoản thất bại. Vui lòng thử lại.");
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
                <AppText variant="h3">+</AppText>
              </View>
              <View>
                <AppText variant="bodyStrong" color={colors.white}>
                  MediMate AI
                </AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.62)">
                  Bắt đầu miễn phí
                </AppText>
              </View>
            </View>

            <View style={styles.heroCopyGroup}>
              <AppText variant="eyebrow" color={colors.lime}>
                Tài khoản mới
              </AppText>
              <AppText variant="h1" color={colors.white} style={styles.heroTitle}>
                Tạo hồ sơ sức khỏe cá nhân của bạn.
              </AppText>
              <AppText color="rgba(255,255,255,0.74)" style={styles.heroCopy}>
                Chỉ cần vài thông tin cơ bản để MediMate AI cá nhân hóa trải nghiệm chăm sóc sức khỏe.
              </AppText>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.header}>
              <AppText variant="h2" style={styles.title}>
                Tạo tài khoản
              </AppText>
              <AppText color={colors.muted}>Điền thông tin giống luồng đăng ký trên Web MediMate AI.</AppText>
            </View>

            <ApiMessage type="error" message={apiError} />

            <View style={styles.form}>
              <TextField
                label="Họ tên"
                value={form.displayName}
                onChangeText={(value) => updateField("displayName", value)}
                placeholder="Nguyễn Văn A"
                textContentType="name"
                error={errors.displayName}
                editable={!submitting}
              />

              <TextField
                label="Email"
                value={form.email}
                onChangeText={(value) => updateField("email", value)}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                error={errors.email}
                editable={!submitting}
              />

              <TextField
                label="Tên đăng nhập"
                value={form.userName}
                onChangeText={(value) => updateField("userName", value)}
                placeholder="ten_dang_nhap"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                error={errors.userName}
                editable={!submitting}
              />

              <TextField
                label="Địa chỉ"
                value={form.address}
                onChangeText={(value) => updateField("address", value)}
                placeholder="Địa chỉ liên hệ"
                error={errors.address}
                editable={!submitting}
              />

              <View style={styles.fieldGroup}>
                <AppText variant="caption" color={colors.muted}>
                  Giới tính
                </AppText>
                <View style={styles.segmented}>
                  {[
                    ["1", "Nam"],
                    ["2", "Nữ"],
                  ].map(([value, label]) => {
                    const selected = form.gender === value;
                    return (
                      <Pressable
                        key={value}
                        accessibilityRole="button"
                        onPress={() => updateField("gender", value as RegisterForm["gender"])}
                        style={[styles.segment, selected && styles.segmentSelected]}
                      >
                        <AppText variant="bodyStrong" color={selected ? colors.ink : colors.muted}>
                          {label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <TextField
                label="Ngày sinh"
                value={form.dateOfBirth}
                onChangeText={(value) => updateField("dateOfBirth", value)}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                error={errors.dateOfBirth}
                editable={!submitting}
              />

              <View style={styles.passwordWrap}>
                <TextField
                  label="Mật khẩu"
                  value={form.password}
                  onChangeText={(value) => updateField("password", value)}
                  placeholder="Nhập mật khẩu"
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.password}
                  editable={!submitting}
                  style={styles.passwordInput}
                />
                <PasswordToggle visible={showPassword} onPress={() => setShowPassword((current) => !current)} />
              </View>

              <View style={styles.passwordWrap}>
                <TextField
                  label="Xác nhận mật khẩu"
                  value={form.confirmPassword}
                  onChangeText={(value) => updateField("confirmPassword", value)}
                  placeholder="Nhập lại mật khẩu"
                  secureTextEntry={!showConfirmPassword}
                  textContentType="newPassword"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.confirmPassword}
                  editable={!submitting}
                  style={styles.passwordInput}
                />
                <PasswordToggle
                  visible={showConfirmPassword}
                  onPress={() => setShowConfirmPassword((current) => !current)}
                />
              </View>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: accepted }}
                onPress={() => {
                  setAccepted((current) => !current);
                  if (errors.accepted) setErrors((current) => ({ ...current, accepted: undefined }));
                }}
                style={[styles.consent, errors.accepted && styles.consentError]}
              >
                <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                  {accepted ? (
                    <AppText variant="caption" color={colors.ink}>
                      ✓
                    </AppText>
                  ) : null}
                </View>
                <AppText variant="caption" color={colors.muted} style={styles.consentText}>
                  Tôi đồng ý với điều khoản sử dụng và hiểu MediMate AI không thay thế bác sĩ.
                </AppText>
              </Pressable>
              {errors.accepted ? (
                <AppText variant="caption" color={colors.danger}>
                  {errors.accepted}
                </AppText>
              ) : null}

              <Button fullWidth disabled={disabled} onPress={handleRegister} style={styles.submitButton}>
                {submitting ? (
                  <View style={styles.loadingLabel}>
                    <ActivityIndicator color={colors.ink} size="small" />
                    <AppText variant="bodyStrong">Đang tạo tài khoản...</AppText>
                  </View>
                ) : (
                  "Tạo tài khoản"
                )}
              </Button>

              <View style={styles.bottomLink}>
                <AppText variant="caption" color={colors.muted}>
                  Đã có tài khoản?
                </AppText>
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

function PasswordToggle({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      onPress={onPress}
      style={styles.passwordToggle}
    >
      <AppText variant="caption" color={colors.teal}>
        {visible ? "Ẩn" : "Hiện"}
      </AppText>
    </Pressable>
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
  },
  heroTitle: {
    fontSize: 33,
    lineHeight: 38,
  },
  heroCopy: {
    fontSize: 15,
    lineHeight: 23,
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
  fieldGroup: {
    gap: spacing.sm,
  },
  segmented: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: radius.sm,
  },
  segmentSelected: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.lime,
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
  consent: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  consentError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  checkbox: {
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 7,
    backgroundColor: colors.paper,
  },
  checkboxChecked: {
    backgroundColor: colors.lime,
  },
  consentText: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.xs,
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
