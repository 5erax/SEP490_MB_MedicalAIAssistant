// Ported from PaymentDetailDialog in Web's PaymentHistoryPanel.jsx.
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { AppText, Badge, Button, LoadingState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { paymentsApi } from "@/src/services/subscriptionService";
import { Payment } from "@/src/types/subscription";
import { formatDateTime, formatMoney, getDetailErrorMessage } from "@/src/utils/paymentPresentation";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

type PaymentDetailSheetProps = {
  paymentId: string | null;
  summary: Payment | null;
  visible: boolean;
  onClose: () => void;
};

function DetailRow({ label, value, strikeThrough = false }: { label: string; value: string; strikeThrough?: boolean }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color={colors.subtle} style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={[styles.rowValue, strikeThrough && styles.originalAmount]}>{value}</AppText>
    </View>
  );
}

export function PaymentDetailSheet({ paymentId, summary, visible, onClose }: PaymentDetailSheetProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible || !paymentId) return;
    let active = true;
    setLoading(true);
    setError("");

    paymentsApi
      .getMyPayment(paymentId)
      .then((response) => {
        if (!active) return;
        setPayment(response.data ?? null);
      })
      .catch((requestError) => {
        if (!active) return;
        setPayment(null);
        setError(getDetailErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visible, paymentId]);

  if (!paymentId) return null;
  const current = payment ?? summary;
  const hasDiscount = typeof payment?.amount === "number" && typeof payment.originalAmount === "number"
    && payment.amount < payment.originalAmount;
  const hasSale = Boolean(payment?.saleCampaignId || payment?.saleCampaignName || payment?.saleBadgeText || (payment?.bonusCredit ?? 0) > 0);
  const hasCredit = typeof payment?.baseCredit === "number" || typeof payment?.grantedCredit === "number";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="caption" color={colors.subtle}>
              Chi tiết giao dịch
            </AppText>
            <AppText variant="h3">{current?.planName || "Giao dịch MediMate+"}</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <LoadingState title="Đang tải chi tiết giao dịch..." />
          ) : error ? (
            <View style={styles.errorGroup}>
              <AppText color={colors.danger}>{error}</AppText>
            </View>
          ) : payment ? (
            <View style={styles.grid}>
              <DetailRow label="Mã thanh toán" value={payment.id || "—"} />
              <DetailRow label="Gói dịch vụ" value={payment.planName || "—"} />
              <View style={styles.row}>
                <AppText variant="caption" color={colors.subtle}>
                  Trạng thái
                </AppText>
                <PaymentStatusBadge payment={payment} />
              </View>
              {hasDiscount ? <DetailRow label="Giá gốc" value={formatMoney(payment.originalAmount, payment.currency)} strikeThrough /> : null}
              {hasDiscount && (payment.discountAmount ?? 0) > 0 ? <DetailRow label="Giảm giá" value={formatMoney(payment.discountAmount, payment.currency)} /> : null}
              <DetailRow label="Số tiền giao dịch" value={formatMoney(payment.amount, payment.currency)} />
              {hasSale || hasCredit ? (
                <View style={styles.saleSnapshot}>
                  <AppText variant="bodyStrong" color={colors.teal}>{hasSale ? "Ưu đãi của giao dịch" : "Quyền lợi theo giao dịch"}</AppText>
                  {hasSale ? <Badge tone="warning">{payment.saleBadgeText || "Ưu đãi"}</Badge> : null}
                  {payment.saleCampaignName ? <AppText variant="bodyStrong">{payment.saleCampaignName}</AppText> : null}
                  {typeof payment.baseCredit === "number" ? <DetailRow label="Lượt gốc" value={`${payment.baseCredit.toLocaleString("vi-VN")} lượt`} /> : null}
                  {(payment.bonusCredit ?? 0) > 0 ? <DetailRow label="Lượt khuyến mãi" value={`+${payment.bonusCredit!.toLocaleString("vi-VN")} lượt`} /> : null}
                  {typeof payment.grantedCredit === "number" ? <DetailRow label="Tổng lượt theo giao dịch" value={`${payment.grantedCredit.toLocaleString("vi-VN")} lượt`} /> : null}
                  <AppText variant="caption" color={colors.muted}>
                    Thông tin được lưu tại thời điểm tạo giao dịch. Số lượt được cộng khi thanh toán được xác nhận thành công.
                  </AppText>
                </View>
              ) : null}
              <DetailRow label="Cổng thanh toán" value={payment.paymentProvider || payment.provider || "—"} />
              <DetailRow label="Mã giao dịch" value={payment.transactionReference || "—"} />
              <DetailRow label="Ngày tạo" value={formatDateTime(payment.createdAt)} />
              <DetailRow label="Ngày thanh toán" value={formatDateTime(payment.paidAt)} />
              <DetailRow label="Cập nhật lần cuối" value={formatDateTime(payment.updatedAt)} />
            </View>
          ) : null}
        </ScrollView>

        {error ? (
          <View style={styles.footer}>
            <Button variant="secondary" fullWidth onPress={onClose}>
              Đóng
            </Button>
          </View>
        ) : null}
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
  },
  errorGroup: {
    padding: spacing.lg,
  },
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: spacing.md,
  },
  rowLabel: {
    flexShrink: 1,
    maxWidth: "45%",
  },
  rowValue: {
    flex: 1,
    textAlign: "right",
  },
  originalAmount: {
    textDecorationLine: "line-through",
    color: colors.subtle,
  },
  saleSnapshot: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
  },
  footer: {
    padding: spacing.lg,
  },
});
