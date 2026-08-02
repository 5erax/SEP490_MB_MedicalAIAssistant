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
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { History, ShieldCheck } from "lucide-react-native";

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

      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <AppText variant="eyebrow" color={colors.limeDark}>
            Tư vấn chuyên khoa
          </AppText>
          <AppText variant="h1">Gợi ý chuyên khoa qua triệu chứng</AppText>
          <AppText color={colors.muted}>
            Mô tả dấu hiệu bạn đang gặp. MediMate sẽ hỏi thêm một số câu ngắn trước khi gợi ý chuyên khoa và cơ sở y
            tế phù hợp.
          </AppText>
        </View>
        <Button variant="secondary" size="sm" onPress={() => setHistoryVisible(true)}>
          <View style={styles.historyButtonInline}>
            <History size={16} color={colors.ink} />
            <AppText variant="bodyStrong">Lịch sử</AppText>
          </View>
        </Button>
      </View>

      <View style={styles.scopeNote}>
        <ShieldCheck size={18} color={colors.teal} />
        <AppText variant="caption" color={colors.muted} style={styles.scopeNoteText}>
          Kết quả không thay thế chẩn đoán hoặc điều trị của bác sĩ.
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
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerTextGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  historyButtonInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
  stepper: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  stepItem: {
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
    backgroundColor: colors.limeDark,
  },
  stepDotComplete: {
    backgroundColor: colors.teal,
  },
  skeletonCard: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.xl,
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
