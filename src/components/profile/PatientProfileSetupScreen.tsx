// Ported from Web's PersonalPatientProfilePage.jsx — the first-time
// patient profile setup form (Web also has a modal variant,
// PatientProfileSetupModal.jsx, with identical fields/logic; mobile uses a
// full screen since there is no equivalent of a blocking desktop modal
// here). Combines required personal fields with optional medical fields in
// a single always-editable form, unlike the edit-toggle sections on the
// regular Profile screen.
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Plus, ShieldCheck, Trash2 } from "lucide-react-native";

import { AppText, Button, Card, LoadingState, Screen, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { usePatientProfileSetup } from "@/src/hooks/usePatientProfileSetup";
import { ChronicDisease } from "@/src/types/patientProfile";
import { DateOfBirthField } from "./DateOfBirthField";

const BLOOD_TYPES = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PatientProfileSetupScreen() {
  const {
    form,
    loading,
    submitting,
    personalErrors,
    medicalErrors,
    submitError,
    updateField,
    addDisease,
    removeDisease,
    updateDisease,
    submit,
  } = usePatientProfileSetup();
  const [activeDiseasePicker, setActiveDiseasePicker] = useState<{ localId: string; field: "from" | "to" } | null>(null);

  if (loading) {
    return <LoadingState title="Đang tải hồ sơ..." />;
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.headerGroup}>
        <AppText variant="eyebrow" color={colors.teal}>
          Thiết lập hồ sơ
        </AppText>
        <AppText variant="h1">Hoàn thiện hồ sơ sức khỏe</AppText>
        <AppText color={colors.muted}>
          Chỉ nhập những thông tin bạn biết chính xác. Bạn có thể xem lại và cập nhật hồ sơ trong không gian cá nhân bất
          cứ lúc nào.
        </AppText>
      </View>

      <Card variant="hard" style={styles.card}>
        <AppText variant="h3">Thông tin liên hệ</AppText>
        <AppText variant="caption" color={colors.subtle}>
          Bắt buộc
        </AppText>

        <TextField
          label="Họ và tên"
          value={form.displayName}
          onChangeText={(value) => updateField("displayName", value)}
          editable={!submitting}
          error={personalErrors.displayName}
        />

        <DateOfBirthField
          value={form.dateOfBirth}
          onChange={(value) => updateField("dateOfBirth", value)}
          disabled={submitting}
          error={personalErrors.dateOfBirth}
        />

        <View style={styles.fieldGroup}>
          <AppText variant="caption" color={personalErrors.gender ? colors.danger : colors.muted}>
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
                  disabled={submitting}
                  onPress={() => updateField("gender", value)}
                  style={[styles.segment, selected && styles.segmentSelected]}
                >
                  <AppText variant="bodyStrong" color={selected ? colors.white : colors.muted}>
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <TextField
          label="Số điện thoại"
          value={form.phoneNumber}
          onChangeText={(value) => updateField("phoneNumber", value)}
          editable={!submitting}
          keyboardType="phone-pad"
          error={personalErrors.phoneNumber}
        />

        <TextField
          label="Địa chỉ"
          value={form.address}
          onChangeText={(value) => updateField("address", value)}
          editable={!submitting}
          error={personalErrors.address}
        />
      </Card>

      <Card variant="soft" style={styles.card}>
        <AppText variant="h3">Thông tin sức khỏe</AppText>
        <View style={styles.privacyNote}>
          <ShieldCheck size={18} color={colors.teal} />
          <AppText variant="caption" color={colors.muted} style={styles.privacyText}>
            Chỉ nhập khi biết rõ — thông tin sức khỏe nhạy cảm, có thể bỏ qua và bổ sung sau.
          </AppText>
        </View>

        <View style={styles.fieldGroup}>
          <AppText variant="caption" color={colors.muted}>
            Nhóm máu
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bloodTypeRow}>
            {BLOOD_TYPES.map((type) => {
              const selected = form.bloodType === type;
              return (
                <Pressable
                  key={type || "unknown"}
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() => updateField("bloodType", type)}
                  style={[styles.bloodTypeChip, selected && styles.bloodTypeChipSelected]}
                >
                  <AppText variant="bodyStrong" color={selected ? colors.white : colors.muted}>
                    {type || "Chưa rõ"}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.measurementRow}>
          <TextField
            label="Chiều cao (cm)"
            value={form.height}
            onChangeText={(value) => updateField("height", value)}
            editable={!submitting}
            keyboardType="decimal-pad"
            error={medicalErrors.height}
            style={styles.measurementField}
          />
          <TextField
            label="Cân nặng (kg)"
            value={form.weight}
            onChangeText={(value) => updateField("weight", value)}
            editable={!submitting}
            keyboardType="decimal-pad"
            error={medicalErrors.weight}
            style={styles.measurementField}
          />
        </View>

        <TextField
          label="Dị ứng"
          placeholder="Ví dụ: thuốc, thức ăn, phấn hoa"
          value={form.allergyNote}
          onChangeText={(value) => updateField("allergyNote", value)}
          editable={!submitting}
          error={medicalErrors.allergyNote}
          multiline
          numberOfLines={3}
        />
      </Card>

      <Card variant="soft" style={styles.card}>
        <View style={styles.headerRow}>
          <AppText variant="h3">Bệnh nền</AppText>
          <Pressable accessibilityRole="button" onPress={addDisease} disabled={submitting} style={styles.addDiseaseButton}>
            <Plus size={14} color={colors.ink} />
            <AppText variant="bodyStrong">Thêm bệnh nền</AppText>
          </Pressable>
        </View>
        <AppText variant="caption" color={colors.subtle}>
          Mỗi bệnh gồm tên bệnh, khoảng thời gian theo dõi và ghi chú riêng. Bạn có thể bỏ qua nếu không có.
        </AppText>

        {form.chronicDiseases.map((disease: ChronicDisease, index: number) => {
          const nameError = medicalErrors[`chronicDiseases.${index}.diseaseName`];
          const toError = medicalErrors[`chronicDiseases.${index}.to`];
          const noteError = medicalErrors[`chronicDiseases.${index}.note`];

          return (
            <Card key={disease.localId} variant="hard" style={styles.diseaseCard}>
              <View style={styles.headerRow}>
                <AppText variant="bodyStrong">Bệnh nền #{index + 1}</AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xoá bệnh nền"
                  onPress={() => removeDisease(disease.localId)}
                  disabled={submitting}
                  hitSlop={6}
                >
                  <Trash2 size={16} color={colors.danger} />
                </Pressable>
              </View>

              <TextField
                label="Tên bệnh"
                placeholder="Ví dụ: tăng huyết áp"
                value={disease.diseaseName}
                onChangeText={(value) => updateDisease(disease.localId, "diseaseName", value)}
                editable={!submitting}
                error={nameError}
              />

              <View style={styles.dateRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() => setActiveDiseasePicker({ localId: disease.localId, field: "from" })}
                  style={styles.dateChip}
                >
                  <AppText variant="caption" color={colors.muted}>
                    Từ ngày
                  </AppText>
                  <AppText color={disease.from ? colors.ink : colors.subtle}>{disease.from || "Chưa chọn"}</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() => setActiveDiseasePicker({ localId: disease.localId, field: "to" })}
                  style={[styles.dateChip, toError && styles.dateChipError]}
                >
                  <AppText variant="caption" color={colors.muted}>
                    Đến ngày
                  </AppText>
                  <AppText color={disease.to ? colors.ink : colors.subtle}>{disease.to || "Chưa chọn"}</AppText>
                </Pressable>
              </View>
              {toError ? (
                <AppText variant="caption" color={colors.danger}>
                  {toError}
                </AppText>
              ) : null}

              <TextField
                label="Ghi chú"
                value={disease.note}
                onChangeText={(value) => updateDisease(disease.localId, "note", value)}
                editable={!submitting}
                error={noteError}
                multiline
                numberOfLines={2}
              />

              {activeDiseasePicker?.localId === disease.localId ? (
                <DateTimePicker
                  value={disease[activeDiseasePicker.field] ? new Date(disease[activeDiseasePicker.field]) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(event, selectedDate) => {
                    const field = activeDiseasePicker.field;
                    setActiveDiseasePicker(Platform.OS === "ios" ? { localId: disease.localId, field } : null);
                    if (event.type === "set" && selectedDate) {
                      updateDisease(disease.localId, field, toIsoDate(selectedDate));
                    }
                  }}
                />
              ) : null}
            </Card>
          );
        })}
      </Card>

      {submitError ? (
        <AppText color={colors.danger} center>
          {submitError}
        </AppText>
      ) : null}

      <Button fullWidth disabled={submitting} onPress={submit}>
        {submitting ? "Đang lưu hồ sơ..." : "Hoàn tất hồ sơ"}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  headerGroup: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  privacyText: {
    flex: 1,
  },
  bloodTypeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  bloodTypeChip: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paper,
  },
  bloodTypeChipSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  measurementRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  measurementField: {
    flex: 1,
  },
  addDiseaseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  diseaseCard: {
    gap: spacing.md,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateChip: {
    flex: 1,
    gap: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paperSoft,
  },
  dateChipError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
});
