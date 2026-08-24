import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronUp, Clock3, ClipboardList, Moon, Route, ShieldAlert } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, LoadingState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RecoveryPlan, RecoveryPlanPhase } from "@/src/types/recoveryPlan";
import { formatDateOnly, PLAN_STATUS } from "@/src/utils/recoveryPlanPresentation";

function PhaseCard({ phase, index }: { phase: RecoveryPlanPhase; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const nutrientCount = phase.nutrientTargets?.length ?? 0;

  return (
    <View style={styles.phaseCard}>
      <View style={styles.phaseHeader}>
        <View style={styles.phaseNumber}>
          <AppText variant="caption" color={colors.teal}>
            {index + 1}
          </AppText>
        </View>
        <View style={styles.phaseHeaderText}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {phase.phaseName}
          </AppText>
          {phase.startDay !== undefined && phase.endDay !== undefined ? (
            <AppText variant="caption" color={colors.subtle}>
              Ngày {phase.startDay}-{phase.endDay}
            </AppText>
          ) : null}
        </View>
        {nutrientCount > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setExpanded((current) => !current)} style={styles.expandButton} hitSlop={6}>
            {expanded ? <ChevronUp size={18} color={colors.teal} /> : <ChevronDown size={18} color={colors.teal} />}
          </Pressable>
        ) : null}
      </View>

      {phase.instruction ? <AppText color={colors.muted}>{phase.instruction}</AppText> : null}

      {phase.sleepHoursPerDay || phase.restHoursPerDay || nutrientCount > 0 ? (
        <View style={styles.phaseMetaRow}>
          {phase.sleepHoursPerDay || phase.restHoursPerDay ? (
            <View style={styles.phaseChip}>
              <Moon size={13} color={colors.teal} />
              <AppText variant="caption" color={colors.muted}>
                {phase.sleepHoursPerDay ? `Ngủ ${phase.sleepHoursPerDay}h` : ""}
                {phase.sleepHoursPerDay && phase.restHoursPerDay ? " · " : ""}
                {phase.restHoursPerDay ? `Nghỉ ${phase.restHoursPerDay}h` : ""}
              </AppText>
            </View>
          ) : null}
          {nutrientCount > 0 ? (
            <View style={styles.phaseChip}>
              <ClipboardList size={13} color={colors.teal} />
              <AppText variant="caption" color={colors.muted}>
                {nutrientCount} mục dinh dưỡng
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}

      {expanded
        ? (phase.nutrientTargets ?? []).map((nutrient) => (
            <View key={nutrient.id} style={styles.nutrientCard}>
              <View style={styles.nutrientHeader}>
                <AppText variant="bodyStrong" style={styles.nutrientName}>
                  {nutrient.nutrientName}
                </AppText>
                {nutrient.amountPerDay ? (
                  <AppText variant="caption" color={colors.subtle}>
                    {nutrient.amountPerDay} {nutrient.unit}/ngày
                  </AppText>
                ) : null}
              </View>
              {nutrient.instruction ? (
                <AppText variant="caption" color={colors.muted}>
                  {nutrient.instruction}
                </AppText>
              ) : null}
              {(nutrient.foodSources ?? []).map((food) => (
                <View key={food.id} style={styles.foodRow}>
                  <View style={styles.foodDot} />
                  <AppText variant="caption" color={colors.muted} style={styles.foodText}>
                    {food.foodName}
                    {food.suggestedServing ? ` - ${food.suggestedServing}` : ""}
                  </AppText>
                </View>
              ))}
            </View>
          ))
        : null}
    </View>
  );
}

type PlanDetailSheetProps = {
  visible: boolean;
  plan: RecoveryPlan | null;
  state: "idle" | "loading" | "ready" | "error";
  starting: boolean;
  onClose: () => void;
  onStart: (planId: string) => void;
};

export function PlanDetailSheet({ visible, plan, state, starting, onClose, onStart }: PlanDetailSheetProps) {
  const status = plan ? PLAN_STATUS[plan.status] : null;
  const phaseCount = plan?.phases?.length ?? 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onClose} style={styles.backIconButton} hitSlop={8}>
            <ChevronLeft size={21} color={colors.teal} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <AppText variant="caption" color={colors.subtle}>
              Kế hoạch phục hồi
            </AppText>
            <AppText variant="bodyStrong">Chi tiết</AppText>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {state === "loading" ? (
            <LoadingState title="Đang tải chi tiết kế hoạch..." />
          ) : plan ? (
            <>
              <View style={styles.hero}>
                <View style={styles.heroTop}>
                  <View style={styles.heroIcon}>
                    <Route size={24} color={colors.white} />
                  </View>
                  {status ? (
                    <View style={[styles.statusPill, styles[`statusPill_${status.tone}`]]}>
                      <AppText variant="caption" color={colors.ink} numberOfLines={1}>
                        {status.label}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText variant="caption" color="rgba(255,255,255,0.72)">
                  Lộ trình phục hồi
                </AppText>
                <AppText variant="h2" color={colors.white}>
                  {plan.planName}
                </AppText>
                <AppText color="rgba(255,255,255,0.86)">
                  {plan.summary || "Theo dõi từng giai đoạn và bắt đầu khi kế hoạch sẵn sàng."}
                </AppText>
              </View>

              <View style={styles.statsGrid}>
                {plan.durationDays ? (
                  <View style={styles.statCard}>
                    <Clock3 size={16} color={colors.teal} />
                    <AppText variant="caption" color={colors.subtle}>
                      Thời lượng
                    </AppText>
                    <AppText variant="bodyStrong">{plan.durationDays} ngày</AppText>
                  </View>
                ) : null}
                <View style={styles.statCard}>
                  <ClipboardList size={16} color={colors.teal} />
                  <AppText variant="caption" color={colors.subtle}>
                    Giai đoạn
                  </AppText>
                  <AppText variant="bodyStrong">{phaseCount}</AppText>
                </View>
                {plan.startDate ? (
                  <View style={styles.statCard}>
                    <CalendarDays size={16} color={colors.teal} />
                    <AppText variant="caption" color={colors.subtle}>
                      Bắt đầu
                    </AppText>
                    <AppText variant="bodyStrong">{formatDateOnly(plan.startDate)}</AppText>
                  </View>
                ) : null}
                {plan.endDate ? (
                  <View style={styles.statCard}>
                    <CalendarDays size={16} color={colors.teal} />
                    <AppText variant="caption" color={colors.subtle}>
                      Kết thúc
                    </AppText>
                    <AppText variant="bodyStrong">{formatDateOnly(plan.endDate)}</AppText>
                  </View>
                ) : null}
              </View>

              {phaseCount > 0 ? (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionTitleRow}>
                    <ClipboardList size={18} color={colors.teal} />
                    <AppText variant="h3">Giai đoạn thực hiện</AppText>
                  </View>
                  {(plan.phases ?? []).map((phase, index) => (
                    <PhaseCard key={phase.id} phase={phase} index={index} />
                  ))}
                </View>
              ) : null}

              {plan.recheckInstruction ? (
                <View style={styles.recheckCard}>
                  <ShieldAlert size={17} color={colors.warning} />
                  <AppText color={colors.muted} style={styles.recheckText}>
                    {plan.recheckInstruction}
                  </AppText>
                </View>
              ) : null}

              {plan.status === "readyToStart" ? (
                <Button fullWidth disabled={starting} onPress={() => onStart(plan.id)}>
                  {starting ? "Đang bắt đầu..." : "Bắt đầu kế hoạch"}
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
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.22)",
    backgroundColor: colors.mint,
  },
  headerTitleWrap: {
    alignItems: "center",
    gap: spacing.xs / 2,
  },
  headerSpacer: {
    width: 42,
    height: 42,
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
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  statusPill: {
    minWidth: 92,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.paper,
  },
  statusPill_info: {
    backgroundColor: colors.mint,
  },
  statusPill_success: {
    backgroundColor: colors.successBg,
  },
  statusPill_warning: {
    backgroundColor: colors.warningBg,
  },
  statusPill_danger: {
    backgroundColor: colors.dangerBg,
  },
  statusPill_neutral: {
    backgroundColor: colors.paper,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: "46%",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  sectionBlock: {
    gap: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  phaseCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  phaseNumber: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  phaseHeaderText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  expandButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  phaseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  phaseChip: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
    paddingHorizontal: spacing.sm,
  },
  nutrientCard: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
  },
  nutrientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  nutrientName: {
    flex: 1,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  foodDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.teal,
  },
  foodText: {
    flex: 1,
  },
  recheckCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
  },
  recheckText: {
    flex: 1,
  },
});
