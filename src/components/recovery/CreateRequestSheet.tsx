import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { CalendarCheck, ChevronDown, ClipboardCheck, FileImage, FlaskConical, Info, NotebookPen, ShieldCheck, X } from "lucide-react-native";

import { AppText, Button, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";
import { CreateRequestForm } from "@/src/hooks/useRecoveryPlan";
import { PickedImage, validateCloudinaryImage } from "@/src/services/cloudinaryUploadService";
import { LabTestSession } from "@/src/types/labTest";
import { DISEASE_GROUPS, getLabSessionId, getLabSessionLabel } from "@/src/utils/recoveryPlanPresentation";

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
  const [diseasePickerOpen, setDiseasePickerOpen] = useState(false);
  const [labPickerOpen, setLabPickerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selectedDiseaseLabel = DISEASE_GROUPS.find((group) => group.value === form.diseaseGroup)?.label;
  const selectedLabSession = labSessions.find((session) => getLabSessionId(session) === form.primaryLabTestSessionId) ?? null;
  const selectedLabLabel = selectedLabSession ? getLabSessionLabel(selectedLabSession) : "";

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
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerBadge}>
              <ClipboardCheck size={18} color={colors.white} />
            </View>
            <View style={styles.headerTextWrap}>
              <AppText variant="h3" numberOfLines={2}>
                Yêu cầu kế hoạch phục hồi
              </AppText>
              <AppText variant="caption" color={colors.muted}>
                Gửi đủ ngữ cảnh để bác sĩ lập lộ trình phù hợp.
              </AppText>
            </View>
          </View>
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

          <View style={styles.guidePanel}>
            <View style={styles.guideIcon}>
              <ShieldCheck size={20} color={colors.teal} />
            </View>
            <View style={styles.guideBody}>
              <AppText variant="bodyStrong">Chuẩn bị thông tin cho bác sĩ</AppText>
              <AppText variant="caption" color={colors.muted}>
                Chọn nhóm bệnh, gửi xét nghiệm hoặc đơn thuốc nếu có, rồi ghi chú điều bạn muốn được lưu ý.
              </AppText>
            </View>
          </View>

          <View style={styles.fieldCard}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" color={colors.teal}>
                  1
                </AppText>
              </View>
              <View style={styles.cardTitleWrap}>
                <AppText variant="bodyStrong">Nhóm bệnh cần hỗ trợ</AppText>
                <AppText variant="caption" color={errors.diseaseGroup ? colors.danger : colors.subtle}>
                  Chọn một nhóm gần nhất với tình trạng hiện tại.
                </AppText>
              </View>
            </View>
            <View style={styles.selectWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chọn nhóm bệnh"
                disabled={submitting}
                onPress={() => {
                  setLabPickerOpen(false);
                  setDiseasePickerOpen((current) => !current);
                }}
                style={[styles.selectButton, diseasePickerOpen && styles.selectButtonOpen, errors.diseaseGroup && styles.selectButtonError]}
              >
                <AppText variant="bodyStrong" color={selectedDiseaseLabel ? colors.ink : colors.muted} style={styles.selectLabel}>
                  {selectedDiseaseLabel || "Chọn nhóm bệnh"}
                </AppText>
                <ChevronDown size={18} color={colors.teal} />
              </Pressable>
              {diseasePickerOpen ? (
                <ScrollView style={styles.selectMenu} nestedScrollEnabled persistentScrollbar>
                  {DISEASE_GROUPS.map(({ value, label }) => {
                    const selected = form.diseaseGroup === value;
                    return (
                      <Pressable
                        key={value}
                        accessibilityRole="button"
                        disabled={submitting}
                        onPress={() => {
                          onChange("diseaseGroup", value);
                          setDiseasePickerOpen(false);
                        }}
                        style={[styles.selectOption, selected && styles.selectOptionSelected]}
                      >
                        <AppText variant="bodyStrong" color={selected ? colors.white : colors.ink}>
                          {label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}
            </View>
            {errors.diseaseGroup ? (
              <AppText variant="caption" color={colors.danger}>
                {errors.diseaseGroup}
              </AppText>
            ) : null}
          </View>

          <View style={styles.fieldCard}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" color={colors.teal}>
                  2
                </AppText>
              </View>
              <View style={styles.cardTitleWrap}>
                <AppText variant="bodyStrong">Tài liệu đính kèm</AppText>
                <AppText variant="caption" color={colors.subtle}>
                  Không bắt buộc, nhưng giúp bác sĩ hiểu tình trạng nhanh hơn.
                </AppText>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <FlaskConical size={16} color={colors.teal} />
                <AppText variant="caption" color={colors.muted}>
                  Xét nghiệm đính kèm
                </AppText>
              </View>
              <View style={styles.selectWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Chọn xét nghiệm đính kèm"
                  disabled={submitting || labSessionsState === "loading"}
                  onPress={() => {
                    setDiseasePickerOpen(false);
                    setLabPickerOpen((current) => !current);
                  }}
                  style={[styles.selectButton, labPickerOpen && styles.selectButtonOpen]}
                >
                  <AppText variant="bodyStrong" color={selectedLabLabel ? colors.ink : colors.muted} style={styles.selectLabel}>
                    {labSessionsState === "loading" ? "Đang tải xét nghiệm..." : selectedLabLabel || "Không đính kèm xét nghiệm"}
                  </AppText>
                  <ChevronDown size={18} color={colors.teal} />
                </Pressable>
                {labPickerOpen ? (
                  <ScrollView style={styles.selectMenu} nestedScrollEnabled persistentScrollbar>
                    <Pressable
                      key="none"
                      accessibilityRole="button"
                      disabled={submitting}
                      onPress={() => {
                        onChange("primaryLabTestSessionId", "");
                        setLabPickerOpen(false);
                      }}
                      style={[styles.selectOption, form.primaryLabTestSessionId === "" && styles.selectOptionSelected]}
                    >
                      <AppText variant="bodyStrong" color={form.primaryLabTestSessionId === "" ? colors.white : colors.ink}>
                        Không đính kèm xét nghiệm
                      </AppText>
                    </Pressable>
                    {labSessions.map((session) => {
                      const sessionId = getLabSessionId(session);
                      const selected = form.primaryLabTestSessionId === sessionId;
                      return (
                        <Pressable
                          key={sessionId}
                          accessibilityRole="button"
                          disabled={submitting || !sessionId}
                          onPress={() => {
                            onChange("primaryLabTestSessionId", sessionId);
                            setLabPickerOpen(false);
                          }}
                          style={[styles.selectOption, selected && styles.selectOptionSelected]}
                        >
                          <AppText variant="bodyStrong" color={selected ? colors.white : colors.ink}>
                            {getLabSessionLabel(session)}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>
              <View style={styles.labPreview}>
                <View style={styles.labPreviewIcon}>
                  <CalendarCheck size={17} color={colors.teal} />
                </View>
                <View style={styles.labPreviewText}>
                  <AppText variant="caption" color={colors.subtle}>
                    {selectedLabSession ? "Đã chọn xét nghiệm" : "Chưa chọn xét nghiệm"}
                  </AppText>
                  <AppText variant="bodyStrong" numberOfLines={2}>
                    {selectedLabLabel || "Không đính kèm xét nghiệm"}
                  </AppText>
                </View>
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

            <View style={styles.divider} />

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <FileImage size={16} color={colors.teal} />
                <AppText variant="caption" color={colors.muted}>
                  Ảnh đơn thuốc sau khi khám
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
                <Button
                  variant="secondary"
                  onPress={pickPrescriptionImage}
                  disabled={submitting || prescriptionUploading}
                  leftIcon={<FileImage size={17} color={colors.teal} />}
                  style={styles.attachmentButton}
                >
                  Chọn ảnh đơn thuốc
                </Button>
              )}
              {pickError || prescriptionUploadError ? (
                <AppText variant="caption" color={colors.danger}>
                  {pickError || prescriptionUploadError}
                </AppText>
              ) : null}
            </View>
          </View>

          <View style={styles.fieldCard}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" color={colors.teal}>
                  3
                </AppText>
              </View>
              <View style={styles.cardTitleWrap}>
                <AppText variant="bodyStrong">Ghi chú cho bác sĩ</AppText>
                <AppText variant="caption" color={colors.subtle}>
                  Nêu mục tiêu phục hồi, hạn chế vận động, dị ứng hoặc lịch sinh hoạt.
                </AppText>
              </View>
              <NotebookPen size={18} color={colors.teal} />
            </View>
            <TextField
              label={`Ghi chú cho bác sĩ · ${form.requestNote.length}/${NOTE_MAX_LENGTH}`}
              placeholder="Mô tả điều bạn muốn bác sĩ lưu ý khi lên kế hoạch phục hồi"
              value={form.requestNote}
              onChangeText={(value) => onChange("requestNote", value.slice(0, NOTE_MAX_LENGTH))}
              editable={!submitting}
              error={errors.requestNote}
              multiline
              numberOfLines={5}
              style={styles.multiline}
            />
          </View>

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
          <AppText variant="caption" color={colors.subtle} style={styles.footerHint}>
            Bác sĩ sẽ xem yêu cầu và phản hồi khi kế hoạch sẵn sàng.
          </AppText>
          <Button fullWidth disabled={submitting || prescriptionUploading} onPress={onSubmit}>
            {prescriptionUploading ? "Đang tải ảnh..." : submitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </View>
      </SafeAreaView>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.paper,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerBadge: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.teal,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
    gap: spacing.md,
    paddingBottom: spacing["4xl"],
  },
  guidePanel: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  guideIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.paper,
  },
  guideBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  fieldCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
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
  selectWrap: {
    gap: 0,
  },
  selectButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  selectButtonOpen: {
    borderColor: colors.teal,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectButtonError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  selectLabel: {
    flex: 1,
  },
  selectMenu: {
    maxHeight: 154,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: colors.teal,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    backgroundColor: colors.paper,
  },
  selectOption: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  selectOptionSelected: {
    backgroundColor: colors.teal,
  },
  labPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  labPreviewIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  labPreviewText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  multiline: {
    minHeight: 124,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
  errorGroup: {
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
  footerHint: {
    textAlign: "center",
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
    backgroundColor: colors.paperSoft,
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
  attachmentButton: {
    borderStyle: "dashed",
    backgroundColor: colors.paperSoft,
  },
});
