import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react-native";

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
    <>
      <Card variant="hard" style={styles.card}>
        <View style={styles.topLine}>
          <View style={styles.questionBadge}>
            <AppText variant="caption" color={colors.teal}>
              Câu {currentQuestionIndex + 1}/{questions.length}
            </AppText>
          </View>
          <AppText variant="bodyStrong" color={colors.teal}>
            {progressPercent}%
          </AppText>
        </View>

        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
        >
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.questionBox}>
          <AppText variant="caption" color={colors.subtle}>
            MediMate cần làm rõ
          </AppText>
          <AppText variant="h3">{currentQuestion.questionText}</AppText>
        </View>

        <AnswerButtons
          question={currentQuestion}
          answer={answers[currentQuestion.questionId]}
          onChange={(answer) => onAnswerChange(currentQuestion.questionId, answer)}
        />

        <View style={styles.navGroup}>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentQuestionIndex === 0 || submitting}
            onPress={onPrevious}
            leftIcon={<ArrowLeft size={15} color={colors.ink} />}
          >
            Trước
          </Button>
          {isLastQuestion ? (
            <Button size="sm" disabled={!canSubmitAnswers} onPress={onSubmit} rightIcon={!submitting ? <ArrowRight size={15} color={colors.white} /> : undefined}>
              {submitting ? (
                <View style={styles.loadingLabel}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <AppText variant="bodyStrong" color={colors.white}>
                    Đang tạo...
                  </AppText>
                </View>
              ) : (
                "Xem gợi ý"
              )}
            </Button>
          ) : (
            <Button size="sm" disabled={!currentAnswered || submitting} onPress={onNext} rightIcon={<ArrowRight size={15} color={colors.white} />}>
              Tiếp theo
            </Button>
          )}
        </View>
      </Card>

      <Button
        variant="ghost"
        size="sm"
        fullWidth
        disabled={submitting}
        onPress={onReset}
        leftIcon={<RotateCcw size={15} color={colors.ink} />}
      >
        Quay lại biểu mẫu
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    borderColor: "rgba(8,127,140,0.18)",
  },
  topLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionBadge: {
    minHeight: 30,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  questionBox: {
    gap: spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: colors.teal,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  navGroup: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  loadingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
