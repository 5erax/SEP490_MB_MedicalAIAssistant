import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CalendarDays, ChevronLeft, ClipboardList, FileText, MessageSquare, ShieldCheck } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Badge, Button, LoadingState, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RecoveryPlanRequest } from "@/src/types/recoveryPlan";
import { CANCELLABLE_REQUEST_STATUSES, formatDateOnly, getDiseaseGroupLabel, REQUEST_STATUS } from "@/src/utils/recoveryPlanPresentation";

const NOTE_MAX_LENGTH = 2000;

const STATUS_HELP: Record<RecoveryPlanRequest["status"], string> = {
  waitingForDoctor: "Yêu cầu đã được gửi và đang chờ bác sĩ tiếp nhận.",
  assigned: "Bác sĩ đã nhận yêu cầu và sẽ bắt đầu rà soát thông tin.",
  inReview: "Bác sĩ đang xem xét hồ sơ, ghi chú và dữ liệu đính kèm.",
  needMoreInformation: "Bác sĩ cần bạn bổ sung thêm thông tin trước khi lập kế hoạch.",
  published: "Kế hoạch đã sẵn sàng trong mục Kế hoạch đã nhận.",
  rejected: "Yêu cầu chưa thể tiếp nhận. Xem lý do bên dưới.",
  cancelled: "Yêu cầu này đã được hủy.",
  expired: "Yêu cầu đã hết hạn xử lý.",
};

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
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onClose} style={styles.backButton} hitSlop={8}>
            <ChevronLeft size={20} color={colors.teal} />
            <AppText variant="bodyStrong" color={colors.teal}>
              Quay lại
            </AppText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {state === "loading" ? (
            <LoadingState title="Đang tải chi tiết yêu cầu..." />
          ) : request ? (
            <>
              <View style={styles.hero}>
                <View style={styles.heroTop}>
                  <View style={styles.heroIcon}>
                    <ClipboardList size={22} color={colors.white} />
                  </View>
                  {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
                </View>
                <AppText variant="caption" color="rgba(255,255,255,0.72)">
                  Chi tiết yêu cầu
                </AppText>
                <AppText variant="h2" color={colors.white}>
                  {getDiseaseGroupLabel(request.diseaseGroup)}
                </AppText>
                <AppText color="rgba(255,255,255,0.86)">{STATUS_HELP[request.status]}</AppText>
              </View>

              <View style={styles.timelineCard}>
                <View style={styles.timelineIcon}>
                  <CalendarDays size={18} color={colors.teal} />
                </View>
                <View style={styles.timelineText}>
                  <AppText variant="caption" color={colors.subtle}>
                    Ngày gửi yêu cầu
                  </AppText>
                  <AppText variant="h3">{formatDateOnly(request.requestedAt)}</AppText>
                </View>
              </View>

              <View style={styles.noteCard}>
                <View style={styles.cardHeader}>
                  <FileText size={16} color={colors.teal} />
                  <AppText variant="bodyStrong">Ghi chú của bạn</AppText>
                </View>
                <AppText color={request.requestNote ? colors.muted : colors.subtle}>
                  {request.requestNote || "Bạn chưa thêm ghi chú cho yêu cầu này."}
                </AppText>
              </View>

              {request.status === "rejected" && request.rejectionReason ? (
                <View style={styles.dangerCard}>
                  <View style={styles.cardHeader}>
                    <ShieldCheck size={16} color={colors.danger} />
                    <AppText variant="bodyStrong" color={colors.danger}>
                      Lý do
                    </AppText>
                  </View>
                  <AppText color={colors.danger}>{request.rejectionReason}</AppText>
                </View>
              ) : null}

              {request.status === "needMoreInformation" ? (
                <View style={styles.fieldGroup}>
                  <View style={styles.cardHeader}>
                    <MessageSquare size={16} color={colors.teal} />
                    <AppText variant="bodyStrong">Bổ sung thông tin</AppText>
                  </View>
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
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    paddingHorizontal: spacing.md,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  hero: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.limeDark,
    padding: spacing.xl,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  timelineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  timelineIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  timelineText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  noteCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dangerCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(180,35,24,0.22)",
    borderRadius: radius.lg,
    backgroundColor: colors.dangerBg,
    padding: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
});
