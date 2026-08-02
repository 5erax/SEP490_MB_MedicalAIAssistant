// Ported from src/pages/NearbyClinicPage.jsx (Web) — see docs/mobile-progress.md
// for the full contract this was built against (query-param handling,
// clinical-flow handoff, filtering, ranking). MapLibre/browser-geolocation/
// window.history specifics are replaced with RN-native equivalents; the
// MapConsultationAssistant chat embedded in Web's map page is intentionally
// NOT ported here — it belongs to Module 4 (AI Consultation).
import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MapPin } from "lucide-react-native";

import { AppText, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useClinicalRecommendation } from "@/src/hooks/useClinicalRecommendation";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useFacilities } from "@/src/hooks/useFacilities";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { FacilityTypeKey, NormalizedFacility } from "@/src/types/facility";
import { buildRecommendedFacilities } from "@/src/utils/clinicalFacilityMerge";
import { normalizeSearchText } from "@/src/utils/facilityNormalize";
import { getFacilityDistanceKm } from "@/src/utils/facilityRanking";
import { ClinicalSummaryCard } from "./ClinicalSummaryCard";
import { FacilityDetailSheet } from "./FacilityDetailSheet";
import { FacilityFilters } from "./FacilityFilters";
import { FacilityListItem } from "./FacilityListItem";
import { FacilityMapView } from "./FacilityMapView";
import type { MapLoadStatus } from "./FacilityMapView.types";

type MapQueryParams = {
  source?: string;
  facilityId?: string;
  departmentId?: string;
  sessionId?: string;
};

