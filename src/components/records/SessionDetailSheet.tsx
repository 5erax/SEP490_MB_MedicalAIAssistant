import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ChevronDown, ChevronUp, ShieldAlert, X } from "lucide-react-native";

import { AppText, Badge, Button, EmptyState, LoadingState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { LabTestSession } from "@/src/types/labTest";
import { formatDateOnly, getSessionStatusPresentation } from "@/src/utils/labTestPresentation";
import { ResultCard } from "./ResultCard";

const GENDER_LABEL: Record<string, string> = { male: "Nam", female: "Nữ" };

type SessionDetailSheetProps = {
  visible: boolean;
  session: LabTestSession | null;
  state: "idle" | "loading" | "ready" | "error";
  error: string;
  onClose: () => void;
  onRetry: () => void;
};

export function SessionDetailSheet({ visible, session, state, error, onClose, onRetry }: SessionDetailSheetProps) {
  const [showRawText, setShowRawText] = useState(false);
  const status = session ? getSessionStatusPresentation(session.status) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="caption" color={colors.subtle}>
              Chi tiết phân tích
            </AppText>
            <AppText variant="h3">{session ? formatDateOnly(session.testDate) : "—"}</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {state === "loading" ? (
            <LoadingState title="Đang tải chi tiết phân tích..." />
          ) : state === "error" ? (
            <View style={styles.errorGroup}>
              <AppText color={colors.danger}>{error}</AppText>
              <Button variant="secondary" onPress={onRetry}>
                Thử lại
              </Button>
            </View>
          ) : session ? (
            <>
              <View style={styles.metaCard}>
                {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
                <View style={styles.metaGrid}>
                  <View>
                    <AppText variant="caption" color={colors.subtle}>
                      Giới tính lúc xét nghiệm
                    </AppText>
                    <AppText variant="bodyStrong">{GENDER_LABEL[session.patientGenderAtTest || ""] || "—"}</AppText>
                  </View>
                  <View>
                    <AppText variant="caption" color={colors.subtle}>
                      Tuổi lúc xét nghiệm
                    </AppText>
                    <AppText variant="bodyStrong">{session.patientAgeAtTest ?? "—"}</AppText>
                  </View>
                  <View>
                    <AppText variant="caption" color={colors.subtle}>
                      Số chỉ số
                    </AppText>
                    <AppText variant="bodyStrong">{session.results?.length ?? 0}</AppText>
                  </View>
                </View>
              </View>

              {session.status === "processing" ? (
                <View style={styles.infoBanner}>
                  <ActivityIndicator color={colors.teal} size="small" />
                  <AppText color={colors.muted} style={styles.bannerText}>
                    Hệ thống đang đọc phiếu xét nghiệm. Màn hình sẽ tự cập nhật khi có kết quả.
                  </AppText>
                </View>
              ) : null}

              {session.status === "failed" ? (
                <View style={styles.dangerBanner}>
                  <AppText color={colors.danger} style={styles.bannerText}>
                    Phiên phân tích không hoàn tất. Hãy thử gửi lại bằng một phiên mới.
                  </AppText>
                </View>
              ) : null}

              {session.status === "completed" && (session.results?.length ?? 0) === 0 ? (
                <EmptyState title="Chưa nhận được chỉ số" description="Hệ thống chưa trích xuất được chỉ số nào từ tài liệu này." />
              ) : null}

              {(session.results ?? []).map((result) => (
                <ResultCard key={result.resultDetailId} result={result} />
              ))}

              {session.rawOcrText ? (
                <View style={styles.rawTextGroup}>
                  <Pressable accessibilityRole="button" onPress={() => setShowRawText((current) => !current)} style={styles.toggle}>
                    <AppText variant="bodyStrong" color={colors.teal}>
                      {showRawText ? "Ẩn văn bản trích xuất" : "Xem văn bản trích xuất"}
                    </AppText>
                    {showRawText ? <ChevronUp size={16} color={colors.teal} /> : <ChevronDown size={16} color={colors.teal} />}
                  </Pressable>
                  {showRawText ? (
                    <AppText color={colors.muted} style={styles.rawText}>
                      {session.rawOcrText}
                    </AppText>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.disclaimer}>
                <ShieldAlert size={16} color={colors.warning} />
                <AppText variant="caption" color={colors.muted} style={styles.disclaimerText}>
                  Kết quả AI chỉ mang tính tham khảo, không thay thế chẩn đoán, kê đơn hoặc tư vấn trực tiếp từ bác sĩ.
                </AppText>
              </View>
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
  errorGroup: {
    gap: spacing.md,
    alignItems: "flex-start",
  },
  metaCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  dangerBanner: {
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
  },
  bannerText: {
    flex: 1,
  },
  rawTextGroup: {
    gap: spacing.sm,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  rawText: {
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
  },
  disclaimerText: {
    flex: 1,
  },
});
