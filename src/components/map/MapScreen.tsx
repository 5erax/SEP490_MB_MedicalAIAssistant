// Ported from src/pages/NearbyClinicPage.jsx (Web). Mobile uses a map-first
// layout: the map is the primary screen, and the facility list opens on demand
// from a bottom sheet so Expo Go stays smooth.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ListFilter, MapPin, Stethoscope, X } from "lucide-react-native";

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
  const [listVisible, setListVisible] = useState(false);
  const [, setMapStatus] = useState<MapLoadStatus>("loading");
  const [refreshing, setRefreshing] = useState(false);
  const autoSelectedRef = useRef(false);
  const autoOpenedRef = useRef(false);
  const autoListOpenedRef = useRef(false);

  const { facilities: recommendedFacilities, unavailableCount } = useMemo(() => {
    if (!clinical.isClinicalFlow || clinical.status !== "ready" || !clinical.context) {
      return { facilities: [] as NormalizedFacility[], order: new Map<string, number>(), unavailableCount: 0 };
    }
    return buildRecommendedFacilities(clinical.context.recommendedFacilities, facilities);
  }, [clinical.context, clinical.isClinicalFlow, clinical.status, facilities]);

  const baseFacilities = clinical.isClinicalFlow ? recommendedFacilities : facilities;

  const filteredFacilities = useMemo(() => {
    const normalizedSearch = normalizeSearchText(debouncedSearch);

    return baseFacilities.filter((facility) => {
      const matchSearch =
        !normalizedSearch ||
        [
          facility.facilityName,
          facility.address,
          facility.facilityType,
          facility.facilityTypeLabel,
          facility.openingHours,
          ...facility.departments,
        ].some((field) => normalizeSearchText(field).includes(normalizedSearch));
      if (!matchSearch) return false;

      if (!clinical.isClinicalFlow && params.departmentId) {
        const normalizedDepartment = normalizeSearchText(params.departmentId);
        const matchDepartment =
          facility.departmentIds.includes(params.departmentId) ||
          facility.departments.some((name) => normalizeSearchText(name).includes(normalizedDepartment));
        if (!matchDepartment) return false;
      }

      if (selectedType !== "all" && facility.facilityTypeKey !== selectedType) return false;

      return true;
    });
  }, [baseFacilities, clinical.isClinicalFlow, debouncedSearch, params.departmentId, selectedType]);

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

  const openDetail = useCallback((facility: NormalizedFacility) => {
    setSelectedFacility(facility);
    setDetailFacility(facility);
    setDetailVisible(true);
  }, []);

  const selectFromSheet = useCallback((facility: NormalizedFacility) => {
    setSelectedFacility(facility);
    setListVisible(false);
  }, []);

  const closeList = useCallback(() => setListVisible(false), []);
  const openList = useCallback(() => setListVisible(true), []);

  useEffect(() => {
    if (clinical.isClinicalFlow || loading || autoOpenedRef.current || !params.facilityId) return;
    const match = facilities.find((facility) => facility.facilityId === params.facilityId);
    if (match) {
      autoOpenedRef.current = true;
      openDetail(match);
    }
  }, [clinical.isClinicalFlow, facilities, loading, openDetail, params.facilityId]);

  useEffect(() => {
    if (!clinical.isClinicalFlow || clinical.status !== "ready" || autoSelectedRef.current || visibleFacilities.length === 0) return;
    autoSelectedRef.current = true;
    const match = visibleFacilities.find((facility) => facility.facilityId === params.facilityId) ?? visibleFacilities[0];
    setSelectedFacility(match);
  }, [clinical.isClinicalFlow, clinical.status, params.facilityId, visibleFacilities]);

  useEffect(() => {
    if (!clinical.isClinicalFlow || clinical.status !== "ready" || autoListOpenedRef.current) return;
    autoListOpenedRef.current = true;
    setListVisible(true);
  }, [clinical.isClinicalFlow, clinical.status]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

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

      <View pointerEvents="box-none" style={styles.floatingActions}>
        {clinical.isClinicalFlow && clinical.status === "ready" ? (
          <View style={styles.clinicalContextChip}>
            <View style={styles.clinicalChipIcon}>
              <Stethoscope size={16} color={colors.teal} />
            </View>
            <View style={styles.clinicalChipText}>
              <AppText variant="caption" color={colors.subtle}>
                Đang tìm theo chuyên khoa
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {clinical.context?.recommendedDepartment?.departmentName || "Chuyên khoa được gợi ý"}
              </AppText>
            </View>
          </View>
        ) : null}

        <Button
          variant="secondary"
          size="sm"
          disabled={locationStatus === "loading" || locationStatus === "ready"}
          onPress={requestUserLocation}
          style={styles.locateButton}
        >
          <View style={styles.inlineButton}>
            <MapPin size={16} color={colors.ink} />
            <AppText variant="bodyStrong">{locationStatus === "ready" ? "Đã có vị trí" : "Dùng vị trí của tôi"}</AppText>
          </View>
        </Button>

        <Button fullWidth onPress={openList} style={styles.nearbyButton}>
          <View style={styles.nearbyInline}>
            <ListFilter size={17} color={colors.white} />
            <AppText variant="bodyStrong" color={colors.white}>
              {clinical.isClinicalFlow ? "Xem cơ sở phù hợp" : "Cơ sở y tế gần bạn"}
            </AppText>
            <View style={styles.countPill}>
              <AppText variant="caption" color={colors.teal}>
                {visibleFacilities.length}
              </AppText>
            </View>
          </View>
        </Button>
      </View>

      {listVisible ? (
        <FacilityListSheet
          apiNotice={apiNotice}
          availableTypes={availableTypes}
          clinicalStatus={clinical.status}
          clinicalNotice={clinical.notice}
          department={clinical.context?.recommendedDepartment ?? null}
          diagnoses={clinical.context?.diagnoses ?? []}
          facilities={visibleFacilities}
          hasActiveFacilitiesWithoutMapData={hasActiveFacilitiesWithoutMapData}
          loading={loading}
          locationDenied={locationStatus === "denied"}
          onChangeSearchText={setSearchText}
          onChangeType={setSelectedType}
          onClose={closeList}
          onRefresh={handleRefresh}
          onSelectFacility={selectFromSheet}
          refreshing={refreshing}
          searchText={searchText}
          selectedFacilityId={selectedFacility?.facilityId ?? ""}
          selectedType={selectedType}
          sessionId={clinical.context?.sessionId}
          isClinicalFlow={clinical.isClinicalFlow}
          unavailableCount={unavailableCount}
        />
      ) : null}

      <FacilityDetailSheet facility={detailFacility} visible={detailVisible} onClose={() => setDetailVisible(false)} />
    </Screen>
  );
}

