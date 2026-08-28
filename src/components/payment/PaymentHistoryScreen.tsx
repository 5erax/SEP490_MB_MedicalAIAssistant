// Ported from src/components/payments/PaymentHistoryPanel.jsx (Web) — a
// standalone screen on mobile for now (Web nests it as a tab inside
// UserProfilePage / Module 13, which doesn't exist yet); will be linked
// from Profile once that module lands.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react-native";

import { AppText, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { MoreBackHeader } from "@/src/components/more";
import { paymentsApi } from "@/src/services/subscriptionService";
import { clearPendingPaymentCheckout, getPendingPaymentCheckout } from "@/src/services/paymentCheckoutStorage";
import { useToast } from "@/src/hooks";
import { Payment } from "@/src/types/subscription";
import {
  canReconcilePayment,
  formatDateTime,
  formatMoney,
  getHistoryErrorMessage,
  getReconcileErrorMessage,
  normalizePaymentPage,
  NormalizedPaymentPage,
} from "@/src/utils/paymentPresentation";
import { PaymentDetailSheet } from "./PaymentDetailSheet";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

const EMPTY_PAGE: NormalizedPaymentPage = { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0 };

function PaymentRow({
  payment,
  reconciling,
  onPress,
  onReconcile,
}: {
  payment: Payment;
  reconciling: boolean;
  onPress: () => void;
  onReconcile: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.rowMain}>
        <AppText variant="bodyStrong">{payment.planName || "Giao dịch MediMate+"}</AppText>
        <AppText variant="caption" color={colors.subtle}>
          {payment.paymentProvider || payment.provider || "—"} · {payment.transactionReference || "Chưa có mã giao dịch"}
        </AppText>
        <AppText variant="caption" color={colors.subtle}>
          {formatDateTime(payment.createdAt)}
        </AppText>
        {canReconcilePayment(payment) ? (
          <Pressable
            accessibilityRole="button"
            disabled={reconciling}
            onPress={(event) => {
              event.stopPropagation();
              onReconcile();
            }}
            style={styles.reconcileButton}
          >
            {reconciling ? (
              <ActivityIndicator size="small" color={colors.teal} />
            ) : (
              <RefreshCw size={14} color={colors.teal} />
            )}
            <AppText variant="caption" color={colors.teal}>
              {reconciling ? "Đang kiểm tra..." : "Kiểm tra với PayOS"}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.rowMeta}>
        <PaymentStatusBadge payment={payment} />
        <AppText variant="bodyStrong">{formatMoney(payment.amount, payment.currency)}</AppText>
      </View>
    </Pressable>
  );
}

export function PaymentHistoryScreen({ showBackHeader = true }: { showBackHeader?: boolean }) {
  const { showToast } = useToast();
  const [pageNumber, setPageNumber] = useState(1);
  const [page, setPage] = useState<NormalizedPaymentPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await paymentsApi.getMyPayments(targetPage, 10);
      setPage(normalizePaymentPage(response, targetPage));
    } catch (requestError) {
      setPage(normalizePaymentPage(null, targetPage));
      setError(getHistoryErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(pageNumber);
  }, [pageNumber, load]);

  async function handleReconcile(payment: Payment) {
    if (!payment.transactionReference) return;
    setReconcilingId(payment.id);
    try {
      const response = await paymentsApi.reconcilePayOs(payment.transactionReference);
      const result = response.data;
      const terminalStatus = String(result?.paymentStatus ?? "").toLowerCase();
      if (
        result?.isPaid
        || result?.isCancelled
        || ["paid", "completed", "success", "succeeded", "failed", "cancelled", "canceled", "expired"].includes(terminalStatus)
      ) {
        const pendingCheckout = await getPendingPaymentCheckout();
        if (pendingCheckout?.orderCode === payment.transactionReference) {
          await clearPendingPaymentCheckout();
        }
      }
      await load(pageNumber);
      showToast({ type: "success", message: "Đã cập nhật trạng thái giao dịch." });
    } catch (requestError) {
      showToast({ type: "error", message: getReconcileErrorMessage(requestError) });
    } finally {
      setReconcilingId(null);
    }
  }

  const firstItem = page.totalCount ? (page.pageNumber - 1) * page.pageSize + 1 : 0;
  const lastItem = Math.min(page.totalCount, firstItem + page.items.length - 1);

  return (
    <Screen padded={false} style={styles.screen}>
      {showBackHeader ? (
        <View style={styles.backHeader}>
          <MoreBackHeader title="Lịch sử giao dịch" />
        </View>
      ) : null}

      <View style={styles.header}>
        <AppText variant="h2">Lịch sử thanh toán</AppText>
        <AppText variant="caption" color={colors.subtle}>
          {page.totalCount} giao dịch
        </AppText>
      </View>

      {loading && page.items.length === 0 ? (
        <View style={styles.padded}>
          <SkeletonGroup lines={5} />
        </View>
      ) : error ? (
        <View style={styles.padded}>
          <EmptyState title="Không tải được lịch sử thanh toán" description={error} />
          <Button variant="secondary" onPress={() => load(pageNumber)} style={styles.retryButton}>
            Thử lại
          </Button>
        </View>
      ) : page.items.length === 0 ? (
        <View style={styles.padded}>
          <EmptyState
            title="Chưa có giao dịch"
            description="Các giao dịch thanh toán sẽ xuất hiện tại đây sau khi bạn đăng ký gói dịch vụ."
          />
        </View>
      ) : (
        <FlatList
          data={page.items}
          keyExtractor={(payment, index) => String(payment.id || payment.transactionReference || index)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(pageNumber, true)} />}
          renderItem={({ item }) => (
            <PaymentRow
              payment={item}
              reconciling={reconcilingId === item.id}
              onPress={() => setSelectedPayment(item)}
              onReconcile={() => handleReconcile(item)}
            />
          )}
        />
      )}

      {page.totalPages > 1 && !error ? (
        <View style={styles.pagination}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trang trước"
            disabled={pageNumber <= 1 || loading}
            onPress={() => setPageNumber((current) => Math.max(1, current - 1))}
            style={[styles.pageButton, (pageNumber <= 1 || loading) && styles.pageButtonDisabled]}
          >
            <ChevronLeft size={18} color={colors.ink} />
          </Pressable>
          <View style={styles.pageInfo}>
            <AppText variant="caption" color={colors.subtle}>
              Trang {page.pageNumber}/{page.totalPages} · {firstItem}–{lastItem}/{page.totalCount}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trang sau"
            disabled={pageNumber >= page.totalPages || loading}
            onPress={() => setPageNumber((current) => current + 1)}
            style={[styles.pageButton, (pageNumber >= page.totalPages || loading) && styles.pageButtonDisabled]}
          >
            <ChevronRight size={18} color={colors.ink} />
          </Pressable>
        </View>
      ) : null}

      <PaymentDetailSheet
        paymentId={selectedPayment?.id ?? null}
        summary={selectedPayment}
        visible={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  backHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  padded: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  retryButton: {
    alignSelf: "flex-start",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  rowMain: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  reconcileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  rowMeta: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  pageButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageInfo: {
    flex: 1,
    alignItems: "center",
  },
});
