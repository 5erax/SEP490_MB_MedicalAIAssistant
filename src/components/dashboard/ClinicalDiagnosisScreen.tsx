// Ported from src/pages/MedicalAssistantPage.jsx (Web) — the "Chẩn đoán lâm
// sàng" primary nav item (route /symptom, order 30 right after Dashboard).
// Distinct flow from SpecialtyIntakeScreen: same intake/question UI
// (IntakeForm, QuestionFlow are reused as-is, they're already generic), but
// submits to submit-diagnosis and shows a ranked disease/ICD-10 result
// instead of a department/facility recommendation.
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { History, ShieldCheck } from "lucide-react-native";

import { AppText, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useClinicalDiagnosis } from "@/src/hooks/useClinicalDiagnosis";
import { AnalysisHistorySheet } from "./AnalysisHistorySheet";
import { DiagnosisResultPanel } from "./DiagnosisResultPanel";
import { IntakeForm } from "./IntakeForm";
import { QuestionFlow } from "./QuestionFlow";

const STEP_LABELS = ["Mô tả", "Làm rõ", "Kết quả"];

export function ClinicalDiagnosisScreen() {
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
    setCurrentQuestionIndex,
    setInput,
    startDiagnosis,
    status,
    submitAnswers,
    updateAnswer,
  } = useClinicalDiagnosis();

  const [historyVisible, setHistoryVisible] = useState(false);

  const showIntakeForm = ["idle", "loading-questions", "no-questions"].includes(status);
  const showQuestionFlow = ["questions", "submitting"].includes(status) && questions[currentQuestionIndex];
  const activeStep = status === "result" ? 2 : ["questions", "submitting"].includes(status) ? 1 : 0;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <AppText variant="eyebrow" color={colors.teal}>
            Chẩn đoán lâm sàng
          </AppText>
          <AppText variant="h1">Phân tích lâm sàng qua triệu chứng</AppText>
          <AppText color={colors.muted}>
            Mô tả dấu hiệu bạn đang gặp. MediMate sẽ hỏi thêm một số câu ngắn trước khi tổng hợp các khả năng bệnh
            tham khảo, kèm mã ICD-10.
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
          Kết quả chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.
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
          <EmptyState title="Không thể kết nối dịch vụ chẩn đoán" description={error} />
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
        <DiagnosisResultPanel result={result} onNewSymptom={() => resetDiagnosis({ clearInput: true })} />
      ) : null}

      <AnalysisHistorySheet visible={historyVisible} onClose={() => setHistoryVisible(false)} sessionType="diagnoses" />
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
