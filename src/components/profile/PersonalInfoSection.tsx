import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { UserRound } from "lucide-react-native";

import { AppText, Button, Card, EmptyState, LoadingState, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { PersonalProfileErrors, PersonalProfileForm } from "@/src/utils/profileValidation";

const GENDER_OPTIONS: { value: PersonalProfileForm["gender"]; label: string }[] = [
  { value: "1", label: "Nam" },
  { value: "2", label: "Nữ" },
  { value: "0", label: "Khác" },
];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  if (!value) return "Chọn ngày sinh";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

type PersonalInfoSectionProps = {
  state: "loading" | "ready" | "error";
  email: string;
  form: PersonalProfileForm;
  errors: PersonalProfileErrors;
  saveError: string;
  isEditing: boolean;
  saving: boolean;
  onStartEditing: () => void;
  onCancel: () => void;
  onChange: <K extends keyof PersonalProfileForm>(key: K, value: PersonalProfileForm[K]) => void;
  onSave: () => void;
  onRetry: () => void;
};

export function PersonalInfoSection({
  state,
  email,
  form,
  errors,
  saveError,
  isEditing,
  saving,
  onStartEditing,
  onCancel,
  onChange,
  onSave,
  onRetry,
}: PersonalInfoSectionProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (state === "loading") {
    return <LoadingState title="Đang tải thông tin cá nhân..." />;
  }

  if (state === "error") {
    return (
      <Card variant="soft" style={styles.card}>
        <EmptyState title="Không thể tải thông tin cá nhân" description="Dữ liệu hiện chưa khả dụng." />
        <Button variant="secondary" onPress={onRetry}>
          Thử lại
        </Button>
      </Card>
    );
  }

  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitle}>
          <View style={styles.iconMark}>
            <UserRound size={18} color={colors.teal} />
          </View>
          <AppText variant="h3">Thông tin cá nhân</AppText>
        </View>
        {!isEditing ? (
          <Button variant="secondary" size="sm" onPress={onStartEditing}>
            Chỉnh sửa
          </Button>
        ) : null}
      </View>

      <TextField label="Họ và tên" value={form.displayName} onChangeText={(value) => onChange("displayName", value)} editable={isEditing && !saving} error={errors.displayName} />

      <TextField label="Email" value={email} editable={false} hint="Không thể đổi" />

      <View style={styles.fieldGroup}>
        <AppText variant="caption" color={errors.gender ? colors.danger : colors.muted}>
          Giới tính
        </AppText>
        <View style={styles.segmented}>
          {GENDER_OPTIONS.map(({ value, label }) => {
            const selected = form.gender === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                disabled={!isEditing || saving}
                onPress={() => onChange("gender", value)}
                style={[styles.segment, selected && styles.segmentSelected]}
              >
                <AppText variant="bodyStrong" color={selected ? colors.white : colors.muted}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {errors.gender ? (
          <AppText variant="caption" color={colors.danger}>
            {errors.gender}
          </AppText>
        ) : null}
      </View>

      <View style={styles.fieldGroup}>
        <AppText variant="caption" color={errors.dateOfBirth ? colors.danger : colors.muted}>
          Ngày sinh
        </AppText>
        <Pressable
          accessibilityRole="button"
          disabled={!isEditing || saving}
          onPress={() => setShowDatePicker(true)}
          style={[styles.dateInput, errors.dateOfBirth && styles.dateInputError]}
        >
          <AppText color={form.dateOfBirth ? colors.ink : colors.subtle}>{formatDateLabel(form.dateOfBirth)}</AppText>
        </Pressable>
        {errors.dateOfBirth ? (
          <AppText variant="caption" color={colors.danger}>
            {errors.dateOfBirth}
          </AppText>
        ) : null}
        {showDatePicker ? (
          <DateTimePicker
            value={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === "ios");
              if (event.type === "set" && selectedDate) {
                onChange("dateOfBirth", toIsoDate(selectedDate));
              }
            }}
          />
        ) : null}
      </View>

      <TextField
        label="Số điện thoại"
        value={form.phoneNumber}
        onChangeText={(value) => onChange("phoneNumber", value)}
        editable={isEditing && !saving}
        keyboardType="phone-pad"
        error={errors.phoneNumber}
      />

      <TextField
        label="Địa chỉ"
        value={form.address}
        onChangeText={(value) => onChange("address", value)}
        editable={isEditing && !saving}
        error={errors.address}
      />

      {saveError ? (
        <AppText color={colors.danger} variant="caption">
          {saveError}
        </AppText>
      ) : null}

      {isEditing ? (
        <View style={styles.actions}>
          <Button variant="secondary" onPress={onCancel} disabled={saving} style={styles.actionButton}>
            Huỷ
          </Button>
          <Button onPress={onSave} disabled={saving} style={styles.actionButton}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.mint,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  segmented: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.paperSoft,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
  },
  segmentSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  dateInput: {
    minHeight: 48,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  dateInputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
