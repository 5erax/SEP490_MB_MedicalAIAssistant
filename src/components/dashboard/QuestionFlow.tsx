import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { AnswerValue, ClinicalQuestion } from "@/src/types/symptomAnalysis";
import { isClinicalQuestionAnswered } from "@/src/utils/clinicalQuestions";
import { AnswerButtons } from "./AnswerButtons";

type QuestionFlowProps = {
  questions: ClinicalQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, AnswerValue>;
  answeredCount: number;
  submitting: boolean;
  canSubmitAnswers: boolean;
  onAnswerChange: (questionId: string, answer: AnswerValue) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function QuestionFlow({
  questions,
  currentQuestionIndex,
  answers,
  answeredCount,
  submitting,
  canSubmitAnswers,
  onAnswerChange,
  onPrevious,
  onNext,
  onSubmit,
  onReset,
}: QuestionFlowProps) {
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswered = isClinicalQuestionAnswered(currentQuestion, answers[currentQuestion.questionId]);
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <Card variant="hard" style={styles.card}>
      <View style={styles.topLine}>
        <AppText variant="caption" color={colors.subtle}>
          Câu {currentQuestionIndex + 1}/{questions.length}
        </AppText>
        <AppText variant="bodyStrong">{progressPercent}%</AppText>
      </View>

      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
      >
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      <AppText variant="h3">{currentQuestion.questionText}</AppText>

      <AnswerButtons
        question={currentQuestion}
        answer={answers[currentQuestion.questionId]}
        onChange={(answer) => onAnswerChange(currentQuestion.questionId, answer)}
      />

      <View style={styles.actions}>
        <Button variant="ghost" size="sm" disabled={submitting} onPress={onReset}>
          Quay lại biểu mẫu
        </Button>
        <View style={styles.navGroup}>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentQuestionIndex === 0 || submitting}
            onPress={onPrevious}
          >
            Câu trước
          </Button>
          {isLastQuestion ? (
            <Button size="sm" disabled={!canSubmitAnswers} onPress={onSubmit}>
              {submitting ? (
                <View style={styles.loadingLabel}>
                  <ActivityIndicator color={colors.ink} size="small" />
                  <AppText variant="bodyStrong">Đang tạo gợi ý...</AppText>
                </View>
              ) : (
                "Xem gợi ý"
              )}
            </Button>
          ) : (
            <Button size="sm" disabled={!currentAnswered || submitting} onPress={onNext}>
              Câu tiếp theo
            </Button>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  topLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  actions: {
    gap: spacing.md,
  },
  navGroup: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  loadingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
