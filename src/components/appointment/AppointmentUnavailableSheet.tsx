// Web has no appointment-booking feature at all — no backend endpoint
// (confirmed against the live Swagger contract), no page, only a disabled
// "Chưa hỗ trợ đặt lịch" button inside doctor detail. This module does not
// invent booking functionality; it only makes that unavailable state
// explicit and actionable (tap for alternatives) instead of a silently
// inert disabled button, which reads poorly on touch UIs — this is a
// mobile UX adaptation, not a business-logic addition.
import { Linking, Modal, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { CalendarClock, MessageCircle, Phone, X } from "lucide-react-native";

import { AppText, Button } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";

type AppointmentUnavailableSheetProps = {
  visible: boolean;
  onClose: () => void;
  facilityPhone?: string;
};

export function AppointmentUnavailableSheet({ visible, onClose, facilityPhone }: AppointmentUnavailableSheetProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.iconMark}>
              <CalendarClock size={20} color={colors.limeDark} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <X size={18} color={colors.ink} />
            </Pressable>
          </View>

          <AppText variant="h3">Đặt lịch khám chưa khả dụng</AppText>
          <AppText color={colors.muted}>
            MediMate AI chưa hỗ trợ đặt lịch khám trực tuyến. Bạn có thể liên hệ trực tiếp cơ sở y tế hoặc trò chuyện với
            trợ lý AI để được hướng dẫn thêm.
          </AppText>

          <View style={styles.actions}>
            {facilityPhone ? (
              <Button
                fullWidth
                onPress={() => {
                  Linking.openURL(`tel:${facilityPhone.replace(/\s+/g, "")}`);
                  onClose();
                }}
              >
                <View style={styles.actionInline}>
                  <Phone size={16} color={colors.ink} />
                  <AppText variant="bodyStrong">Gọi cơ sở y tế</AppText>
                </View>
              </Button>
            ) : null}
            <Button
              variant="secondary"
              fullWidth
              onPress={() => {
                onClose();
                router.push(ROUTES.PATIENT.CHAT);
              }}
            >
              <View style={styles.actionInline}>
                <MessageCircle size={16} color={colors.ink} />
                <AppText variant="bodyStrong">Trò chuyện với AI</AppText>
              </View>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(11,20,17,0.44)",
  },
  sheet: {
    gap: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.paper,
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconMark: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  actions: {
    gap: spacing.sm,
  },
  actionInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
