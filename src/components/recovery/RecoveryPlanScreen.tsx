// Ported from src/pages/RecoveryPlanPage.jsx (Web) — this is a static
// "not available yet" placeholder on Web too (no API calls, explicitly
// labeled "Chưa khả dụng trên MediMate"), even though the backend exposes
// RecoveryPlanRequests/DoctorRecoveryPlanRequests endpoints. Per source-
// of-truth rules, mobile mirrors Web's actual current behavior — a real
// recovery-plan feature is not built here since Web doesn't have one yet.
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from "lucide-react-native";

import { AppText, Button, Card, Screen } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";

const PREPARATION_ITEMS = [
  {
    icon: FileText,
    title: "Mang theo hướng dẫn sau khám",
    text: "Giữ lại đơn thuốc, giấy hẹn và các chỉ dẫn được cơ sở y tế cung cấp.",
  },
  {
    icon: HeartPulse,
    title: "Ghi nhận thay đổi đáng chú ý",
    text: "Theo dõi thời điểm xuất hiện, mức độ và diễn biến để trao đổi rõ hơn khi tái khám.",
  },
  {
    icon: CalendarCheck,
    title: "Chuẩn bị cho lần tái khám",
    text: "Ghi lại mốc tái khám và những câu hỏi bạn muốn trao đổi trực tiếp với nhân viên y tế.",
  },
];

const NEXT_STEPS = [
  "Làm rõ triệu chứng trước khi chọn chuyên khoa.",
  "Tìm cơ sở y tế đang có trên hệ thống.",
  "Làm theo kế hoạch được nhân viên y tế hướng dẫn sau khi khám.",
];

export function RecoveryPlanScreen() {
  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Card variant="dark" style={styles.heroCard}>
        <View style={styles.badgeInline}>
          <ShieldCheck size={13} color={colors.teal} />
          <AppText variant="caption" color={colors.teal}>
            Chưa khả dụng trên MediMate
          </AppText>
        </View>
        <AppText variant="eyebrow" color={colors.lime}>
          Theo dõi sau khám
        </AppText>
        <AppText variant="h1" color={colors.white}>
          Kế hoạch phục hồi chưa được mở
        </AppText>
        <AppText color="rgba(255,255,255,0.78)">
          MediMate hiện chưa tạo, lưu hoặc theo dõi kế hoạch phục hồi cá nhân. Kế hoạch chăm sóc cần dựa trên hướng dẫn
          trực tiếp từ bác sĩ hoặc cơ sở y tế của bạn.
        </AppText>

        <View style={styles.actions}>
          <Button onPress={() => router.replace(ROUTES.PATIENT.HOME)}>
            <View style={styles.actionInline}>
              <Stethoscope size={17} color={colors.ink} />
              <AppText variant="bodyStrong">Phân tích triệu chứng</AppText>
            </View>
          </Button>
          <Button variant="secondary" onPress={() => router.push(ROUTES.PATIENT.MAP)}>
            <View style={styles.actionInline}>
              <MapPin size={17} color={colors.ink} />
              <AppText variant="bodyStrong">Tìm cơ sở y tế</AppText>
            </View>
          </Button>
        </View>

        <AppText variant="caption" color="rgba(255,255,255,0.62)">
          Trang này không yêu cầu và không lưu thông tin sức khỏe của bạn.
        </AppText>
      </Card>

      <Card variant="soft" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconMark}>
            <ClipboardCheck size={20} color={colors.teal} />
          </View>
          <View style={styles.cardHeaderText}>
            <AppText variant="caption" color={colors.subtle}>
              Bạn có thể làm ngay
            </AppText>
            <AppText variant="h3">Chuẩn bị bước tiếp theo</AppText>
          </View>
        </View>
        <View style={styles.stepList}>
          {NEXT_STEPS.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <AppText variant="caption" color={colors.limeDark} style={styles.stepIndex}>
                {String(index + 1).padStart(2, "0")}
              </AppText>
              <AppText color={colors.muted} style={styles.stepText}>
                {step}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card variant="hard" style={styles.card}>
        <AppText variant="caption" color={colors.subtle}>
          Trước lần tái khám
        </AppText>
        <AppText variant="h3">Những thông tin nên chuẩn bị</AppText>
        <AppText color={colors.muted}>
          Đây là gợi ý chuẩn bị chung, không phải kế hoạch điều trị và không thay thế hướng dẫn từ người có chuyên môn.
        </AppText>
        <View style={styles.preparationList}>
          {PREPARATION_ITEMS.map(({ icon: Icon, title, text }) => (
            <View key={title} style={styles.preparationRow}>
              <View style={styles.iconMark}>
                <Icon size={18} color={colors.teal} />
              </View>
              <View style={styles.preparationText}>
                <AppText variant="bodyStrong">{title}</AppText>
                <AppText variant="caption" color={colors.muted}>
                  {text}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card variant="dark" style={styles.careNoteCard}>
        <View style={styles.careNoteIconMark}>
          <HeartPulse size={20} color={colors.lime} />
        </View>
        <View style={styles.careNoteText}>
          <AppText variant="caption" color={colors.lime}>
            Khi cần hỗ trợ
          </AppText>
          <AppText variant="h3" color={colors.white}>
            Ưu tiên hướng dẫn từ cơ sở y tế
          </AppText>
          <AppText color="rgba(255,255,255,0.72)">
            Nếu tình trạng thay đổi hoặc bạn lo lắng về dấu hiệu đang gặp, hãy liên hệ cơ sở y tế phù hợp. Trong tình
            huống khẩn cấp, hãy tìm trợ giúp y tế ngay.
          </AppText>
        </View>
        <Button variant="secondary" size="sm" onPress={() => router.push(ROUTES.PATIENT.MAP)}>
          <View style={styles.actionInline}>
            <AppText variant="bodyStrong">Xem cơ sở y tế</AppText>
            <ArrowRight size={16} color={colors.ink} />
          </View>
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  heroCard: {
    gap: spacing.md,
  },
  badgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  card: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  iconMark: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  stepList: {
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
  },
  stepIndex: {
    width: 24,
  },
  stepText: {
    flex: 1,
  },
  preparationList: {
    gap: spacing.md,
  },
  preparationRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  preparationText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  careNoteCard: {
    gap: spacing.md,
  },
  careNoteIconMark: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  careNoteText: {
    gap: spacing.xs,
  },
});
