import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import {
  getClinicalQuestionAnswerMode,
  getClinicalQuestionAnswerOptions,
  getClinicalQuestionBooleanPrompts,
} from "@/src/utils/clinicalQuestions";
import { AnswerValue, ClinicalQuestion } from "@/src/types/symptomAnalysis";

type AnswerButtonsProps = {
  question: ClinicalQuestion;
  answer: AnswerValue;
  onChange: (answer: AnswerValue) => void;
};

function isPlainObject(value: unknown): value is Record<string, boolean> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function ChoicePill({ label, selected, tone, onPress }: { label: string; selected: boolean; tone: "yes" | "no"; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.pill, selected && styles.pillSelected]}
    >
      {selected ? (
        <View style={styles.pillCheck}>
          <Check size={12} color={colors.white} />
        </View>
      ) : null}
      <AppText variant="bodyStrong" color={selected ? colors.white : colors.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function AnswerButtons({ question, answer, onChange }: AnswerButtonsProps) {
  const mode = getClinicalQuestionAnswerMode(question);

  if (mode === "boolean-list") {
    const prompts = getClinicalQuestionBooleanPrompts(question);
    const current = isPlainObject(answer) ? answer : {};

    return (
      <View style={styles.list}>
        {prompts.map((prompt) => (
          <View key={prompt.key} style={styles.listRow}>
            <AppText variant="bodyStrong" style={styles.listLabel}>
              {prompt.label}
            </AppText>
            <View style={styles.pillRow}>
              <ChoicePill
                label="Có"
                tone="yes"
                selected={current[prompt.key] === true}
                onPress={() => onChange({ ...current, [prompt.key]: true })}
              />
              <ChoicePill
                label="Không"
                tone="no"
                selected={current[prompt.key] === false}
                onPress={() => onChange({ ...current, [prompt.key]: false })}
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  const options = getClinicalQuestionAnswerOptions(question);
  return (
    <View style={styles.pillRow}>
      {options.map(([key, label], index) => (
        <ChoicePill
          key={key}
          label={label}
          tone={index === 0 ? "yes" : "no"}
          selected={answer === key}
          onPress={() => onChange(key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  listRow: {
    gap: spacing.sm,
  },
  listLabel: {
    flexShrink: 1,
  },
  pillRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  pill: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
  },
  pillSelected: {
    borderColor: colors.limeDark,
    backgroundColor: colors.limeDark,
  },
  pillCheck: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: radius.pill,
  },
});
