import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { HeartPulse, Plus, ShieldCheck, Trash2 } from "lucide-react-native";

import { AppText, Button, Card, EmptyState, LoadingState, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ChronicDisease } from "@/src/types/patientProfile";
import { MedicalProfileErrors, MedicalProfileForm } from "@/src/utils/profileValidation";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DiseaseRow({
  disease,
  index,
  errors,
  isEditing,
  saving,
  onChange,
  onRemove,
}: {
  disease: ChronicDisease;
  index: number;
  errors: MedicalProfileErrors;
  isEditing: boolean;
  saving: boolean;
  onChange: (key: keyof Omit<ChronicDisease, "localId">, value: string) => void;
  onRemove: () => void;
}) {
  const [activePicker, setActivePicker] = useState<"from" | "to" | null>(null);
  const nameError = errors[`chronicDiseases.${index}.diseaseName`];
  const toError = errors[`chronicDiseases.${index}.to`];
  const noteError = errors[`chronicDiseases.${index}.note`];

  return (
    <Card variant="hard" style={styles.diseaseCard}>
      <View style={styles.diseaseHeader}>
        <AppText variant="bodyStrong">Bệnh nền #{index + 1}</AppText>
        {isEditing ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Xoá bệnh nền" onPress={onRemove} disabled={saving} hitSlop={6}>
            <Trash2 size={16} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>

      <TextField
        label="Tên bệnh"
        placeholder="Ví dụ: hen suyễn, tăng huyết áp"
        value={disease.diseaseName}
        onChangeText={(value) => onChange("diseaseName", value)}
        editable={isEditing && !saving}
        error={nameError}
      />

      <View style={styles.dateRow}>
        <Pressable
          accessibilityRole="button"
          disabled={!isEditing || saving}
          onPress={() => setActivePicker("from")}
          style={styles.dateChip}
        >
          <AppText variant="caption" color={colors.muted}>
            Từ ngày
          </AppText>
          <AppText color={disease.from ? colors.ink : colors.subtle}>{disease.from || "Chưa chọn"}</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!isEditing || saving}
          onPress={() => setActivePicker("to")}
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
        onChangeText={(value) => onChange("note", value)}
        editable={isEditing && !saving}
        error={noteError}
        multiline
        numberOfLines={2}
      />

      {activePicker ? (
        <DateTimePicker
          value={disease[activePicker] ? new Date(disease[activePicker]) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selectedDate) => {
            setActivePicker(Platform.OS === "ios" ? activePicker : null);
            if (event.type === "set" && selectedDate) {
              onChange(activePicker, toIsoDate(selectedDate));
            }
          }}
        />
      ) : null}
    </Card>
  );
}

type MedicalProfileSectionProps = {
  state: "loading" | "ready" | "error";
  form: MedicalProfileForm;
  errors: MedicalProfileErrors;
  saveError: string;
  isEditing: boolean;
  saving: boolean;
  onStartEditing: () => void;
  onCancel: () => void;
  onChange: <K extends keyof MedicalProfileForm>(key: K, value: MedicalProfileForm[K]) => void;
  onAddDisease: () => void;
  onRemoveDisease: (localId: string) => void;
  onUpdateDisease: (localId: string, key: keyof Omit<ChronicDisease, "localId">, value: string) => void;
  onSave: () => void;
  onRetry: () => void;
};

export function MedicalProfileSection({
  state,
  form,
  errors,
  saveError,
  isEditing,
  saving,
  onStartEditing,
  onCancel,
  onChange,
  onAddDisease,
  onRemoveDisease,
  onUpdateDisease,
  onSave,
  onRetry,
}: MedicalProfileSectionProps) {
  if (state === "loading") {
    return <LoadingState title="Đang tải hồ sơ y tế..." />;
  }

  if (state === "error") {
    return (
      <Card variant="soft" style={styles.card}>
        <EmptyState title="Không thể tải hồ sơ y tế" description="Dữ liệu hiện chưa khả dụng." />
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
          <View style={styles.headerIconMark}>
            <HeartPulse size={18} color={colors.teal} />
          </View>
          <AppText variant="h3">Hồ sơ y tế</AppText>
        </View>
        {!isEditing ? (
          <Button variant="secondary" size="sm" onPress={onStartEditing}>
            Chỉnh sửa
          </Button>
        ) : null}
      </View>

      <View style={styles.privacyNote}>
        <ShieldCheck size={18} color={colors.teal} />
        <AppText variant="caption" color={colors.muted} style={styles.privacyText}>
          Dữ liệu sức khỏe nhạy cảm — thông tin này hỗ trợ cá nhân hóa tư vấn. Chỉ nhập dữ liệu bạn biết chính xác.
        </AppText>
      </View>

      <View style={styles.fieldGroup}>
        <AppText variant="caption" color={colors.muted}>
          Nhóm máu
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bloodTypeRow}>
          {["", ...BLOOD_TYPES].map((type) => {
            const selected = form.bloodType === type;
            return (
              <Pressable
                key={type || "unknown"}
                accessibilityRole="button"
                disabled={!isEditing || saving}
                onPress={() => onChange("bloodType", type)}
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
          onChangeText={(value) => onChange("height", value)}
          editable={isEditing && !saving}
          keyboardType="decimal-pad"
          error={errors.height}
          style={styles.measurementField}
        />
        <TextField
          label="Cân nặng (kg)"
          value={form.weight}
          onChangeText={(value) => onChange("weight", value)}
          editable={isEditing && !saving}
          keyboardType="decimal-pad"
          error={errors.weight}
          style={styles.measurementField}
        />
      </View>

      <TextField
        label="Dị ứng"
        placeholder="Ví dụ: thuốc, thực phẩm, phấn hoa"
        value={form.allergyNote}
        onChangeText={(value) => onChange("allergyNote", value)}
        editable={isEditing && !saving}
        error={errors.allergyNote}
        multiline
        numberOfLines={3}
      />

      <View style={styles.fieldGroup}>
        <View style={styles.headerRow}>
          <AppText variant="bodyStrong">Bệnh nền</AppText>
          {isEditing ? (
            <Pressable accessibilityRole="button" onPress={onAddDisease} disabled={saving} style={styles.addDiseaseButton}>
              <Plus size={14} color={colors.ink} />
              <AppText variant="bodyStrong">Thêm bệnh nền</AppText>
            </Pressable>
          ) : null}
        </View>

        {form.chronicDiseases.length === 0 ? (
          <AppText variant="caption" color={colors.subtle}>
            Chưa có bệnh nền nào.
          </AppText>
        ) : (
          form.chronicDiseases.map((disease, index) => (
            <DiseaseRow
              key={disease.localId}
              disease={disease}
              index={index}
              errors={errors}
              isEditing={isEditing}
              saving={saving}
              onChange={(key, value) => onUpdateDisease(disease.localId, key, value)}
              onRemove={() => onRemoveDisease(disease.localId)}
            />
          ))
        )}
      </View>

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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.mint,
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
  fieldGroup: {
    gap: spacing.sm,
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
  diseaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
