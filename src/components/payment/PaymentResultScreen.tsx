import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, Clock3, RefreshCw, ShieldAlert, XCircle } from "lucide-react-native";

import { AppText, Button, Card, Screen } from "@/src/components/ui";
import { useSubscription } from "@/src/hooks/useSubscription";
import { ROUTES } from "@/src/navigation/routes";
import { useAuth } from "@/src/providers";
import { colors, radius, spacing } from "@/src/theme/tokens";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function PaymentResultScreen() {
  const params = useLocalSearchParams<{
    result?: string | string[];
    orderCode?: string | string[];
  }>();
  const { session, isRestoring } = useAuth();
  const {
    checkoutState,
    checkingPayment,
    checkPaymentResult,
  } = useSubscription({ autoResumePending: false });
  const handledOrderCode = useRef("");

  const orderCode = String(firstParam(params.orderCode) ?? "").trim();
  const resultHint = String(firstParam(params.result) ?? "").trim().toLowerCase();
  const validOrderCode = /^\d+$/.test(orderCode) && Number(orderCode) > 0;

  const verifyPayment = useCallback(() => {
    if (!session || isRestoring) return;
    void checkPaymentResult(orderCode);
  }, [checkPaymentResult, isRestoring, orderCode, session]);

  useEffect(() => {
    if (isRestoring || !session) return;
    const key = orderCode || "invalid";
    if (handledOrderCode.current === key) return;
    handledOrderCode.current = key;
    verifyPayment();
  }, [isRestoring, orderCode, session, verifyPayment]);

  const presentation = useMemo(() => {
    if (isRestoring) {
      return {
        tone: "pending" as const,
        title: "Đang khôi phục phiên đăng nhập",
        description: "MediMate sẽ kiểm tra giao dịch ngay khi phiên của bạn sẵn sàng.",
      };
    }

    if (!session) {
      return {
        tone: "auth" as const,
        title: "Cần đăng nhập để kiểm tra giao dịch",
        description: "Thanh toán đang chờ vẫn được lưu. Hãy đăng nhập lại để MediMate xác nhận với PayOS.",
      };
    }

    if (checkoutState.status === "success") {
      return {
        tone: "success" as const,
        title: "Thanh toán thành công",
        description: checkoutState.message,
      };
    }

    if (checkoutState.status === "cancelled") {
      return {
        tone: "cancelled" as const,
        title: "Thanh toán đã hủy",
        description: checkoutState.message,
      };
    }

    if (checkoutState.status === "error") {
      return {
        tone: "error" as const,
        title: validOrderCode ? "Chưa thể xác nhận giao dịch" : "Không thể xác định giao dịch",
        description: checkoutState.message || "Liên kết thanh toán không có mã giao dịch hợp lệ.",
      };
    }

    return {
      tone: "pending" as const,
      title: resultHint === "cancel" ? "Đang kiểm tra trạng thái giao dịch" : "Đang xác nhận thanh toán",
      description:
        checkoutState.message || "MediMate đang kiểm tra trạng thái giao dịch trực tiếp với PayOS.",
    };
  }, [checkoutState.message, checkoutState.status, isRestoring, resultHint, session, validOrderCode]);

  const goToPricing = () => {
    router.replace(session ? ROUTES.PATIENT.PRICING : ROUTES.PUBLIC.PRICING);
  };

  return (
    <Screen padded={false}>
      <View style={styles.root}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <AppText variant="bodyStrong" color={colors.teal}>M</AppText>
          </View>
          <AppText variant="bodyStrong">MediMate</AppText>
        </View>

        <Card style={styles.card}>
          <View style={[styles.iconWrap, styles[`${presentation.tone}Icon`]]}>
            {presentation.tone === "pending" ? <ActivityIndicator size="large" color={colors.teal} /> : null}
            {presentation.tone === "success" ? <CheckCircle2 size={38} color={colors.success} /> : null}
            {presentation.tone === "cancelled" ? <XCircle size={38} color={colors.warning} /> : null}
            {presentation.tone === "error" ? <ShieldAlert size={38} color={colors.danger} /> : null}
            {presentation.tone === "auth" ? <Clock3 size={38} color={colors.warning} /> : null}
          </View>

          <View style={styles.copy}>
            <AppText variant="eyebrow" color={colors.teal}>Kết quả thanh toán</AppText>
            <AppText variant="h2" center>{presentation.title}</AppText>
            <AppText color={colors.muted} center>{presentation.description}</AppText>
          </View>

          {validOrderCode ? (
            <View style={styles.orderCode}>
              <AppText variant="caption" color={colors.muted}>Mã giao dịch</AppText>
              <AppText variant="bodyStrong">{orderCode}</AppText>
            </View>
          ) : null}

          <View style={styles.actions}>
            {presentation.tone === "auth" ? (
              <Button fullWidth onPress={() => router.replace(ROUTES.PUBLIC.LOGIN)}>
                Đăng nhập lại
              </Button>
            ) : null}

            {["pending", "error"].includes(presentation.tone) && session ? (
              <Button
                fullWidth
                disabled={checkingPayment || !validOrderCode}
                leftIcon={
                  checkingPayment
                    ? <ActivityIndicator size="small" color={colors.white} />
                    : <RefreshCw size={18} color={colors.white} />
                }
                onPress={verifyPayment}
              >
                {checkingPayment ? "Đang kiểm tra" : "Kiểm tra lại"}
              </Button>
            ) : null}

            {presentation.tone === "success" ? (
              <Button fullWidth onPress={goToPricing}>Tiếp tục</Button>
            ) : null}

            {presentation.tone !== "success" ? (
              <Button fullWidth variant="secondary" onPress={goToPricing}>
                Quay lại gói dịch vụ
              </Button>
            ) : null}
          </View>
        </Card>

        <AppText variant="caption" color={colors.muted} center style={styles.disclaimer}>
          Trạng thái chỉ được hiển thị sau khi MediMate xác nhận với PayOS; dữ liệu trên đường dẫn không được dùng để tự cấp quyền lợi.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.xl,
    padding: spacing.xl,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  brandMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  card: {
    alignItems: "center",
    gap: spacing.xl,
    paddingVertical: spacing["3xl"],
  },
  iconWrap: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  pendingIcon: {
    backgroundColor: colors.mint,
  },
  successIcon: {
    backgroundColor: colors.successBg,
  },
  cancelledIcon: {
    backgroundColor: colors.warningBg,
  },
  errorIcon: {
    backgroundColor: colors.dangerBg,
  },
  authIcon: {
    backgroundColor: colors.warningBg,
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
  },
  orderCode: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  actions: {
    width: "100%",
    gap: spacing.sm,
  },
  disclaimer: {
    paddingHorizontal: spacing.md,
  },
});