export function MapScreen() {
  const params = useLocalSearchParams<MapQueryParams>();
  const { facilities, loading, apiNotice, reload } = useFacilities();
  const clinical = useClinicalRecommendation(params);
  const { userLocation, locationStatus, requestUserLocation } = useUserLocation();

  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText, 400);
  const [selectedType, setSelectedType] = useState<FacilityTypeKey | "all">("all");
  const [selectedFacility, setSelectedFacility] = useState<NormalizedFacility | null>(null);
  const [detailFacility, setDetailFacility] = useState<NormalizedFacility | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [, setMapStatus] = useState<MapLoadStatus>("loading");
  const [refreshing, setRefreshing] = useState(false);
  const autoSelectedRef = useRef(false);
  const autoOpenedRef = useRef(false);

  const { facilities: recommendedFacilities, unavailableCount } = useMemo(() => {
    if (!clinical.isClinicalFlow || clinical.status !== "ready" || !clinical.context) {
      return { facilities: [] as NormalizedFacility[], order: new Map<string, number>(), unavailableCount: 0 };
    }
    return buildRecommendedFacilities(clinical.context.recommendedFacilities, facilities);
  }, [clinical.isClinicalFlow, clinical.status, clinical.context, facilities]);

  const baseFacilities = clinical.isClinicalFlow ? recommendedFacilities : facilities;

  const filteredFacilities = useMemo(() => {
    const normalizedSearch = normalizeSearchText(debouncedSearch);

    return baseFacilities.filter((facility) => {
      const matchSearch =
        !normalizedSearch ||
        [facility.facilityName, facility.address, facility.facilityType, facility.facilityTypeLabel, facility.openingHours, ...facility.departments]
          .some((field) => normalizeSearchText(field).includes(normalizedSearch));
      if (!matchSearch) return false;

      if (!clinical.isClinicalFlow && params.departmentId) {
        const matchDepartment =
          facility.departmentIds.includes(params.departmentId) ||
          facility.departments.some((name) => normalizeSearchText(name).includes(normalizeSearchText(params.departmentId)));
        if (!matchDepartment) return false;
      }

      if (selectedType !== "all" && facility.facilityTypeKey !== selectedType) return false;

      return true;
    });
  }, [baseFacilities, debouncedSearch, selectedType, clinical.isClinicalFlow, params.departmentId]);

  const visibleFacilities = useMemo(
    () =>
      filteredFacilities.map((facility) => ({
        ...facility,
        distanceKm: getFacilityDistanceKm(facility, userLocation),
      })),
    [filteredFacilities, userLocation],
  );

  const availableTypes = useMemo(
    () => Array.from(new Set(facilities.map((facility) => facility.facilityTypeKey))),
    [facilities],
  );

  const hasActiveFacilitiesWithoutMapData = facilities.length > 0 && facilities.every((facility) => !facility.hasValidCoordinates);

  function openDetail(facility: NormalizedFacility) {
    setSelectedFacility(facility);
    setDetailFacility(facility);
    setDetailVisible(true);
  }

  // Non-clinical deep link: auto-open a requested facility once loaded.
  useEffect(() => {
    if (clinical.isClinicalFlow || loading || autoOpenedRef.current || !params.facilityId) return;
    const match = facilities.find((facility) => facility.facilityId === params.facilityId);
    if (match) {
      autoOpenedRef.current = true;
      openDetail(match);
    }
  }, [clinical.isClinicalFlow, loading, facilities, params.facilityId]);

  // Clinical flow: auto-select (not auto-open) the requested/top facility once ready.
  useEffect(() => {
    if (!clinical.isClinicalFlow || clinical.status !== "ready" || autoSelectedRef.current || visibleFacilities.length === 0) return;
    autoSelectedRef.current = true;
    const match = visibleFacilities.find((facility) => facility.facilityId === params.facilityId) ?? visibleFacilities[0];
    setSelectedFacility(match);
  }, [clinical.isClinicalFlow, clinical.status, visibleFacilities, params.facilityId]);

  async function handleRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.mapContainer}>
        <FacilityMapView
          facilities={visibleFacilities}
          selectedFacility={selectedFacility}
          userLocation={userLocation}
          onSelectFacility={openDetail}
          onStatusChange={setMapStatus}
        />
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <AppText variant="h2">Cơ sở y tế gần bạn</AppText>

        <ClinicalSummaryCard
          status={clinical.status}
          notice={clinical.notice}
          department={clinical.context?.recommendedDepartment ?? null}
          unavailableCount={unavailableCount}
        />

        <FacilityFilters
          searchText={searchText}
          onChangeSearchText={setSearchText}
          selectedType={selectedType}
          onChangeType={setSelectedType}
          availableTypes={availableTypes}
        />

        <Button
          variant="secondary"
          size="sm"
          disabled={locationStatus === "loading" || locationStatus === "ready"}
          onPress={requestUserLocation}
          style={styles.locateButton}
        >
          <View style={styles.locateButtonInline}>
            <MapPin size={16} color={colors.ink} />
            <AppText variant="bodyStrong">{locationStatus === "ready" ? "Đã có vị trí" : "Dùng vị trí của tôi"}</AppText>
          </View>
        </Button>

        {apiNotice ? (
          <View style={styles.notice}>
            <AppText variant="caption" color={colors.warning}>
              {apiNotice}
            </AppText>
          </View>
        ) : null}

        {hasActiveFacilitiesWithoutMapData ? (
          <View style={styles.notice}>
            <AppText variant="caption" color={colors.warning}>
              Cơ sở y tế hiện chưa có tọa độ hợp lệ để hiển thị trên bản đồ.
            </AppText>
          </View>
        ) : null}

        {loading ? (
          <SkeletonGroup lines={4} />
        ) : visibleFacilities.length === 0 ? (
          <EmptyState
            title="Chưa tìm thấy cơ sở y tế phù hợp"
            description="Vui lòng thử đổi bộ lọc hoặc từ khóa tìm kiếm."
          />
        ) : (
          <View style={styles.list}>
            {visibleFacilities.map((facility) => (
              <FacilityListItem
                key={facility.facilityId}
                facility={facility}
                selected={selectedFacility?.facilityId === facility.facilityId}
                onPress={() => openDetail(facility)}
              />
            ))}
          </View>
        )}

        {locationStatus === "denied" ? (
          <AppText variant="caption" color={colors.subtle}>
            Chưa cấp quyền vị trí. Danh sách vẫn hiển thị đầy đủ, chỉ thiếu khoảng cách.
          </AppText>
        ) : null}
      </ScrollView>

      <FacilityDetailSheet facility={detailFacility} visible={detailVisible} onClose={() => setDetailVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapContainer: {
    height: "42%",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.ink,
  },
  sheet: {
    flex: 1,
  },
  sheetContent: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  notice: {
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  locateButton: {
    alignSelf: "flex-start",
  },
  locateButtonInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
