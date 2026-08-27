import { createElement, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";
import {
  formatDateInputValue,
  getEarliestAllowedBirthDate,
  getLatestAllowedBirthDate,
  parseDateInputValue,
} from "@/src/utils/profileValidation";

type DateOfBirthFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
};

function formatDateLabel(value: string) {
  const parsed = parseDateInputValue(value);
  if (!parsed) return "Chọn ngày sinh";
  return `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`;
}

function initialPickerDate(value: string) {
  return parseDateInputValue(value) ?? new Date(2000, 0, 1);
}

export function DateOfBirthField({ value, onChange, disabled = false, error }: DateOfBirthFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const earliest = getEarliestAllowedBirthDate();
  const latest = getLatestAllowedBirthDate();

  return (
    <View style={styles.fieldGroup}>
      <AppText variant="caption" color={error ? colors.danger : colors.muted}>
        Ngày sinh
      </AppText>

      {Platform.OS === "web"
        ? createElement("input", {
            "aria-label": "Ngày sinh",
            autoComplete: "bday",
            disabled,
            max: latest,
            min: earliest,
            onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value),
            style: {
              boxSizing: "border-box",
              width: "100%",
              minHeight: 48,
              border: `1.5px solid ${error ? colors.danger : colors.lineStrong}`,
              borderRadius: radius.sm,
              background: error ? colors.dangerBg : colors.paper,
              color: colors.ink,
              fontFamily: "inherit",
              fontSize: typography.body.fontSize,
              padding: `0 ${spacing.md}px`,
            },
            type: "date",
            value,
          })
        : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chọn ngày sinh"
              disabled={disabled}
              onPress={() => setShowPicker(true)}
              style={[styles.dateInput, error && styles.dateInputError, disabled && styles.disabled]}
            >
              <AppText color={value ? colors.ink : colors.subtle}>{formatDateLabel(value)}</AppText>
            </Pressable>
            {showPicker ? (
              <DateTimePicker
                value={initialPickerDate(value)}
                mode="date"
                display="default"
                minimumDate={parseDateInputValue(earliest) ?? undefined}
                maximumDate={parseDateInputValue(latest) ?? undefined}
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (event.type === "set" && selectedDate) {
                    onChange(formatDateInputValue(selectedDate));
                  }
                }}
              />
            ) : null}
          </>
        )}

      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : (
        <AppText variant="caption" color={colors.subtle}>
          Tuổi tối đa 100; không thể chọn ngày trong tương lai.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: spacing.sm,
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
  disabled: {
    opacity: 0.62,
  },
});
