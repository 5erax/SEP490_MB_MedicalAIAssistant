import { ActivityIndicator, Alert, Linking, StyleSheet, View } from "react-native";
import { MapPin } from "lucide-react-native";

import { AppText, Badge, Button, Card } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme/tokens";
import { ClinicalAnalysisResult, ClinicalFacility } from "@/src/types/symptomAnalysis";
import { GeoPoint, getFacilityRankingReason, getRecommendedDepartment, sortRecommendedFacilities } from "@/src/utils/facilityRanking";
import { LocationStatus } from "@/src/hooks/useUserLocation";

type ResultPanelProps = {
  result: ClinicalAnalysisResult | null;
  userLocation: GeoPoint | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onOpenMap: () => void;
  onPrepareConsultation: () => void;
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
      <AppText variant="bodyStrong" color={colors.teal}>
        #{index + 1}
      </AppText>
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

export function ResultPanel({ result, userLocation, locationStatus, onRequestLocation, onOpenMap, onPrepareConsultation, onNewSymptom }: ResultPanelProps) {
  const department = getRecommendedDepartment(result);
  const facilities = sortRecommendedFacilities(result, userLocation);
  const confidence = confidencePercent(department?.confidenceScore);

  async function callEmergencyServices() {
    const phoneUrl = "tel:115";
    if (await Linking.canOpenURL(phoneUrl)) {
      await Linking.openURL(phoneUrl);
      return;
    }
    Alert.alert("Không thể mở cuộc gọi", "Hãy gọi 115 bằng ứng dụng điện thoại hoặc nhờ người bên cạnh hỗ trợ.");
  }

  return (
    <View style={styles.group}>
      <Card variant="hard" style={styles.card}>
        <View style={styles.departmentHead}>
          <View style={styles.departmentTextGroup}>
            <AppText variant="caption" color={colors.subtle}>
              Chuyên khoa được gợi ý
            </AppText>
            <AppText variant="h2">{department?.departmentName || "Chưa xác định chuyên khoa"}</AppText>
          </View>
          {confidence > 0 ? <Badge tone="success">{confidence}% phù hợp</Badge> : null}
        </View>
        <AppText color={colors.muted}>
          {department?.departmentName
            ? "Đây là chuyên khoa được hệ thống đề xuất để bạn tham khảo khi chọn nơi thăm khám."
            : "Hệ thống chưa trả về chuyên khoa cụ thể. Bạn vẫn có thể xem các cơ sở y tế được gợi ý bên dưới."}
        </AppText>
        {department?.isEmergencySuggested ? (
          <View style={styles.emergencyBadge}>
            <AppText variant="bodyStrong" color={colors.danger}>
              Có dấu hiệu cần được đánh giá khẩn cấp
            </AppText>
            <AppText variant="caption" color={colors.ink}>
              Nếu đang khó thở, đau ngực, ngất, co giật hoặc tình trạng xấu nhanh, hãy gọi 115 ngay. Không chờ kết quả AI và không tự lái xe nếu không an toàn.
            </AppText>
            <Button variant="danger" fullWidth onPress={callEmergencyServices} accessibilityLabel="Gọi cấp cứu 115">
              Gọi cấp cứu 115
            </Button>
            <Button variant="secondary" fullWidth onPress={onOpenMap}>
              Tìm cơ sở cấp cứu gần đây
            </Button>
          </View>
        ) : null}
        <AppText variant="caption" color={colors.subtle}>
          Gợi ý này giúp định hướng nơi khám. Cơ sở y tế sẽ xác nhận chuyên khoa phù hợp sau khi đánh giá trực tiếp.
        </AppText>
      </Card>

      <Card variant="hard" style={styles.card}>
        <View style={styles.facilityHead}>
          <View style={styles.departmentTextGroup}>
            <AppText variant="caption" color={colors.subtle}>
              Cơ sở y tế được gợi ý
            </AppText>
            <AppText variant="h3">Những nơi có chuyên khoa phù hợp</AppText>
          </View>
        </View>
        <AppText color={colors.muted}>
          Danh sách chỉ gồm các cơ sở được trả về trong kết quả gợi ý. Khoảng cách được bổ sung khi bạn cho phép truy
          cập vị trí.
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
          <Button size="sm" onPress={onOpenMap}>
            <View style={styles.buttonInline}>
              <MapPin size={16} color={colors.ink} />
              <AppText variant="bodyStrong">Mở bản đồ</AppText>
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
            {facilities.map((facility, index) => (
              <FacilityRow
                key={facility.facilityId || facility.facilityName || index}
                facility={facility}
                index={index}
                department={department}
                userLocation={userLocation}
              />
            ))}
          </View>
        )}
      </Card>

      {department?.departmentId ? (
        <Button fullWidth onPress={onPrepareConsultation}>
          Chuẩn bị câu hỏi trước khi đi khám
        </Button>
      ) : null}

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
  departmentHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  departmentTextGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  emergencyBadge: {
    gap: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
  },
  facilityHead: {
    flexDirection: "row",
  },
  locationActions: {
    flexDirection: "row",
    gap: spacing.sm,
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
    gap: spacing.md,
  },
  facilityRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  facilityText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
});
