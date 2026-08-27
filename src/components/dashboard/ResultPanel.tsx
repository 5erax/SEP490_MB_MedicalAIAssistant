import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ArrowRight, Building2, CheckCircle2, MapPin, RefreshCcw, ShieldAlert, Stethoscope } from "lucide-react-native";

import { AppText, Badge, Button, Card } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ClinicalAnalysisResult, ClinicalFacility } from "@/src/types/symptomAnalysis";
import { GeoPoint, getFacilityRankingReason, getRecommendedDepartment, sortRecommendedFacilities } from "@/src/utils/facilityRanking";
import { LocationStatus } from "@/src/hooks/useUserLocation";

type ResultPanelProps = {
  result: ClinicalAnalysisResult | null;
  userLocation: GeoPoint | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onOpenMap: () => void;
  onNewSymptom: () => void;
};

function confidencePercent(value: number | undefined) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric <= 1 ? numeric * 100 : numeric)));
}

function FacilityRow({ facility, index, department, userLocation }: { facility: ClinicalFacility; index: number; department: ReturnType<typeof getRecommendedDepartment>; userLocation: GeoPoint | null }) {
  return (
    <View style={styles.facilityRow}>
      <View style={styles.facilityRank}>
        <AppText variant="caption" color={colors.teal}>
          #{index + 1}
        </AppText>
      </View>
      <View style={styles.facilityText}>
        <AppText variant="bodyStrong">{facility.facilityName || "Cơ sở y tế"}</AppText>
        <AppText color={colors.muted}>{facility.address || "Chưa có địa chỉ"}</AppText>
        <AppText variant="caption" color={colors.subtle}>
          {getFacilityRankingReason(facility, department, userLocation)}
        </AppText>
      </View>
    </View>
  );
}

