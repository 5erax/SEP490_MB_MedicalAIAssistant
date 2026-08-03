import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FileText, Image as ImageIcon, Trash2, Upload, X } from "lucide-react-native";

import { AppText, Button } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { PickedDocument } from "@/src/services/cloudinaryUploadService";
import { UserProfile } from "@/src/types/user";

type SubmissionStatus = "idle" | "uploading" | "analyzing" | "success" | "error";

type UploadRecordSheetProps = {
  visible: boolean;
  profile: UserProfile | null;
  testDate: string;
  document: PickedDocument | null;
  formError: string;
  submissionStatus: SubmissionStatus;
  submissionMessage: string;
  onClose: () => void;
  onPickDocument: () => void;
  onClearDocument: () => void;
  onChangeTestDate: (date: string) => void;
  onSubmit: () => void;
};

function formatDateLabel(value: string) {
  if (!value) return "Chọn ngày";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function submitLabel(status: SubmissionStatus) {
  if (status === "uploading") return "Đang tải tài liệu...";
  if (status === "analyzing") return "Đang gửi phân tích...";
  return "Phân tích kết quả";
}

const GENDER_LABEL: Record<number, string> = { 1: "Nam", 2: "Nữ", 0: "Khác" };

export function UploadRecordSheet({
  visible,
  profile,
  testDate,
  document,
  formError,
  submissionStatus,
  submissionMessage,
  onClose,
  onPickDocument,
  onClearDocument,
  onChangeTestDate,
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
              <AppText variant="bodyStrong">{GENDER_LABEL[Number(profile?.gender ?? -1)] || "—"}</AppText>
            </View>
            <View style={styles.infoRow}>
              <AppText color={colors.muted}>Ngày sinh</AppText>
              <AppText variant="bodyStrong">{profile?.dateOfBirth ? formatDateLabel(String(profile.dateOfBirth).slice(0, 10)) : "—"}</AppText>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="caption" color={colors.muted}>
              Ngày xét nghiệm
            </AppText>
            <DateTimePicker
              value={testDate ? new Date(testDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (event.type === "set" && selectedDate) {
                  onChangeTestDate(toIsoDate(selectedDate));
                }
              }}
            />
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
              <Pressable accessibilityRole="button" onPress={onPickDocument} disabled={busy} style={styles.dropzone}>
                <Upload size={22} color={colors.teal} />
                <AppText variant="bodyStrong">Chọn ảnh hoặc PDF</AppText>
                <AppText variant="caption" color={colors.subtle}>
                  Hỗ trợ JPG, PNG, PDF · tối đa 10 MB
                </AppText>
              </Pressable>
            )}
          </View>

          {formError ? (
            <AppText color={colors.danger} variant="caption">
              {formError}
            </AppText>
          ) : null}

          <AppText variant="caption" color={colors.subtle}>
            {submissionMessage || "Không tải tài liệu chứa giấy tờ tùy thân hoặc dữ liệu của người khác."}
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
  dropzone: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
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
