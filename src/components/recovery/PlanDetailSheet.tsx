import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ChevronDown, ChevronUp, Moon, ShieldAlert, X } from "lucide-react-native";

import { AppText, Badge, Button, LoadingState } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RecoveryPlan, RecoveryPlanPhase } from "@/src/types/recoveryPlan";
import { formatDateOnly, PLAN_STATUS } from "@/src/utils/recoveryPlanPresentation";

function PhaseCard({ phase }: { phase: RecoveryPlanPhase }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.phaseCard}>
      <View style={styles.phaseHeader}>
        <View style={styles.phaseHeaderText}>
          <AppText variant="bodyStrong">{phase.phaseName}</AppText>
          {phase.startDay !== undefined && phase.endDay !== undefined ? (
            <AppText variant="caption" color={colors.subtle}>
              Ngày {phase.startDay}–{phase.endDay}
            </AppText>
          ) : null}
        </View>
        {(phase.nutrientTargets?.length ?? 0) > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setExpanded((current) => !current)} hitSlop={6}>
            {expanded ? <ChevronUp size={18} color={colors.teal} /> : <ChevronDown size={18} color={colors.teal} />}
          </Pressable>
        ) : null}
      </View>

      {phase.instruction ? <AppText color={colors.muted}>{phase.instruction}</AppText> : null}

      {phase.sleepHoursPerDay || phase.restHoursPerDay ? (
        <View style={styles.restRow}>
          <Moon size={14} color={colors.teal} />
          <AppText variant="caption" color={colors.subtle}>
            {phase.sleepHoursPerDay ? `Ngủ ${phase.sleepHoursPerDay}h/ngày` : ""}
            {phase.sleepHoursPerDay && phase.restHoursPerDay ? " · " : ""}
            {phase.restHoursPerDay ? `Nghỉ ${phase.restHoursPerDay}h/ngày` : ""}
          </AppText>
        </View>
      ) : null}

      {expanded
        ? (phase.nutrientTargets ?? []).map((nutrient) => (
            <View key={nutrient.id} style={styles.nutrientCard}>
              <View style={styles.nutrientHeader}>
                <AppText variant="bodyStrong">{nutrient.nutrientName}</AppText>
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
                    {food.suggestedServing ? ` — ${food.suggestedServing}` : ""}
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="caption" color={colors.subtle}>
              Kế hoạch phục hồi
            </AppText>
            <AppText variant="h3">{plan?.planName ?? "—"}</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {state === "loading" ? (
            <LoadingState title="Đang tải chi tiết kế hoạch..." />
          ) : plan ? (
            <>
              <View style={styles.metaCard}>
                {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
                {plan.summary ? <AppText color={colors.muted}>{plan.summary}</AppText> : null}
                <View style={styles.metaRow}>
                  {plan.durationDays ? (
                    <View>
                      <AppText variant="caption" color={colors.subtle}>
                        Thời lượng
                      </AppText>
                      <AppText variant="bodyStrong">{plan.durationDays} ngày</AppText>
                    </View>
                  ) : null}
                  {plan.startDate ? (
                    <View>
                      <AppText variant="caption" color={colors.subtle}>
                        Bắt đầu
                      </AppText>
                      <AppText variant="bodyStrong">{formatDateOnly(plan.startDate)}</AppText>
                    </View>
                  ) : null}
                  {plan.endDate ? (
                    <View>
                      <AppText variant="caption" color={colors.subtle}>
                        Kết thúc
                      </AppText>
                      <AppText variant="bodyStrong">{formatDateOnly(plan.endDate)}</AppText>
                    </View>
                  ) : null}
                </View>
              </View>

              {(plan.phases ?? []).map((phase) => (
                <PhaseCard key={phase.id} phase={phase} />
              ))}

              {plan.recheckInstruction ? (
                <View style={styles.recheckCard}>
                  <ShieldAlert size={16} color={colors.warning} />
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
  metaCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  phaseCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  phaseHeaderText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  restRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  nutrientCard: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
  },
  nutrientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
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