export function ResultPanel({ result, userLocation, locationStatus, onRequestLocation, onOpenMap, onNewSymptom }: ResultPanelProps) {
  const department = getRecommendedDepartment(result);
  const facilities = sortRecommendedFacilities(result, userLocation);
  const confidence = confidencePercent(department?.confidenceScore);
  const topFacilities = facilities.slice(0, 3);

  return (
    <View style={styles.group}>
      <Card variant="hard" style={styles.resultHero}>
        <View style={styles.departmentHead}>
          <View style={styles.departmentIcon}>
            <Stethoscope size={22} color={colors.white} />
          </View>
          <View style={styles.departmentTextGroup}>
            <AppText variant="caption" color={colors.subtle}>
              Chuyên khoa được gợi ý
            </AppText>
            <AppText variant="h2">{department?.departmentName || "Chưa xác định chuyên khoa"}</AppText>
          </View>
        </View>
        {confidence > 0 ? (
          <View style={styles.confidenceRow}>
            <View style={styles.confidenceTrack}>
              <View style={[styles.confidenceFill, { width: `${confidence}%` }]} />
            </View>
            <Badge tone="success">{confidence}% phù hợp</Badge>
          </View>
        ) : null}
        <AppText color={colors.muted}>
          {department?.departmentName
            ? "Đây là chuyên khoa phù hợp nhất để bạn tiếp tục tìm nơi khám và chuẩn bị thông tin trước buổi hẹn."
            : "Hệ thống chưa trả về chuyên khoa cụ thể. Bạn vẫn có thể xem các cơ sở y tế được gợi ý bên dưới."}
        </AppText>
        {department?.isEmergencySuggested ? (
          <View style={styles.emergencyBadge}>
            <ShieldAlert size={16} color={colors.warning} />
            <AppText variant="caption" color={colors.warning}>
              Kết quả ghi nhận dấu hiệu cần được ưu tiên đánh giá tại cơ sở y tế.
            </AppText>
          </View>
        ) : null}
        <View style={styles.nextSteps}>
          {["Xem cơ sở phù hợp", "Chọn nơi khám", "Chuẩn bị trước khám"].map((label, index) => (
            <View key={label} style={styles.nextStep}>
              <View style={styles.nextStepDot}>
                <AppText variant="caption" color={colors.white}>
                  {index + 1}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.muted} style={styles.nextStepLabel}>
                {label}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card variant="hard" style={styles.card}>
        <View style={styles.facilityHead}>
          <View style={styles.facilityIcon}>
            <Building2 size={18} color={colors.teal} />
          </View>
          <View style={styles.departmentTextGroup}>
            <AppText variant="caption" color={colors.subtle}>
              Cơ sở y tế được gợi ý
            </AppText>
            <AppText variant="h3">Những nơi có chuyên khoa phù hợp</AppText>
          </View>
        </View>
        <AppText color={colors.muted}>
          Danh sách chi tiết sẽ nằm trong bản đồ để bạn dễ xem khoảng cách, chọn cơ sở và mở chỉ đường.
        </AppText>

        <View style={styles.locationActions}>
          <Button
            variant="secondary"
            size="sm"
            disabled={locationStatus === "ready" || locationStatus === "loading"}
            onPress={onRequestLocation}
          >
            {locationStatus === "loading" ? (
              <View style={styles.loadingLabel}>
                <ActivityIndicator color={colors.ink} size="small" />
                <AppText variant="bodyStrong">Đang lấy vị trí...</AppText>
              </View>
            ) : (
              <View style={styles.buttonInline}>
                <MapPin size={16} color={colors.ink} />
                <AppText variant="bodyStrong">{locationStatus === "ready" ? "Đã có vị trí" : "Dùng vị trí của tôi"}</AppText>
              </View>
            )}
          </Button>
          <Button size="sm" onPress={onOpenMap} style={styles.mapButton}>
            <View style={styles.buttonInline}>
              <ArrowRight size={16} color={colors.white} />
              <AppText variant="bodyStrong" color={colors.white}>
                Tìm cơ sở
              </AppText>
            </View>
          </Button>
        </View>

        {locationStatus === "denied" ? (
          <AppText variant="caption" color={colors.warning}>
            Chưa cấp quyền vị trí. Danh sách vẫn ưu tiên chuyên khoa, tọa độ hợp lệ và đánh giá thật khi có dữ liệu.
          </AppText>
        ) : null}
        {locationStatus === "unsupported" ? (
          <AppText variant="caption" color={colors.warning}>
            Không thể lấy vị trí trên thiết bị này. Bạn vẫn có thể mở bản đồ và tìm theo chuyên khoa được đề xuất.
          </AppText>
        ) : null}

        {facilities.length === 0 ? (
          <AppText color={colors.muted}>Hệ thống chưa trả về cơ sở y tế cụ thể. Hãy thử lại với mô tả triệu chứng rõ hơn.</AppText>
        ) : (
          <View style={styles.facilityList}>
            {topFacilities.map((facility, index) => (
              <FacilityRow
                key={facility.facilityId || facility.facilityName || index}
                facility={facility}
                index={index}
                department={department}
                userLocation={userLocation}
              />
            ))}
            {facilities.length > topFacilities.length ? (
              <View style={styles.moreFacilities}>
                <CheckCircle2 size={15} color={colors.teal} />
                <AppText variant="caption" color={colors.muted} style={styles.moreFacilitiesText}>
                  Còn {facilities.length - topFacilities.length} cơ sở khác trong bản đồ.
                </AppText>
              </View>
            ) : null}
          </View>
        )}
      </Card>

      <Button variant="secondary" fullWidth onPress={onNewSymptom} leftIcon={<RefreshCcw size={16} color={colors.ink} />}>
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
    borderColor: "rgba(8,127,140,0.16)",
  },
  resultHero: {
    gap: spacing.md,
    borderColor: "rgba(8,127,140,0.2)",
    backgroundColor: colors.paper,
  },
  departmentHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  departmentIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.teal,
  },
  departmentTextGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  confidenceTrack: {
    flex: 1,
    height: 10,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  confidenceFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  emergencyBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
  },
  facilityHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  facilityIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  locationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mapButton: {
    flexGrow: 1,
  },
  buttonInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  loadingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  facilityList: {
    gap: spacing.sm,
  },
  nextSteps: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
    padding: spacing.sm,
  },
  nextStep: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  nextStepDot: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  nextStepLabel: {
    textAlign: "center",
  },
  facilityRow: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  facilityRank: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  facilityText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  moreFacilities: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    padding: spacing.md,
  },
  moreFacilitiesText: {
    flex: 1,
  },
});