type FacilityListSheetProps = {
  apiNotice?: string;
  availableTypes: FacilityTypeKey[];
  clinicalStatus: ReturnType<typeof useClinicalRecommendation>["status"];
  clinicalNotice: ReturnType<typeof useClinicalRecommendation>["notice"];
  department: ReturnType<typeof useClinicalRecommendation>["context"] extends infer Context
    ? Context extends { recommendedDepartment?: infer Department }
      ? Department | null
      : null
    : null;
  diagnoses: NonNullable<ReturnType<typeof useClinicalRecommendation>["context"]>["diagnoses"];
  facilities: NormalizedFacility[];
  hasActiveFacilitiesWithoutMapData: boolean;
  loading: boolean;
  locationDenied: boolean;
  onChangeSearchText: (value: string) => void;
  onChangeType: (value: FacilityTypeKey | "all") => void;
  onClose: () => void;
  onRefresh: () => void;
  onSelectFacility: (facility: NormalizedFacility) => void;
  refreshing: boolean;
  searchText: string;
  selectedFacilityId: string;
  selectedType: FacilityTypeKey | "all";
  sessionId?: string;
  isClinicalFlow: boolean;
  unavailableCount: number;
};

const FacilityListSheet = memo(function FacilityListSheet({
  apiNotice,
  availableTypes,
  clinicalStatus,
  clinicalNotice,
  department,
  diagnoses,
  facilities,
  hasActiveFacilitiesWithoutMapData,
  loading,
  locationDenied,
  onChangeSearchText,
  onChangeType,
  onClose,
  onRefresh,
  onSelectFacility,
  refreshing,
  searchText,
  selectedFacilityId,
  selectedType,
  sessionId,
  isClinicalFlow,
  unavailableCount,
}: FacilityListSheetProps) {
  const keyExtractor = useCallback((facility: NormalizedFacility) => facility.facilityId, []);

  const renderItem = useCallback(
    ({ item }: { item: NormalizedFacility }) => (
      <FacilityListItem
        facility={item}
        selected={selectedFacilityId === item.facilityId}
        onPress={() => onSelectFacility(item)}
      />
    ),
    [onSelectFacility, selectedFacilityId],
  );

  const header = useMemo(
    () => (
      <View style={styles.sheetListHeader}>
        <ClinicalSummaryCard
          status={clinicalStatus}
          notice={clinicalNotice}
          department={department}
          diagnoses={diagnoses}
          unavailableCount={unavailableCount}
          recommendedCount={facilities.length}
          sessionId={sessionId}
        />

        <FacilityFilters
          searchText={searchText}
          onChangeSearchText={onChangeSearchText}
          selectedType={selectedType}
          onChangeType={onChangeType}
          availableTypes={availableTypes}
        />

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

        {loading ? <SkeletonGroup lines={4} /> : null}
      </View>
    ),
    [
      apiNotice,
      availableTypes,
      clinicalNotice,
      clinicalStatus,
      diagnoses,
      department,
      facilities.length,
      hasActiveFacilitiesWithoutMapData,
      loading,
      onChangeSearchText,
      onChangeType,
      searchText,
      selectedType,
      sessionId,
      unavailableCount,
    ],
  );

  const footer = useMemo(
    () =>
      locationDenied ? (
        <AppText variant="caption" color={colors.subtle}>
          Chưa cấp quyền vị trí. Danh sách vẫn hiển thị đầy đủ, chỉ thiếu khoảng cách.
        </AppText>
      ) : null,
    [locationDenied],
  );

  return (
    <View style={styles.sheetOverlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Đóng danh sách" onPress={onClose} style={styles.scrim} />
      <View style={styles.sheetPanel}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleGroup}>
            <AppText variant="h2">{isClinicalFlow ? "Cơ sở phù hợp" : "Cơ sở y tế gần bạn"}</AppText>
            <AppText variant="caption" color={colors.subtle}>
              {isClinicalFlow ? `${facilities.length} nơi phù hợp với kết quả tư vấn` : `${facilities.length} địa điểm đang hiển thị trên bản đồ`}
            </AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton}>
            <X size={19} color={colors.ink} />
          </Pressable>
        </View>

        {loading || facilities.length > 0 ? (
          <FlatList
            data={loading ? [] : facilities}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={header}
            ListFooterComponent={footer}
            contentContainerStyle={styles.sheetContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            removeClippedSubviews
            updateCellsBatchingPeriod={32}
            windowSize={5}
          />
        ) : (
          <View style={styles.emptyWrap}>
            {header}
            <EmptyState title="Chưa tìm thấy cơ sở y tế phù hợp" description="Vui lòng thử đổi bộ lọc hoặc từ khóa tìm kiếm." />
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  floatingActions: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing["3xl"],
    gap: spacing.sm,
  },
  clinicalContextChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.22)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  clinicalChipIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  clinicalChipText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  locateButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  nearbyButton: {
    minHeight: 52,
  },
  inlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  nearbyInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  countPill: {
    minWidth: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,20,18,0.18)",
  },
  sheetPanel: {
    maxHeight: "72%",
    overflow: "hidden",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.bg,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.lineStrong,
    marginTop: spacing.sm,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sheetTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
  },
  sheetContent: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  sheetListHeader: {
    gap: spacing.lg,
  },
  emptyWrap: {
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
});
