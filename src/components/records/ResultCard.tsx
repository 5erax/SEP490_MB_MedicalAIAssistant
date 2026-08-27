import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import { AppText, Badge, Card } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme/tokens";
import { LabResult } from "@/src/types/labTest";
import { getResultStatusPresentation } from "@/src/utils/labTestPresentation";

const ADVICE_FIELDS: { key: keyof NonNullable<LabResult["advice"]>; label: string }[] = [
  { key: "summary", label: "Tóm tắt" },
  { key: "possibleCauses", label: "Nguyên nhân có thể" },
  { key: "lifestyleAdvice", label: "Gợi ý sinh hoạt" },
  { key: "nutritionalAdvice", label: "Gợi ý dinh dưỡng" },
  { key: "warningSigns", label: "Dấu hiệu cần lưu ý" },
  { key: "followUpSuggestion", label: "Đề xuất theo dõi" },
  { key: "doctorQuestions", label: "Câu hỏi gợi ý cho bác sĩ" },
];

function formatRange(result: LabResult) {
  const range = result.referenceRangeUsed;
  const min = range?.minValue ?? result.referenceMinUsed;
  const max = range?.maxValue ?? result.referenceMaxUsed;
  const unit = range?.unit ?? result.referenceUnitUsed ?? "";
  const comparison = range?.comparisonType ?? result.comparisonTypeUsed;
  if (comparison === "lessThanOrEqual" && max != null) return `≤ ${max} ${unit}`.trim();
  if (comparison === "greaterThanOrEqual" && min != null) return `≥ ${min} ${unit}`.trim();
  if (min == null && max != null) return `≤ ${max} ${unit}`.trim();
  if (min == null) return null;
  if (max == null) return `≥ ${min} ${unit}`.trim();
  return `${min} – ${max} ${unit}`.trim();
}

export function ResultCard({ result }: { result: LabResult }) {
  const [expanded, setExpanded] = useState(false);
  const status = getResultStatusPresentation(result.status);
  const range = formatRange(result);
  const advice = result.advice;
  const hasAdvice = Boolean(advice && ADVICE_FIELDS.some(({ key }) => advice[key]));

  return (
    <Card variant="soft" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <AppText variant="bodyStrong">{result.indicator?.fullName || result.rawExtractedName || "Chỉ số"}</AppText>
          {result.indicator?.symbol ? (
            <AppText variant="caption" color={colors.subtle}>
              {result.indicator.symbol}
            </AppText>
          ) : null}
        </View>
        <Badge tone={status.tone}>{status.label}</Badge>
      </View>

      <View style={styles.valueRow}>
        <AppText variant="h2">
          {result.userValue ?? result.rawExtractedValue ?? "—"}
          {result.referenceRangeUsed?.unit || result.referenceUnitUsed ? (
            <AppText color={colors.subtle}> {result.referenceRangeUsed?.unit ?? result.referenceUnitUsed}</AppText>
          ) : null}
        </AppText>
        {range ? (
          <AppText variant="caption" color={colors.subtle}>
            Khoảng tham chiếu: {range}
          </AppText>
        ) : null}
      </View>

      {advice?.displayTitle ? <AppText variant="bodyStrong">{advice.displayTitle}</AppText> : null}

      {result.indicator?.description ? (
        <AppText color={colors.muted}>{result.indicator.description}</AppText>
      ) : null}

      {advice?.urgencyLevel ? (
        <View style={styles.urgency}>
          <AppText variant="caption" color={colors.warning}>Mức độ ưu tiên: {advice.urgencyLevel}</AppText>
        </View>
      ) : null}

      {hasAdvice ? (
        <>
          <Pressable accessibilityRole="button" onPress={() => setExpanded((current) => !current)} style={styles.toggle}>
            <AppText variant="bodyStrong" color={colors.teal}>
              {expanded ? "Thu gọn tư vấn" : "Xem tư vấn chi tiết"}
            </AppText>
            {expanded ? <ChevronUp size={16} color={colors.teal} /> : <ChevronDown size={16} color={colors.teal} />}
          </Pressable>

          {expanded ? (
            <View style={styles.adviceGroup}>
              {ADVICE_FIELDS.map(({ key, label }) =>
                advice?.[key] ? (
                  <View key={key} style={styles.adviceRow}>
                    <AppText variant="caption" color={colors.subtle}>
                      {label}
                    </AppText>
                    <AppText color={colors.muted}>{advice[key]}</AppText>
                  </View>
                ) : null,
              )}
            </View>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  valueRow: {
    gap: spacing.xs / 2,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  adviceGroup: {
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
  },
  urgency: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  adviceRow: {
    gap: spacing.xs / 2,
  },
});
