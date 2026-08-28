import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Camera, Check, FileText, Image as ImageIcon, Images, ShieldCheck, Trash2, X } from "lucide-react-native";

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
  const canSubmit = Boolean(document) && !busy;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="caption" color={colors.teal}>TẠO PHIÊN PHÂN TÍCH</AppText>
            <AppText variant="h3">Thêm phiếu xét nghiệm</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.notice}>
            <ShieldCheck size={20} color={colors.teal} />
            <View style={styles.noticeCopy}><ShieldNote /></View>
          </View>

          <View style={styles.progressRow}>
            <ProgressStep active complete={Boolean(document)} number="1" label="Chọn phiếu" />
            <View style={[styles.progressLine, document && styles.progressLineComplete]} />
            <ProgressStep active={Boolean(document)} number="2" label="Gửi phân tích" />
          </View>

          <View style={styles.infoCard}>
            <View style={styles.cardTitleRow}>
              <AppText variant="caption" color={colors.subtle}>THÔNG TIN DÙNG ĐỂ ĐỐI CHIẾU</AppText>
              <View style={styles.profileBadge}><Check size={13} color={colors.teal} /><AppText variant="caption" color={colors.teal}>Từ hồ sơ</AppText></View>
            </View>
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
            <View style={styles.fieldHeading}>
              <View style={styles.fieldNumber}><AppText variant="caption" color={colors.white}>1</AppText></View>
              <View style={styles.fieldHeadingCopy}>
                <AppText variant="bodyStrong">Chọn phiếu xét nghiệm</AppText>
                <AppText variant="caption" color={colors.muted}>Ảnh rõ nét, đủ 4 góc giúp nhận diện chính xác hơn.</AppText>
              </View>
            </View>
            {document ? (
              <View style={styles.documentPreview}>
                <View style={styles.documentIcon}>{isPdf ? <FileText size={22} color={colors.teal} /> : <ImageIcon size={22} color={colors.teal} />}</View>
                <View style={styles.documentName}>
                  <AppText variant="bodyStrong" numberOfLines={1}>{document.fileName || "Tài liệu đã chọn"}</AppText>
                  <AppText variant="caption" color={colors.teal}>Sẵn sàng phân tích</AppText>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Xoá tài liệu" onPress={onClearDocument} disabled={busy} hitSlop={6}>
                  <Trash2 size={18} color={colors.danger} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.sourceOptions}>
                <View style={styles.photoOptions}>
                  <Pressable accessibilityRole="button" onPress={onTakePhoto} disabled={busy} style={[styles.sourceOption, styles.cameraOption]}>
                    <View style={styles.sourceIcon}><Camera size={23} color={colors.white} /></View>
                    <AppText variant="bodyStrong" color={colors.white}>Chụp ảnh</AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.78)">Khuyên dùng</AppText>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={onPickImage} disabled={busy} style={styles.sourceOption}>
                    <View style={[styles.sourceIcon, styles.sourceIconSoft]}><Images size={23} color={colors.teal} /></View>
                    <AppText variant="bodyStrong">Thư viện</AppText>
                    <AppText variant="caption" color={colors.subtle}>JPG, PNG</AppText>
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" onPress={onPickPdf} disabled={busy} style={styles.pdfOption}>
                  <View style={styles.pdfIcon}><FileText size={20} color={colors.teal} /></View>
                  <View style={styles.pdfCopy}>
                    <AppText variant="bodyStrong">Chọn tệp PDF</AppText>
                    <AppText variant="caption" color={colors.subtle}>Tài liệu một hoặc nhiều trang · tối đa 10 MB</AppText>
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
          <AppText variant="caption" color={colors.subtle} center>{document ? "Kiểm tra lại đúng phiếu của bạn trước khi gửi." : "Chọn một ảnh hoặc PDF để tiếp tục."}</AppText>
          <Button fullWidth disabled={!canSubmit} onPress={onSubmit}>
            {submitLabel(submissionStatus)}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

function ProgressStep({ active, complete, number, label }: { active?: boolean; complete?: boolean; number: string; label: string }) {
  return (
    <View style={styles.progressStep}>
      <View style={[styles.progressDot, active && styles.progressDotActive]}>
        {complete ? <Check size={14} color={colors.white} /> : <AppText variant="caption" color={active ? colors.white : colors.subtle}>{number}</AppText>}
      </View>
      <AppText variant="caption" color={active ? colors.ink : colors.subtle}>{label}</AppText>
    </View>
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
  headerCopy: { flex: 1, gap: spacing.xs / 2 },
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs / 2,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  noticeCopy: { flex: 1, gap: spacing.xs / 2 },
  progressRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: spacing.md },
  progressStep: { alignItems: "center", gap: spacing.xs, minWidth: 92 },
  progressDot: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperSoft },
  progressDotActive: { borderColor: colors.teal, backgroundColor: colors.teal },
  progressLine: { flex: 1, height: 2, marginTop: 13, marginHorizontal: -spacing.sm, backgroundColor: colors.line },
  progressLineComplete: { backgroundColor: colors.teal },
  infoCard: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  profileBadge: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.mint, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  fieldNumber: { width: 26, height: 26, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.teal },
  fieldHeadingCopy: { flex: 1, gap: spacing.xs / 2 },
  sourceOptions: {
    gap: spacing.sm,
  },
  photoOptions: { flexDirection: "row", gap: spacing.sm },
  sourceOption: {
    flex: 1,
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  cameraOption: { borderColor: colors.teal, backgroundColor: colors.teal },
  sourceIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.18)" },
  sourceIconSoft: { backgroundColor: colors.mint },
  pdfOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pdfIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.mint },
  pdfCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  documentPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  documentIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.mint },
  documentName: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  footer: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
