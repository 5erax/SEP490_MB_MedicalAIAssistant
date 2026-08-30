// Ported from src/pages/NearbyClinicPage.jsx (Web). Mobile uses a map-first
// layout: the map is the primary screen, and the facility list opens on demand
// from a bottom sheet so Expo Go stays smooth.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ChevronDown, ListFilter, MapPin, Minus, Plus, Search, Stethoscope, X } from "lucide-react-native";

import { AppText, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useClinicalRecommendation } from "@/src/hooks/useClinicalRecommendation";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useFacilities } from "@/src/hooks/useFacilities";
import { useNearbyFacilities } from "@/src/hooks/useNearbyFacilities";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { DEFAULT_NEARBY_RADIUS_KM, NEARBY_FACILITY_LIMIT } from "@/src/services/facilityService";
import { FacilityTypeKey, NormalizedFacility } from "@/src/types/facility";
import { buildRecommendedFacilities } from "@/src/utils/clinicalFacilityMerge";
import { normalizeSearchText } from "@/src/utils/facilityNormalize";
import { ClinicalSummaryCard } from "./ClinicalSummaryCard";
import { FacilityDetailSheet } from "./FacilityDetailSheet";
import { FacilityFilters } from "./FacilityFilters";
import { FacilityListItem } from "./FacilityListItem";
import { FacilityMapView } from "./FacilityMapView";
import type { MapLoadStatus, MapZoomDirection, MapZoomAction } from "./FacilityMapView.types";
import { RatingChangeHandler } from "@/src/hooks/useFacilityReviews";

type MapQueryParams = {
  source?: string;
  facilityId?: string;
  departmentId?: string;
  sessionId?: string;
};

