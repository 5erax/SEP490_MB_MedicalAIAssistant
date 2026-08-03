import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { AppText, Badge, Button, LoadingState, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RecoveryPlanRequest } from "@/src/types/recoveryPlan";
import { CANCELLABLE_REQUEST_STATUSES, formatDateOnly, getDiseaseGroupLabel, REQUEST_STATUS } from "@/src/utils/recoveryPlanPresentation";

const NOTE_MAX_LENGTH = 2000;

type RequestDetailSheetProps = {
  visible: boolean;
  request: RecoveryPlanRequest | null;
  state: "idle" | "loading" | "ready" | "error";
  cancelling: boolean;
  providingInfo: boolean;
  onClose: () => void;
  onCancel: (requestId: string) => void;
  onProvideInformation: (requestId: string, text: string) => void;
};

export function RequestDetailSheet({
  visible,
  request,
  state,
  cancelling,
  providingInfo,
  onClose,
  onCancel,
  onProvideInformation,
}: RequestDetailSheetProps) {
  const [infoText, setInfoText] = useState("");

  function handleCancel() {
    if (!request) return;
    Alert.alert("Hủy yêu cầu này?", "Lượt đang giữ chỗ sẽ được trả lại nếu yêu cầu chưa được xuất bản.", [
      { text: "Đóng", style: "cancel" },
      { text: "Hủy yêu cầu", style: "destructive", onPress: () => onCancel(request.id) },
    ]);
  }

  const status = request ? REQUEST_STATUS[request.status] : null;
  const cancellable = request ? CANCELLABLE_REQUEST_STATUSES.has(request.status) : false;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="caption" color={colors.subtle}>
              Chi tiết yêu cầu
            </AppText>
            <AppText variant="h3">{request ? getDiseaseGroupLabel(request.diseaseGroup) : "—"}</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {state === "loading" ? (
            <LoadingState title="Đang tải chi tiết yêu cầu..." />
          ) : request ? (
            <>
              {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}

              <View style={styles.metaRow}>
                <AppText variant="caption" color={colors.subtle}>
                  Ngày gửi
                </AppText>
                <AppText variant="bodyStrong">{formatDateOnly(request.requestedAt)}</AppText>
              </View>

              {request.requestNote ? (
                <View style={styles.noteCard}>
                  <AppText variant="caption" color={colors.subtle}>
                    Ghi chú của bạn
                  </AppText>
                  <AppText color={colors.muted}>{request.requestNote}</AppText>
                </View>
              ) : null}

              {request.status === "rejected" && request.rejectionReason ? (
                <View style={styles.dangerCard}>
                  <AppText variant="caption" color={colors.subtle}>
                    Lý do
                  </AppText>
                  <AppText color={colors.danger}>{request.rejectionReason}</AppText>
                </View>
              ) : null}

              {request.status === "needMoreInformation" ? (
                <View style={styles.fieldGroup}>
                  <AppText variant="bodyStrong">Bổ sung thông tin</AppText>
                  <AppText variant="caption" color={colors.subtle}>
                    Nội dung gửi đi sẽ thay thế phần ghi chú hiện tại, không tạo thành chuỗi trò chuyện.
                  </AppText>
                  <TextField
                    label={`Thông tin bổ sung · ${infoText.length}/${NOTE_MAX_LENGTH}`}
                    value={infoText}
                    onChangeText={(value) => setInfoText(value.slice(0, NOTE_MAX_LENGTH))}
                    editable={!providingInfo}
                    multiline
                    numberOfLines={4}
                    style={styles.multiline}
                  />
                  <Button disabled={providingInfo} onPress={() => onProvideInformation(request.id, infoText)}>
                    {providingInfo ? "Đang gửi..." : "Gửi thông tin bổ sung"}
                  </Button>
                </View>
              ) : null}

              {cancellable ? (
                <Button variant="danger" disabled={cancelling} onPress={handleCancel}>
                  {cancelling ? "Đang hủy..." : "Hủy yêu cầu"}
                </Button>
              ) : null}
            </>
          ) : null}
        </ScrollView>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs / 2,
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
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noteCard: {
    gap: spacing.xs / 2,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  dangerCard: {
    gap: spacing.xs / 2,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
});
