import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Camera, FileText, Image as ImageIcon, Images, Trash2, X } from "lucide-react-native";

import { AppText, Button } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { PickedDocument } from "@/src/services/cloudinaryUploadService";
import { UserProfile } from "@/src/types/user";
import { formatGenderLabel } from "@/src/utils/labTestPresentation";

type SubmissionStatus = "idle" | "uploading" | "analyzing" | "success" | "error";

type UploadRecordSheetProps = {
  visible: boolean;
  profile: UserProfile | null;
  document: PickedDocument | null;
  formError: string;
  submissionStatus: SubmissionStatus;
  submissionMessage: string;
  onClose: () => void;
  onPickImage: () => void;
  onPickPdf: () => void;
  onTakePhoto: () => void;
  onClearDocument: () => void;
  onSubmit: () => void;
};

function formatDateLabel(value: string) {
  if (!value) return "Chọn ngày";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function submitLabel(status: SubmissionStatus) {
  if (status === "uploading") return "Đang tải tài liệu...";
  if (status === "analyzing") return "Đang gửi phân tích...";
  return "Phân tích kết quả";
}

export function UploadRecordSheet({
  visible,
  profile,
  document,
  formError,
  submissionStatus,
  submissionMessage,
  onClose,
  onPickImage,
  onPickPdf,
  onTakePhoto,
  onClearDocument,
  onSubmit,
}: UploadRecordSheetProps) {
  const busy = submissionStatus === "uploading" || submissionStatus === "analyzing";
  const isPdf = document?.mimeType === "application/pdf";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <AppText variant="h3">Phân tích phiếu xét nghiệm</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.notice}>
            <ShieldNote />
          </View>

          <View style={styles.infoCard}>
            <AppText variant="caption" color={colors.subtle}>
              Thông tin từ hồ sơ
            </AppText>
            <View style={styles.infoRow}>
              <AppText color={colors.muted}>Họ tên</AppText>
              <AppText variant="bodyStrong">{profile?.displayName || profile?.name || "—"}</AppText>
            </View>
            <View style={styles.infoRow}>
              <AppText color={colors.muted}>Giới tính</AppText>
              <AppText variant="bodyStrong">{formatGenderLabel(profile?.gender)}</AppText>
            </View>
            <View style={styles.infoRow}>
              <AppText color={colors.muted}>Ngày sinh</AppText>
              <AppText variant="bodyStrong">{profile?.dateOfBirth ? formatDateLabel(String(profile.dateOfBirth).slice(0, 10)) : "—"}</AppText>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="caption" color={colors.muted}>
              Phiếu xét nghiệm
            </AppText>
            {document ? (
              <View style={styles.documentPreview}>
                {isPdf ? <FileText size={20} color={colors.teal} /> : <ImageIcon size={20} color={colors.teal} />}
                <AppText variant="bodyStrong" style={styles.documentName} numberOfLines={1}>
                  {document.fileName || "Tài liệu đã chọn"}
                </AppText>
                <Pressable accessibilityRole="button" accessibilityLabel="Xoá tài liệu" onPress={onClearDocument} disabled={busy} hitSlop={6}>
                  <Trash2 size={18} color={colors.danger} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.sourceOptions}>
                <Pressable accessibilityRole="button" onPress={onPickImage} disabled={busy} style={styles.sourceOption}>
                  <Images size={22} color={colors.teal} />
                  <AppText variant="bodyStrong">Thư viện ảnh</AppText>
                  <AppText variant="caption" color={colors.subtle}>Chọn JPG hoặc PNG</AppText>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={onTakePhoto} disabled={busy} style={styles.sourceOption}>
                  <Camera size={22} color={colors.teal} />
                  <AppText variant="bodyStrong">Chụp ảnh</AppText>
                  <AppText variant="caption" color={colors.subtle}>Mở camera thiết bị</AppText>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={onPickPdf} disabled={busy} style={styles.pdfOption}>
                  <FileText size={20} color={colors.teal} />
                  <View style={styles.pdfCopy}>
                    <AppText variant="bodyStrong">Chọn tệp PDF</AppText>
                    <AppText variant="caption" color={colors.subtle}>Tối đa 10 MB</AppText>
                  </View>
                </Pressable>
              </View>
            )}
          </View>

          {formError ? (
            <AppText color={colors.danger} variant="caption">
              {formError}
            </AppText>
          ) : null}

          <AppText variant="caption" color={colors.subtle}>
            {submissionMessage || "Ngày của phiên được ghi nhận tự động khi hệ thống tiếp nhận tài liệu. Không tải giấy tờ tùy thân hoặc dữ liệu của người khác."}
          </AppText>
        </ScrollView>

        <View style={styles.footer}>
          <Button fullWidth disabled={busy} onPress={onSubmit}>
            {submitLabel(submissionStatus)}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

function ShieldNote() {
  return (
    <>
      <AppText variant="bodyStrong">Dữ liệu sức khỏe nhạy cảm</AppText>
      <AppText variant="caption" color={colors.muted}>
        Chỉ tải tài liệu của bạn và kiểm tra kỹ trước khi gửi.
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
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
  notice: {
    gap: spacing.xs / 2,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  infoCard: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  sourceOptions: {
    gap: spacing.sm,
  },
  sourceOption: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  pdfOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pdfCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  documentPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  documentName: {
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
