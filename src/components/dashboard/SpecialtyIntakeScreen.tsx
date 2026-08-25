// Ported from src/pages/DashboardPage.jsx (Web) — "Tư vấn chuyên khoa".
//
// Deliberate Mobile UX adaptation (flow/data unchanged): on Web, submitting
// the last answer immediately navigates away to /map, so the inline result
// panel is rarely actually seen. On mobile we show the result panel first
// and let the user explicitly tap "Mở bản đồ" — avoids a jarring
// auto-navigation and matches standard mobile UX (confirm before leaving
// the current flow). The destination (Nearby Clinics/Map, same query
// params: source/facilityId/departmentId/sessionId) is unchanged.
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Activity, History, MapPinned, ShieldCheck, Sparkles } from "lucide-react-native";

import { AppText, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useSymptomIntake } from "@/src/hooks/useSymptomIntake";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { useAuth } from "@/src/providers";
import { shouldSetupPatientProfile } from "@/src/utils/roles";
import { getFacilityId, getRecommendedDepartment } from "@/src/utils/facilityRanking";
import { ClinicalAnalysisResult } from "@/src/types/symptomAnalysis";
import { AnalysisHistorySheet } from "./AnalysisHistorySheet";
import { IntakeForm } from "./IntakeForm";
import { dismissProfileNudgeForSession, isProfileNudgeDismissed, ProfileNudgeCard } from "./ProfileNudgeCard";
import { QuestionFlow } from "./QuestionFlow";
import { ResultPanel } from "./ResultPanel";

const STEP_LABELS = ["Mô tả", "Làm rõ", "Kết quả"];

function openFacilities(result: ClinicalAnalysisResult | null, sessionId: string) {
  const department = getRecommendedDepartment(result);
  const topFacility = result?.recommendedFacilities?.[0] ?? null;
  const facilityId = getFacilityId(topFacility);

  router.push({
    pathname: "/(patient)/map" as never,
    params: {
      source: "clinical",
      ...(facilityId ? { facilityId } : {}),
      ...(department?.departmentId ? { departmentId: department.departmentId } : {}),
      ...(sessionId ? { sessionId } : {}),
    },
  });
}

