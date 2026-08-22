// Ported from MedicalAssistantPage.jsx's ResultPage (Web) — ranked
// candidate-disease list with ICD-10 codes and confidence bar chart.
import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ClinicalDiagnosis, ClinicalDiagnosisResult } from "@/src/types/symptomAnalysis";

type DiagnosisResultPanelProps = {
  result: ClinicalDiagnosisResult | null;
  onNewSymptom: () => void;
};

function confidencePercent(value: number | undefined) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric <= 1 ? numeric * 100 : numeric)));
}

function diagnosisRank(diagnosis: ClinicalDiagnosis, index: number) {
  return Number(diagnosis.rank) || index + 1;
}

function DiagnosisRow({ diagnosis, index }: { diagnosis: ClinicalDiagnosis; index: number }) {
  const percent = confidencePercent(diagnosis.paGivenB);
  return (
    <View style={styles.diagnosisRow}>
      <View style={styles.diagnosisRank}>
        <AppText variant="bodyStrong" color={colors.white}>
          {diagnosisRank(diagnosis, index)}
        </AppText>
      </View>
      <View style={styles.diagnosisText}>
        <AppText variant="bodyStrong">{diagnosis.diseaseName || "Chưa xác định"}</AppText>
        {diagnosis.icd10Code ? (
          <AppText variant="caption" color={colors.subtle}>
            ICD-10: {diagnosis.icd10Code}
          </AppText>
        ) : null}
      </View>
      <Badge tone="info">{`${percent}%`}</Badge>
    </View>
  );
}

export function DiagnosisResultPanel({ result, onNewSymptom }: DiagnosisResultPanelProps) {
  const diagnoses = result?.diagnoses ?? [];
  const primary = diagnoses[0] ?? null;
  const isEmergency = Boolean(result?.recommendedDepartment?.isEmergencySuggested);

  return (
    <View style={styles.group}>
      <View style={[styles.emergencyBanner, isEmergency && styles.emergencyBannerUrgent]}>
        <AppText variant="bodyStrong" color={isEmergency ? colors.danger : colors.teal}>
          {isEmergency ? "Cần ưu tiên thăm khám khẩn cấp" : "Đã tạo chẩn đoán lâm sàng tham khảo"}
        </AppText>
        <AppText color={colors.muted}>
          {isEmergency
            ? "Kết quả cho thấy bạn có thể cần được đánh giá y tế sớm. Hãy liên hệ cơ sở y tế phù hợp."
            : "Kết quả dưới đây chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ."}
        </AppText>
      </View>

      {primary ? (
        <Card variant="hard" style={styles.card}>
          <AppText variant="caption" color={colors.subtle}>
            Chẩn đoán tham khảo ưu tiên
          </AppText>
          <AppText variant="h2">{primary.diseaseName || "Chưa xác định"}</AppText>
          {primary.clinicalReasoning ? <AppText color={colors.muted}>{primary.clinicalReasoning}</AppText> : null}
          <View style={styles.metaRow}>
            {primary.icd10Code ? (
              <AppText variant="caption" color={colors.subtle}>
                ICD-10: {primary.icd10Code}
              </AppText>
            ) : null}
            <Badge tone="success">{`${confidencePercent(primary.paGivenB)}% phù hợp tham khảo`}</Badge>
          </View>
        </Card>
      ) : null}

      {diagnoses.length > 0 ? (
        <Card variant="hard" style={styles.card}>
          <AppText variant="caption" color={colors.subtle}>
            Thứ tự khả năng bệnh
          </AppText>
          <View style={styles.diagnosisList}>
            {diagnoses.map((diagnosis, index) => (
              <DiagnosisRow key={`${diagnosisRank(diagnosis, index)}-${diagnosis.diseaseName}`} diagnosis={diagnosis} index={index} />
            ))}
          </View>
        </Card>
      ) : (
        <Card variant="hard" style={styles.card}>
          <AppText color={colors.muted}>Hệ thống chưa trả về chẩn đoán cụ thể. Hãy thử lại với mô tả triệu chứng rõ hơn.</AppText>
        </Card>
      )}

      <Button variant="secondary" fullWidth onPress={onNewSymptom}>
        Nhập triệu chứng mới
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  emergencyBanner: {
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  emergencyBannerUrgent: {
    backgroundColor: colors.dangerBg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  diagnosisList: {
    gap: spacing.md,
  },
  diagnosisRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  diagnosisRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.teal,
  },
  diagnosisText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
});
