import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ArrowDown, ArrowUp, CheckCircle2, ChevronDown, ChevronUp, HelpCircle } from "lucide-react-native";

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
  const isHigh = result.status === "high" || result.status === "criticalHigh";
  const isLow = result.status === "low" || result.status === "criticalLow";
  const isNormal = result.status === "normal";
  const accentColor = isNormal ? colors.success : result.status === "unknown" ? colors.subtle : colors.warning;
  const statusIcon = isHigh
    ? <ArrowUp size={16} color={accentColor} />
    : isLow
      ? <ArrowDown size={16} color={accentColor} />
      : isNormal
        ? <CheckCircle2 size={16} color={accentColor} />
        : <HelpCircle size={16} color={accentColor} />;

  return (
    <Card variant="soft" style={[styles.card, { borderLeftColor: accentColor }] }>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          {result.indicator?.symbol ? (
            <AppText variant="eyebrow" color={colors.teal}>{result.indicator.symbol}</AppText>
          ) : null}
          <AppText variant="bodyStrong">{result.indicator?.fullName || result.rawExtractedName || "Chỉ số"}</AppText>
        </View>
        <View style={styles.statusGroup}>{statusIcon}<Badge tone={status.tone}>{status.label}</Badge></View>
      </View>

      <View style={styles.valueRow}>
        <AppText variant="h2" color={isNormal ? colors.teal : colors.ink}>
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

      {!isNormal && advice?.urgencyLevel ? (
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
              {advice?.displayTitle ? <AppText variant="bodyStrong">{advice.displayTitle}</AppText> : null}
              {result.indicator?.description ? <AppText color={colors.muted}>{result.indicator.description}</AppText> : null}
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
    gap: spacing.sm,
    borderLeftWidth: 4,
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
  statusGroup: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  valueRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "space-between",
    alignSelf: "stretch",
    minHeight: 38,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
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