export function SpecialtyIntakeScreen() {
  const { session } = useAuth();
  const {
    answeredCount,
    answers,
    canSubmitAnswers,
    currentQuestionIndex,
    error,
    input,
    loading,
    questions,
    resetDiagnosis,
    result,
    sessionId,
    setCurrentQuestionIndex,
    setInput,
    startDiagnosis,
    status,
    submitAnswers,
    updateAnswer,
  } = useSymptomIntake();

  const { userLocation, locationStatus, requestUserLocation } = useUserLocation();
  const [historyVisible, setHistoryVisible] = useState(false);
  const [profileNudgeVisible, setProfileNudgeVisible] = useState(
    shouldSetupPatientProfile(session) && !isProfileNudgeDismissed(),
  );

  const showIntakeForm = ["idle", "loading-questions", "no-questions"].includes(status);
  const showQuestionFlow = ["questions", "submitting"].includes(status) && questions[currentQuestionIndex];
  const activeStep = status === "result" ? 2 : ["questions", "submitting"].includes(status) ? 1 : 0;
  const progressLabel = activeStep === 0 ? "Bắt đầu mô tả" : activeStep === 1 ? `${answeredCount}/${questions.length} câu đã trả lời` : "Đã có gợi ý";

  useEffect(() => {
    if (status !== "result") return;
    // Once the user has seen the result inline (see module note above), the
    // Web behavior of jumping straight to the map is offered as an explicit
    // action instead — nothing to auto-run here.
  }, [status]);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      {showIntakeForm && profileNudgeVisible ? (
        <ProfileNudgeCard
          onDismiss={() => {
            dismissProfileNudgeForSession();
            setProfileNudgeVisible(false);
          }}
        />
      ) : null}

      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroMark}>
            <Sparkles size={20} color={colors.white} />
          </View>
        </View>
        <AppText variant="eyebrow" color={colors.teal}>
          Tư vấn chuyên khoa
        </AppText>
        <AppText variant="h1" style={styles.heroTitle}>
          Tìm đúng nơi khám từ triệu chứng của bạn
        </AppText>
        <AppText color={colors.muted} style={styles.heroCopy}>
          Mô tả điều đang gặp, trả lời vài câu ngắn và nhận gợi ý chuyên khoa cùng cơ sở y tế phù hợp.
        </AppText>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaPill}>
            <Activity size={14} color={colors.teal} />
            <AppText variant="caption" color={colors.teal}>
              {progressLabel}
            </AppText>
          </View>
          <View style={styles.heroMetaPillMuted}>
            <MapPinned size={14} color={colors.amber} />
            <AppText variant="caption" color={colors.amber}>
              Có gợi ý cơ sở
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.segmentedControl}>
        <Pressable accessibilityRole="button" style={[styles.segmentItem, styles.segmentItemActive]}>
          <AppText variant="bodyStrong" color={colors.ink}>
            Trò chuyện
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setHistoryVisible(true)} style={({ pressed }) => [styles.segmentItem, pressed && styles.pressed]}>
          <History size={15} color={colors.ink} />
          <AppText variant="bodyStrong" color={colors.ink}>
            Lịch sử
          </AppText>
        </Pressable>
      </View>

      <View style={styles.flowCard}>
        <View style={styles.scopeNote}>
          <ShieldCheck size={17} color={colors.teal} />
          <AppText variant="caption" color={colors.muted} style={styles.scopeNoteText}>
            Kết quả chỉ dùng để định hướng, không thay thế chẩn đoán hoặc điều trị của bác sĩ.
          </AppText>
        </View>
        <View style={styles.stepper}>
          {STEP_LABELS.map((label, index) => (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  index === activeStep && styles.stepDotActive,
                  index < activeStep && styles.stepDotComplete,
                ]}
              >
                <AppText variant="caption" color={index <= activeStep ? colors.white : colors.subtle}>
                  {index + 1}
                </AppText>
              </View>
              <AppText variant="caption" color={index === activeStep ? colors.ink : colors.subtle}>
                {label}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      {showIntakeForm ? (
        <IntakeForm input={input} onChangeInput={setInput} loading={loading} onSubmit={() => startDiagnosis()} />
      ) : null}

      {status === "loading-questions" ? (
        <View style={styles.skeletonCard}>
          <SkeletonGroup lines={4} />
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorGroup}>
          <EmptyState title="Không thể kết nối dịch vụ gợi ý chuyên khoa" description={error} />
          <View style={styles.recoveryActions}>
            <Button variant="secondary" onPress={() => resetDiagnosis()}>
              Quay lại biểu mẫu
            </Button>
            <Button onPress={() => startDiagnosis()}>Thử lại</Button>
          </View>
        </View>
      ) : null}

      {status === "no-questions" ? (
        <View style={styles.errorGroup}>
          <EmptyState
            title="AI chưa có câu hỏi phù hợp"
            description="Hãy mô tả rõ hơn về thời gian xuất hiện, vị trí đau, mức độ và triệu chứng đi kèm."
          />
          <View style={styles.recoveryActions}>
            <Button variant="secondary" onPress={() => resetDiagnosis()}>
              Quay lại biểu mẫu
            </Button>
            <Button onPress={() => startDiagnosis()}>Thử lại với mô tả hiện tại</Button>
          </View>
        </View>
      ) : null}

      {showQuestionFlow ? (
        <QuestionFlow
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          answeredCount={answeredCount}
          submitting={status === "submitting"}
          canSubmitAnswers={canSubmitAnswers}
          onAnswerChange={updateAnswer}
          onPrevious={() => setCurrentQuestionIndex((index: number) => Math.max(0, index - 1))}
          onNext={() => setCurrentQuestionIndex((index: number) => Math.min(questions.length - 1, index + 1))}
          onSubmit={submitAnswers}
          onReset={() => resetDiagnosis()}
        />
      ) : null}

      {status === "result" ? (
        <ResultPanel
          result={result}
          userLocation={userLocation}
          locationStatus={locationStatus}
          onRequestLocation={requestUserLocation}
          onOpenMap={() => openFacilities(result, sessionId)}
          onNewSymptom={() => resetDiagnosis({ clearInput: true })}
        />
      ) : null}

      <AnalysisHistorySheet visible={historyVisible} onClose={() => setHistoryVisible(false)} sessionType="department" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing["4xl"],
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  hero: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.22)",
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
    padding: spacing.xl,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.1,
    shadowRadius: 26,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroMark: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.teal,
  },
  heroTitle: {
    maxWidth: 310,
  },
  heroCopy: {
    maxWidth: 310,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  heroMetaPill: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
  },
  heroMetaPillMuted: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.md,
  },
  scopeNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  scopeNoteText: {
    flex: 1,
  },
  segmentedControl: {
    alignSelf: "center",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    padding: spacing.xs,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  segmentItem: {
    minHeight: 38,
    minWidth: 112,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  segmentItemActive: {
    backgroundColor: colors.paper,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 1,
  },
  flowCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.84)",
    padding: spacing.md,
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  stepItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.line,
  },
  stepDotActive: {
    backgroundColor: colors.teal,
  },
  stepDotComplete: {
    backgroundColor: colors.teal,
  },
  skeletonCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.xl,
  },
  errorGroup: {
    gap: spacing.md,
  },
  recoveryActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
