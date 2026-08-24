import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { FileImage, FlaskConical, Info, X } from "lucide-react-native";

import { AppText, Button, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";
import { CreateRequestForm } from "@/src/hooks/useRecoveryPlan";
import { PickedImage, validateCloudinaryImage } from "@/src/services/cloudinaryUploadService";
import { LabTestSession } from "@/src/types/labTest";
import { DISEASE_GROUPS, getLabSessionLabel } from "@/src/utils/recoveryPlanPresentation";

const NOTE_MAX_LENGTH = 2000;

type CreateRequestSheetProps = {
  visible: boolean;
  form: CreateRequestForm;
  errors: { diseaseGroup?: string; requestNote?: string };
  submitting: boolean;
  submitError: string;
  needsSubscription: boolean;
  profileReadinessIssues: string[];
  labSessions: LabTestSession[];
  labSessionsState: "loading" | "ready" | "error";
  labSessionsError: string;
  prescriptionFile: PickedImage | null;
  prescriptionUploading: boolean;
  prescriptionUploadError: string;
  onPickPrescription: (file: PickedImage | null) => void;
  onRemovePrescription: () => void;
  onClose: () => void;
  onChange: <K extends keyof CreateRequestForm>(key: K, value: CreateRequestForm[K]) => void;
  onSubmit: () => void;
};

export function CreateRequestSheet({
  visible,
  form,
  errors,
  submitting,
  submitError,
  needsSubscription,
  profileReadinessIssues,
  labSessions,
  labSessionsState,
  labSessionsError,
  prescriptionFile,
  prescriptionUploading,
  prescriptionUploadError,
  onPickPrescription,
  onRemovePrescription,
  onClose,
  onChange,
  onSubmit,
}: CreateRequestSheetProps) {
  const [pickError, setPickError] = useState("");

  async function pickPrescriptionImage() {
    setPickError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickError("Cần quyền truy cập ảnh để chọn ảnh đơn thuốc.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const picked: PickedImage = { uri: asset.uri, mimeType: asset.mimeType, fileSize: asset.fileSize, fileName: asset.fileName };
    try {
      validateCloudinaryImage(picked);
    } catch (validationError) {
      setPickError(validationError instanceof Error ? validationError.message : "Vui lòng chọn ảnh hợp lệ.");
      return;
    }
    onPickPrescription(picked);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <AppText variant="h3">Yêu cầu kế hoạch phục hồi</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {profileReadinessIssues.length > 0 ? (
            <View style={styles.readinessBanner}>
              <View style={styles.readinessHeader}>
                <Info size={18} color={colors.warning} />
                <AppText variant="bodyStrong" color={colors.warning} style={styles.readinessHeaderText}>
                  Hồ sơ y tế cần được cập nhật trước khi gửi yêu cầu
                </AppText>
              </View>
              {profileReadinessIssues.map((issue) => (
                <AppText key={issue} variant="caption" color={colors.muted}>
                  • {issue}
                </AppText>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  onClose();
                  router.push(ROUTES.PATIENT.PROFILE as never);
                }}
              >
                Cập nhật hồ sơ y tế
              </Button>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <AppText variant="caption" color={errors.diseaseGroup ? colors.danger : colors.muted}>
              Nhóm bệnh cần hỗ trợ
            </AppText>
            <View style={styles.diseaseRow}>
              {DISEASE_GROUPS.map(({ value, label }) => {
                const selected = form.diseaseGroup === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    disabled={submitting}
                    onPress={() => onChange("diseaseGroup", value)}
                    style={[styles.diseaseChip, selected && styles.diseaseChipSelected]}
                  >
                    <AppText variant="bodyStrong" color={selected ? colors.white : colors.muted}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {errors.diseaseGroup ? (
              <AppText variant="caption" color={colors.danger}>
                {errors.diseaseGroup}
              </AppText>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <FlaskConical size={16} color={colors.teal} />
              <AppText variant="caption" color={colors.muted}>
                Xét nghiệm đính kèm (không bắt buộc)
              </AppText>
            </View>
            <View style={styles.diseaseRow}>
              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() => onChange("primaryLabTestSessionId", "")}
                style={[styles.diseaseChip, form.primaryLabTestSessionId === "" && styles.diseaseChipSelected]}
              >
                <AppText variant="bodyStrong" color={form.primaryLabTestSessionId === "" ? colors.white : colors.muted}>
                  Không đính kèm
                </AppText>
              </Pressable>
              {labSessions.map((session) => {
                const selected = form.primaryLabTestSessionId === session.sessionId;
                return (
                  <Pressable
                    key={session.sessionId}
                    accessibilityRole="button"
                    disabled={submitting}
                    onPress={() => onChange("primaryLabTestSessionId", session.sessionId)}
                    style={[styles.diseaseChip, selected && styles.diseaseChipSelected]}
                  >
                    <AppText variant="bodyStrong" color={selected ? colors.white : colors.muted}>
                      {getLabSessionLabel(session)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText variant="caption" color={colors.subtle}>
              {labSessionsState === "loading"
                ? "Đang tải xét nghiệm..."
                : labSessionsError ||
                  (labSessions.length > 0
                    ? "Bạn có thể chọn một xét nghiệm đã hoàn tất để gửi kèm."
                    : "Bạn chưa có kết quả xét nghiệm đã phân tích. Bạn vẫn có thể gửi yêu cầu mà không đính kèm.")}
            </AppText>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <FileImage size={16} color={colors.teal} />
              <AppText variant="caption" color={colors.muted}>
                Ảnh đơn thuốc sau khi khám (không bắt buộc)
              </AppText>
            </View>
            {prescriptionFile ? (
              <View style={styles.prescriptionPreview}>
                <Image source={{ uri: prescriptionFile.uri }} style={styles.prescriptionThumb} />
                <View style={styles.prescriptionPreviewInfo}>
                  <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                    {prescriptionFile.fileName || "Ảnh đơn thuốc"}
                  </AppText>
                  <Button variant="secondary" size="sm" disabled={submitting || prescriptionUploading} onPress={onRemovePrescription}>
                    Xóa ảnh
                  </Button>
                </View>
              </View>
            ) : (
              <Button variant="secondary" onPress={pickPrescriptionImage} disabled={submitting || prescriptionUploading}>
                Chọn ảnh đơn thuốc
              </Button>
            )}
            {pickError || prescriptionUploadError ? (
              <AppText variant="caption" color={colors.danger}>
                {pickError || prescriptionUploadError}
              </AppText>
            ) : null}
          </View>

          <TextField
            label={`Ghi chú cho bác sĩ · ${form.requestNote.length}/${NOTE_MAX_LENGTH}`}
            placeholder="Mô tả điều bạn muốn bác sĩ lưu ý khi lên kế hoạch phục hồi"
            value={form.requestNote}
            onChangeText={(value) => onChange("requestNote", value.slice(0, NOTE_MAX_LENGTH))}
            editable={!submitting}
            error={errors.requestNote}
            multiline
            numberOfLines={4}
            style={styles.multiline}
          />

          {submitError ? (
            <View style={styles.errorGroup}>
              <AppText color={colors.danger} variant="caption">
                {submitError}
              </AppText>
              {needsSubscription ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    onClose();
                    router.push(ROUTES.PUBLIC.PRICING as never);
                  }}
                >
                  Xem gói dịch vụ
                </Button>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button fullWidth disabled={submitting || prescriptionUploading} onPress={onSubmit}>
            {prescriptionUploading ? "Đang tải ảnh..." : submitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  diseaseRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  diseaseChip: {
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paper,
  },
  diseaseChipSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
  errorGroup: {
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  readinessBanner: {
    gap: spacing.sm,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#f3d9ae",
    borderRadius: radius.lg,
    backgroundColor: colors.warningBg,
    padding: spacing.lg,
  },
  readinessHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  readinessHeaderText: {
    flex: 1,
  },
  prescriptionPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.sm,
  },
  prescriptionThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.paperSoft,
  },
  prescriptionPreviewInfo: {
    flex: 1,
    gap: spacing.xs,
    alignItems: "flex-start",
  },
});
