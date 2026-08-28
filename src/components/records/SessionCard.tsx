import { Pressable, StyleSheet, View } from "react-native";
import { AlertCircle, CheckCircle2, ChevronRight, Clock3 } from "lucide-react-native";

import { AppText, Badge } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { LabTestSession } from "@/src/types/labTest";
import { formatDateOnly, formatDateTime, getLabSessionDate, getSessionStatusPresentation } from "@/src/utils/labTestPresentation";

export function SessionCard({ session, onPress }: { session: LabTestSession; onPress: () => void }) {
  const status = getSessionStatusPresentation(session.status);
  const resultCount = session.results?.length ?? 0;
  const attentionCount = session.results?.filter((result) => ["high", "low", "criticalHigh", "criticalLow"].includes(result.status)).length ?? 0;
  const icon = session.status === "completed"
    ? <CheckCircle2 size={19} color={colors.teal} />
    : session.status === "failed"
      ? <AlertCircle size={19} color={colors.danger} />
      : <Clock3 size={19} color={colors.warning} />;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Mở kết quả xét nghiệm ${formatDateOnly(getLabSessionDate(session))}`} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.statusLine, session.status === "failed" && styles.statusLineDanger, session.status === "processing" && styles.statusLineWarning]} />
      <View style={[styles.iconMark, session.status === "failed" && styles.iconDanger, session.status === "processing" && styles.iconWarning]}>{icon}</View>
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong">{formatDateOnly(getLabSessionDate(session))}</AppText>
          <Badge tone={status.tone}>{status.label}</Badge>
        </View>
        <AppText variant="caption" color={colors.subtle}>
          {session.facilityName || formatDateTime(session.processedAt ?? session.createdAt)}
        </AppText>
        {session.status === "completed" ? (
          <AppText variant="caption" color={attentionCount ? colors.warning : colors.teal}>
            {resultCount ? `${resultCount} chỉ số${attentionCount ? ` · ${attentionCount} cần chú ý` : " · Chưa ghi nhận bất thường"}` : "Chưa nhận diện được chỉ số"}
          </AppText>
        ) : null}
      </View>
      <ChevronRight size={18} color={colors.subtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    overflow: "hidden",
  },
  rowPressed: { opacity: 0.82 },
  statusLine: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.teal },
  statusLineDanger: { backgroundColor: colors.danger },
  statusLineWarning: { backgroundColor: colors.warning },
  iconMark: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  iconDanger: { backgroundColor: colors.dangerBg },
  iconWarning: { backgroundColor: colors.warningBg },
  main: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
});