export function MapScreen() {
  const params = useLocalSearchParams<MapQueryParams>();
  const { facilities, loading: catalogLoading, apiNotice: catalogNotice, reload, updateRating: updateCatalogRating } = useFacilities();
  const clinical = useClinicalRecommendation(params);
  const { userLocation, locationStatus, requestUserLocation } = useUserLocation();
  const recommendedDepartmentName =
    clinical.isClinicalFlow && clinical.status === "ready" ? clinical.context?.recommendedDepartment?.departmentName ?? "" : "";

  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText, 400);
  const [departmentSearchText, setDepartmentSearchText] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_NEARBY_RADIUS_KM);
  const [radiusMenuVisible, setRadiusMenuVisible] = useState(false);
  const [departmentMenuVisible, setDepartmentMenuVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<FacilityTypeKey | "all">("all");
  const [selectedFacility, setSelectedFacility] = useState<NormalizedFacility | null>(null);
  const [detailFacility, setDetailFacility] = useState<NormalizedFacility | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [listVisible, setListVisible] = useState(false);
  const [, setMapStatus] = useState<MapLoadStatus>("loading");
  const [zoomAction, setZoomAction] = useState<MapZoomAction>();
  const [refreshing, setRefreshing] = useState(false);
  const autoSelectedRef = useRef(false);
  const autoOpenedRef = useRef(false);
  const autoListOpenedRef = useRef(false);
  const effectiveDepartmentId = selectedDepartmentId ?? (clinical.isClinicalFlow
    ? clinical.context?.recommendedDepartment?.departmentId ?? params.departmentId ?? ""
    : params.departmentId ?? "");
  const nearby = useNearbyFacilities(userLocation, radiusKm, effectiveDepartmentId);
  const reloadNearby = nearby.reload;
  const updateNearbyRating = nearby.updateRating;
  const handleRatingChange = useCallback<RatingChangeHandler>((facilityId, summary) => {
    updateCatalogRating(facilityId, summary);
    updateNearbyRating(facilityId, summary);
  }, [updateCatalogRating, updateNearbyRating]);
  const loading = userLocation ? nearby.loading : catalogLoading;
  const apiNotice = userLocation ? nearby.error : catalogNotice;

  const { facilities: recommendedFacilities, unavailableCount } = useMemo(() => {
    if (!clinical.isClinicalFlow || clinical.status !== "ready" || !clinical.context) {
      return { facilities: [] as NormalizedFacility[], order: new Map<string, number>(), unavailableCount: 0 };
    }
    return buildRecommendedFacilities(clinical.context.recommendedFacilities, facilities);
  }, [clinical.context, clinical.isClinicalFlow, clinical.status, facilities]);

  const hasManualDepartmentFilter = selectedDepartmentId !== null;
  const baseFacilities = userLocation ? nearby.facilities
    : clinical.isClinicalFlow && !hasManualDepartmentFilter ? recommendedFacilities : facilities;

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

      // Nearby already applies departmentId on the server; do not drop valid
      // matches if a facility's optional department metadata is missing.
      if (!userLocation && effectiveDepartmentId && (!clinical.isClinicalFlow || hasManualDepartmentFilter)) {
        if (!facility.departmentIds.includes(effectiveDepartmentId)) return false;
      }

      if (selectedType !== "all" && facility.facilityTypeKey !== selectedType) return false;

      return true;
    });
  }, [baseFacilities, clinical.isClinicalFlow, debouncedSearch, effectiveDepartmentId, hasManualDepartmentFilter, selectedType, userLocation]);

  const visibleFacilities = useMemo(
    () =>
      filteredFacilities.map((facility) => ({
        ...facility,
        distanceKm: userLocation ? facility.distanceKm : null,
      })),
    [filteredFacilities, userLocation],
  );

  useEffect(() => {
    if (!selectedFacility) return;
    if (visibleFacilities.some((facility) => facility.facilityId === selectedFacility.facilityId)) return;
    setSelectedFacility(visibleFacilities[0] ?? null);
  }, [selectedFacility, visibleFacilities]);

  const availableTypes = useMemo(
    () => Array.from(new Set(facilities.map((facility) => facility.facilityTypeKey))),
    [facilities],
  );

  const departmentOptions = useMemo(() => {
    const departments = new Map<string, string>();
    facilities.forEach((facility) => {
      facility.consultationDepartments.forEach((department) => {
        if (department.id && !departments.has(department.id)) {
          departments.set(department.id, department.name);
        }
      });
    });
    return Array.from(departments, ([id, name]) => ({ id, name })).sort((first, second) => first.name.localeCompare(second.name, "vi"));
  }, [facilities]);

  const hasActiveFacilitiesWithoutMapData = baseFacilities.length > 0 && baseFacilities.every((facility) => !facility.hasValidCoordinates);
  const activeDepartmentLabel = effectiveDepartmentId
    ? departmentOptions.find((department) => department.id === effectiveDepartmentId)?.name || recommendedDepartmentName || "Khoa đã chọn"
    : "Tất cả các khoa";
  const nearbySummary = userLocation
    ? loading ? `Đang tìm trong ${radiusKm} km…` : `Trong ${radiusKm} km · ${visibleFacilities.length} cơ sở${nearby.facilities.length >= NEARBY_FACILITY_LIMIT ? ` (tối đa ${NEARBY_FACILITY_LIMIT})` : ""}`
    : "Định vị để tìm cơ sở y tế quanh bạn.";

  const openDetail = useCallback((facility: NormalizedFacility) => {
    setSelectedFacility(facility);
    setDetailFacility(facility);
    setDetailVisible(true);
  }, []);

  const selectFromSheet = useCallback((facility: NormalizedFacility) => {
    setListVisible(false);
    openDetail(facility);
  }, [openDetail]);

  const closeList = useCallback(() => setListVisible(false), []);
  const openList = useCallback(() => setListVisible(true), []);
  const zoomMap = useCallback((direction: MapZoomDirection) => {
    setZoomAction((current) => ({ id: (current?.id ?? 0) + 1, direction }));
  }, []);
  const selectDepartment = useCallback((departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setDepartmentSearchText("");
    setSelectedFacility(null);
    setDepartmentMenuVisible(false);
  }, []);

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
    if (userLocation) reloadNearby();
    else await reload();
    setRefreshing(false);
  }, [reloadNearby, reload, userLocation]);

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.mapContainer}>
        <FacilityMapView
          facilities={visibleFacilities}
          selectedFacility={selectedFacility}
          userLocation={userLocation}
          onSelectFacility={openDetail}
          onStatusChange={setMapStatus}
          zoomAction={zoomAction}
        />
      </View>

      <View pointerEvents="box-none" style={styles.floatingActions}>
        <View style={styles.mapToolbar}>
          <View style={styles.mapSearchInputWrap}>
            <Search size={18} color={colors.teal} />
            <TextInput
              accessibilityLabel="Tìm tên bệnh viện hoặc phòng khám"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={openList}
              placeholder="Tìm tên bệnh viện, phòng"
              placeholderTextColor={colors.subtle}
              returnKeyType="search"
              style={styles.mapSearchInput}
            />
            {searchText ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Xóa tìm kiếm" onPress={() => setSearchText("")} style={styles.clearSearchButton}>
                <X size={14} color={colors.ink} />
              </Pressable>
            ) : null}
          </View>

        </View>

        <View style={styles.departmentControlRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lọc theo chuyên khoa"
            onPress={() => { setRadiusMenuVisible(false); setDepartmentMenuVisible((current) => !current); }}
            style={[styles.departmentMenuButton, effectiveDepartmentId ? styles.departmentMenuButtonActive : null]}
          >
            <Stethoscope size={17} color={colors.teal} />
            <AppText variant="bodyStrong" color={colors.teal} numberOfLines={1} style={styles.departmentMenuLabel}>
              {activeDepartmentLabel}
            </AppText>
            <ChevronDown size={17} color={colors.teal} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Bán kính tìm kiếm ${radiusKm} km`}
            accessibilityState={{ expanded: radiusMenuVisible }}
            onPress={() => { setDepartmentMenuVisible(false); setRadiusMenuVisible((current) => !current); }}
            style={styles.radiusButton}
          >
            <AppText variant="bodyStrong" color={colors.teal}>{radiusKm} km</AppText>
            <ChevronDown size={16} color={colors.teal} />
          </Pressable>
        </View>

        {radiusMenuVisible ? (
          <View style={styles.radiusOptions}>
            {[5, 7, 10, 20].map((value) => (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === radiusKm }}
                onPress={() => { setRadiusKm(value); setSelectedFacility(null); setRadiusMenuVisible(false); }}
                style={[styles.radiusOption, value === radiusKm && styles.departmentOptionActive]}>
                <AppText variant="bodyStrong" color={colors.teal}>{value} km</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        {departmentMenuVisible ? (
          <View style={styles.departmentMenu}>
            <TextInput accessibilityLabel="Tìm khoa trong danh sách" value={departmentSearchText} onChangeText={setDepartmentSearchText}
              placeholder="Tìm khoa..." placeholderTextColor={colors.subtle} style={styles.departmentOptionSearch} />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.departmentMenuScroll}>
              {catalogLoading ? <AppText variant="caption" color={colors.muted} style={styles.departmentOption}>Đang tải danh sách khoa…</AppText> : null}
              {!catalogLoading && departmentOptions.length === 0 ? (
                <View style={styles.departmentOption}>
                  <AppText variant="caption" color={colors.muted}>Chưa có danh sách khoa.</AppText>
                  <Button size="sm" variant="ghost" onPress={reload}>Tải lại khoa</Button>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => selectDepartment("")}
                style={[styles.departmentOption, !effectiveDepartmentId && styles.departmentOptionActive]}
              >
                <AppText variant="bodyStrong" color={!effectiveDepartmentId ? colors.teal : colors.ink}>
                  Tất cả các khoa
                </AppText>
              </Pressable>
              {departmentOptions.filter((department) => normalizeSearchText(department.name).includes(normalizeSearchText(departmentSearchText))).map((department) => {
                const selected = effectiveDepartmentId === department.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={department.id}
                    onPress={() => selectDepartment(department.id)}
                    style={[styles.departmentOption, selected && styles.departmentOptionActive]}
                  >
                    <AppText variant="bodyStrong" color={selected ? colors.teal : colors.ink} numberOfLines={1}>
                      {department.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {clinical.isClinicalFlow && clinical.status === "ready" && !hasManualDepartmentFilter && !userLocation ? (
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

        <View style={styles.mapQuickActions}>
        <Button
          variant="secondary"
          size="sm"
          disabled={locationStatus === "loading"}
          onPress={() => { setSelectedFacility(null); void requestUserLocation(); }}
          style={styles.locateButton}
        >
          <View style={styles.inlineButton}>
            <MapPin size={16} color={colors.ink} />
            <AppText variant="bodyStrong">{locationStatus === "loading" ? "Đang định vị…" : userLocation ? "Định vị lại" : "Định vị"}</AppText>
          </View>
        </Button>

        <Button onPress={openList} style={styles.nearbyButton}>
          <View style={styles.nearbyInline}>
            <ListFilter size={17} color={colors.white} />
            <AppText variant="bodyStrong" color={colors.white}>
              {userLocation ? "Gần bạn" : "Danh sách"}
            </AppText>
            <View style={styles.countPill}>
              <AppText variant="caption" color={colors.teal}>
                {visibleFacilities.length}
              </AppText>
            </View>
          </View>
        </Button>
        </View>
        <View style={styles.nearbyStatus} accessibilityLiveRegion="polite">
          <AppText variant="caption" color={nearby.error ? colors.warning : colors.muted}>{nearby.error || nearbySummary}</AppText>
          {locationStatus === "denied" || locationStatus === "unsupported" ? (
            <AppText variant="caption" color={colors.warning}>
              {locationStatus === "denied" ? "Chưa được cấp quyền vị trí. Hãy bật quyền vị trí rồi thử lại." : "Chưa lấy được vị trí. Hãy kiểm tra GPS/quyền vị trí rồi thử lại."}
            </AppText>
          ) : null}
          {nearby.error ? <Button size="sm" variant="ghost" onPress={nearby.reload}>Thử tìm lại</Button> : null}
        </View>
      </View>

      <View style={styles.mapZoomControls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Phóng to bản đồ" onPress={() => zoomMap("in")} style={styles.mapZoomButton}>
          <Plus size={21} color={colors.teal} />
        </Pressable>
        <View style={styles.mapZoomDivider} />
        <Pressable accessibilityRole="button" accessibilityLabel="Thu nhỏ bản đồ" onPress={() => zoomMap("out")} style={styles.mapZoomButton}>
          <Minus size={21} color={colors.teal} />
        </Pressable>
      </View>

      {listVisible ? (
        <FacilityListSheet
          apiNotice={apiNotice}
          availableTypes={availableTypes}
          clinicalStatus={clinical.status}
          clinicalNotice={clinical.notice}
          department={clinical.context?.recommendedDepartment ?? null}
          facilities={visibleFacilities}
          hasActiveFacilitiesWithoutMapData={hasActiveFacilitiesWithoutMapData}
          loading={loading}
          nearbyRadiusKm={userLocation ? radiusKm : null}
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
          isClinicalFlow={clinical.isClinicalFlow && !hasManualDepartmentFilter && !userLocation}
          unavailableCount={unavailableCount}
        />
      ) : null}

      {detailVisible ? <FacilityDetailSheet facility={detailFacility} visible onClose={() => setDetailVisible(false)} onRatingChange={handleRatingChange} /> : null}
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
  facilities: NormalizedFacility[];
  hasActiveFacilitiesWithoutMapData: boolean;
  loading: boolean;
  nearbyRadiusKm: number | null;
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
  facilities,
  hasActiveFacilitiesWithoutMapData,
  loading,
  nearbyRadiusKm,
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
        {isClinicalFlow ? <ClinicalSummaryCard
          status={clinicalStatus}
          notice={clinicalNotice}
          department={department}
          unavailableCount={unavailableCount}
          recommendedCount={facilities.length}
          sessionId={sessionId}
        /> : null}

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
      department,
      facilities.length,
      hasActiveFacilitiesWithoutMapData,
      loading,
      isClinicalFlow,
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
          Chưa cấp quyền vị trí. Danh sách này chưa được lọc theo bán kính quanh bạn.
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
            <AppText variant="h2">{nearbyRadiusKm ? "Cơ sở y tế gần bạn" : isClinicalFlow ? "Cơ sở phù hợp" : "Cơ sở y tế"}</AppText>
            <AppText variant="caption" color={colors.subtle}>
              {nearbyRadiusKm ? `Trong ${nearbyRadiusKm} km · ${facilities.length} kết quả · gần nhất trước` : isClinicalFlow ? `${facilities.length} nơi phù hợp với kết quả tư vấn` : `${facilities.length} địa điểm · chưa lọc theo vị trí`}
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
            <EmptyState title={apiNotice ? "Chưa thể tải kết quả" : "Chưa tìm thấy cơ sở y tế phù hợp"}
              description={nearbyRadiusKm ? `Thử tăng bán kính ${nearbyRadiusKm} km, chọn khoa khác hoặc đổi từ khóa.` : "Vui lòng thử đổi bộ lọc hoặc từ khóa tìm kiếm."} />
            <Button size="sm" variant="secondary" onPress={onClose}>{nearbyRadiusKm ? "Đổi bán kính / khoa" : "Đổi bộ lọc"}</Button>
            {apiNotice ? <Button size="sm" onPress={onRefresh}>Thử tải lại</Button> : null}
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
    left: spacing.sm,
    right: spacing.sm,
    top: spacing.sm,
    gap: spacing.sm,
  },
  mapToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  mapSearchInputWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.2)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  mapSearchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
  },
  departmentControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  radiusButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.paper,
  },
  radiusOptions: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  radiusOption: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  departmentOptionSearch: {
    minHeight: 44,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.sm,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  nearbyStatus: {
    alignSelf: "flex-start",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
  },
  departmentMenuButton: {
    minWidth: 178,
    maxWidth: 220,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: spacing.sm,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  departmentMenuButtonActive: {
    backgroundColor: colors.mint,
  },
  departmentMenuLabel: {
    flexShrink: 1,
    maxWidth: 150,
  },
  departmentMenu: {
    alignSelf: "flex-start",
    width: 220,
    maxHeight: 252,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.2)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingVertical: spacing.xs,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
  departmentMenuScroll: {
    maxHeight: 196,
  },
  departmentOption: {
    minHeight: 42,
    justifyContent: "center",
    borderRadius: radius.md,
    marginHorizontal: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  departmentOptionActive: {
    backgroundColor: colors.mint,
  },
  clearSearchButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  mapQuickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
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
    flexShrink: 0,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  nearbyButton: {
    flex: 1,
    minHeight: 42,
  },
  inlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 0,
  },
  nearbyInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  mapZoomControls: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing["4xl"] + spacing.lg,
    width: 48,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.22)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 4,
  },
  mapZoomButton: {
    width: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  mapZoomDivider: {
    width: 28,
    height: 1,
    backgroundColor: "rgba(8,127,140,0.18)",
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
