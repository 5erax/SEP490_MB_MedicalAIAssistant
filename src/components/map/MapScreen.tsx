// Ported from src/pages/NearbyClinicPage.jsx (Web). Mobile uses a map-first
// layout: the map is the primary screen, and the facility list opens on demand
// from a bottom sheet so Expo Go stays smooth.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ChevronDown, MapPin, Minus, Plus, Search, SlidersHorizontal, Star, Stethoscope, X } from "lucide-react-native";

import { AppText, Button, EmptyState, Screen, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useClinicalRecommendation } from "@/src/hooks/useClinicalRecommendation";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useDepartmentFacilities, useFacilities } from "@/src/hooks/useFacilities";
import { useNearbyFacilities } from "@/src/hooks/useNearbyFacilities";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { NEARBY_FACILITY_LIMIT } from "@/src/services/facilityService";
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

type HospitalFilterMode = "none" | "top" | "nearest" | "radius";

const DEFAULT_HOSPITAL_FILTER_RADIUS_KM = 5;
const HOSPITAL_FILTER_RADIUS_OPTIONS = [5, 10, 15];
const TOP_HOSPITAL_LIMIT = 5;

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
  const [radiusKm, setRadiusKm] = useState(DEFAULT_HOSPITAL_FILTER_RADIUS_KM);
  const [hospitalFilterVisible, setHospitalFilterVisible] = useState(false);
  const [hospitalFilterMode, setHospitalFilterMode] = useState<HospitalFilterMode>("none");
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
  const hasManualDepartmentFilter = selectedDepartmentId !== null;
  const clinicalDepartmentId = clinical.isClinicalFlow
    ? clinical.context?.recommendedDepartment?.departmentId ?? params.departmentId ?? ""
    : "";
  const clinicalDepartmentFacilities = useDepartmentFacilities(clinicalDepartmentId);
  const effectiveDepartmentId = selectedDepartmentId ?? (clinical.isClinicalFlow
    ? clinical.context?.recommendedDepartment?.departmentId ?? params.departmentId ?? ""
    : params.departmentId ?? "");
  const wantsNearbyHospitalFilter = hospitalFilterMode === "radius" || hospitalFilterMode === "nearest";
  const usesNearbyHospitalFilter = Boolean(userLocation && wantsNearbyHospitalFilter);
  const nearby = useNearbyFacilities(usesNearbyHospitalFilter ? userLocation : null, radiusKm, effectiveDepartmentId);
  const reloadNearby = nearby.reload;
  const updateNearbyRating = nearby.updateRating;
  const reloadClinicalDepartmentFacilities = clinicalDepartmentFacilities.reload;
  const handleRatingChange = useCallback<RatingChangeHandler>((facilityId, summary) => {
    updateCatalogRating(facilityId, summary);
    updateNearbyRating(facilityId, summary);
    clinicalDepartmentFacilities.updateRating(facilityId, summary);
  }, [clinicalDepartmentFacilities, updateCatalogRating, updateNearbyRating]);

  const { facilities: recommendedFacilities, unavailableCount } = useMemo(() => {
    if (!clinical.isClinicalFlow || clinical.status !== "ready" || !clinical.context) {
      return { facilities: [] as NormalizedFacility[], order: new Map<string, number>(), unavailableCount: 0 };
    }
    return buildRecommendedFacilities(clinical.context.recommendedFacilities, facilities);
  }, [clinical.context, clinical.isClinicalFlow, clinical.status, facilities]);

  const shouldUseClinicalDepartmentFacilities = Boolean(
    clinical.isClinicalFlow && !hasManualDepartmentFilter && !usesNearbyHospitalFilter && hospitalFilterMode !== "top" && clinicalDepartmentId,
  );
  const loading = usesNearbyHospitalFilter ? nearby.loading : shouldUseClinicalDepartmentFacilities ? clinicalDepartmentFacilities.loading : catalogLoading;
  const apiNotice = usesNearbyHospitalFilter ? nearby.error : shouldUseClinicalDepartmentFacilities ? clinicalDepartmentFacilities.apiNotice || catalogNotice : catalogNotice;
  const baseFacilities = usesNearbyHospitalFilter ? nearby.facilities
    : shouldUseClinicalDepartmentFacilities ? clinicalDepartmentFacilities.facilities
      : clinical.isClinicalFlow && !hasManualDepartmentFilter && hospitalFilterMode !== "top" ? recommendedFacilities : facilities;
  const catalogByFacilityId = useMemo(
    () => new Map(facilities.map((facility) => [facility.facilityId, facility])),
    [facilities],
  );

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

      if (effectiveDepartmentId && (!clinical.isClinicalFlow || hasManualDepartmentFilter || usesNearbyHospitalFilter)) {
        const catalogFacility = catalogByFacilityId.get(facility.facilityId);
        const departmentIds = new Set([
          ...facility.departmentIds,
          ...(catalogFacility?.departmentIds ?? []),
        ]);
        if (!departmentIds.has(effectiveDepartmentId)) return false;
      }

      if (selectedType !== "all" && facility.facilityTypeKey !== selectedType) return false;

      return true;
    });
  }, [baseFacilities, catalogByFacilityId, clinical.isClinicalFlow, debouncedSearch, effectiveDepartmentId, hasManualDepartmentFilter, selectedType, usesNearbyHospitalFilter]);

  const visibleFacilities = useMemo(() => {
    const normalizedFacilities = filteredFacilities.map((facility) => ({
        ...facility,
        distanceKm: usesNearbyHospitalFilter ? facility.distanceKm : null,
      }));

    if (hospitalFilterMode === "top") {
      return [...normalizedFacilities]
        .sort((left, right) => {
          const ratingDelta = (right.averageRating ?? 0) - (left.averageRating ?? 0);
          if (ratingDelta !== 0) return ratingDelta;
          const reviewDelta = (right.reviewCount ?? 0) - (left.reviewCount ?? 0);
          if (reviewDelta !== 0) return reviewDelta;
          return left.facilityName.localeCompare(right.facilityName, "vi");
        })
        .slice(0, TOP_HOSPITAL_LIMIT);
    }

    if (hospitalFilterMode === "nearest" && usesNearbyHospitalFilter) {
      return [...normalizedFacilities]
        .sort((left, right) => (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity))
        .slice(0, 1);
    }

    return normalizedFacilities;
  }, [filteredFacilities, hospitalFilterMode, usesNearbyHospitalFilter]);

  useEffect(() => {
    if (!selectedFacility) return;
    if (visibleFacilities.some((facility) => facility.facilityId === selectedFacility.facilityId)) return;
    setSelectedFacility(visibleFacilities[0] ?? null);
  }, [selectedFacility, visibleFacilities]);

  useEffect(() => {
    if (hospitalFilterMode !== "nearest" || loading || visibleFacilities.length === 0) return;
    const nearestFacility = visibleFacilities[0];
    if (selectedFacility?.facilityId === nearestFacility.facilityId) return;
    setSelectedFacility(nearestFacility);
  }, [hospitalFilterMode, loading, selectedFacility?.facilityId, visibleFacilities]);

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

  const hasActiveFacilitiesWithoutMapData = visibleFacilities.length > 0 && visibleFacilities.every((facility) => !facility.hasValidCoordinates);
  const activeDepartmentLabel = effectiveDepartmentId
    ? departmentOptions.find((department) => department.id === effectiveDepartmentId)?.name || recommendedDepartmentName || "Khoa đã chọn"
    : "Tất cả các khoa";
  const hospitalFilterBadge = hospitalFilterMode === "radius" && userLocation
    ? `${radiusKm} km`
    : hospitalFilterMode === "top"
      ? "Top 5"
      : hospitalFilterMode === "nearest" && userLocation
        ? "Gần nhất"
        : "";
  const nearbySummary = usesNearbyHospitalFilter
    ? hospitalFilterMode === "nearest"
      ? loading ? "Đang tìm bệnh viện gần bạn nhất…" : `${visibleFacilities.length} bệnh viện gần vị trí hiện tại nhất`
      : loading ? `Đang tìm trong ${radiusKm} km…` : `Trong ${radiusKm} km · ${visibleFacilities.length} cơ sở${nearby.facilities.length >= NEARBY_FACILITY_LIMIT ? ` (tối đa ${NEARBY_FACILITY_LIMIT})` : ""}`
    : hospitalFilterMode === "top"
      ? `Top ${visibleFacilities.length} bệnh viện theo đánh giá toàn hệ thống.`
      : "Mở bộ lọc bệnh viện để chọn top, gần nhất hoặc theo bán kính.";

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
  const selectHospitalFilter = useCallback((mode: Exclude<HospitalFilterMode, "none">) => {
    setHospitalFilterMode(mode);
    setSelectedFacility(null);
    setHospitalFilterVisible(false);
  }, []);
  const clearHospitalFilter = useCallback(() => {
    setHospitalFilterMode("none");
    setRadiusKm(DEFAULT_HOSPITAL_FILTER_RADIUS_KM);
    setSelectedFacility(null);
    setHospitalFilterVisible(false);
  }, []);
  const requestLocationForFilter = useCallback(() => {
    setSelectedFacility(null);
    void requestUserLocation();
  }, [requestUserLocation]);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (usesNearbyHospitalFilter) reloadNearby();
    else if (shouldUseClinicalDepartmentFacilities) await reloadClinicalDepartmentFacilities();
    else await reload();
    setRefreshing(false);
  }, [reloadClinicalDepartmentFacilities, reloadNearby, reload, shouldUseClinicalDepartmentFacilities, usesNearbyHospitalFilter]);

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
            onPress={() => { setHospitalFilterVisible(false); setDepartmentMenuVisible((current) => !current); }}
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
            accessibilityLabel="Bộ lọc bệnh viện"
            accessibilityState={{ expanded: hospitalFilterVisible }}
            onPress={() => { setDepartmentMenuVisible(false); setHospitalFilterVisible((current) => !current); }}
            style={[styles.hospitalFilterButton, hospitalFilterMode !== "none" && styles.hospitalFilterButtonActive]}
          >
            <SlidersHorizontal size={17} color={hospitalFilterMode !== "none" ? colors.white : colors.teal} />
            <AppText
              variant="bodyStrong"
              color={hospitalFilterMode !== "none" ? colors.white : colors.teal}
              numberOfLines={1}
              style={styles.hospitalFilterButtonLabel}
            >
              Bộ lọc bệnh viện
            </AppText>
            {hospitalFilterBadge ? (
              <View style={styles.hospitalFilterBadge}>
                <AppText variant="caption" color={hospitalFilterMode !== "none" ? colors.teal : colors.white}>
                  {hospitalFilterBadge}
                </AppText>
              </View>
            ) : null}
            <ChevronDown size={16} color={hospitalFilterMode !== "none" ? colors.white : colors.teal} />
          </Pressable>
        </View>

        {hospitalFilterVisible ? (
          <View style={styles.hospitalFilterPanel}>
            {!userLocation ? (
              <View style={styles.hospitalFilterPrompt}>
                <View style={styles.filterOptionIcon}>
                  <MapPin size={19} color={colors.teal} />
                </View>
                <View style={styles.filterOptionContent}>
                  <AppText variant="bodyStrong">Bật vị trí để dùng bộ lọc</AppText>
                  <AppText variant="caption" color={colors.muted}>
                    Bộ lọc cần vị trí hiện tại để so sánh bệnh viện tốt nhất và bán kính quanh bạn.
                  </AppText>
                  <Button disabled={locationStatus === "loading"} onPress={requestLocationForFilter} style={styles.useLocationButton}>
                    {locationStatus === "loading" ? "Đang lấy vị trí…" : "Dùng vị trí của tôi"}
                  </Button>
                </View>
              </View>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: hospitalFilterMode === "top" }}
                  onPress={() => selectHospitalFilter("top")}
                  style={[styles.hospitalFilterOption, hospitalFilterMode === "top" && styles.hospitalFilterOptionActive]}
                >
                  <View style={styles.filterOptionIcon}>
                    <Star size={18} color={colors.teal} />
                  </View>
                  <View style={styles.filterOptionContent}>
                    <AppText variant="bodyStrong">Top bệnh viện</AppText>
                    <AppText variant="caption" color={colors.muted}>Top 5 theo đánh giá toàn hệ thống.</AppText>
                  </View>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: hospitalFilterMode === "nearest" }}
                  onPress={() => selectHospitalFilter("nearest")}
                  style={[styles.hospitalFilterOption, hospitalFilterMode === "nearest" && styles.hospitalFilterOptionActive]}
                >
                  <View style={styles.filterOptionIcon}>
                    <MapPin size={18} color={colors.teal} />
                  </View>
                  <View style={styles.filterOptionContent}>
                    <AppText variant="bodyStrong">Bệnh viện gần tôi nhất</AppText>
                    <AppText variant="caption" color={colors.muted}>
                      Hiển thị 1 bệnh viện gần vị trí hiện tại nhất trong bán kính đã chọn.
                    </AppText>
                  </View>
                </Pressable>

                <View style={[styles.hospitalFilterOption, styles.hospitalFilterRadiusOption, hospitalFilterMode === "radius" && styles.hospitalFilterOptionActive]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: hospitalFilterMode === "radius" }}
                    onPress={() => selectHospitalFilter("radius")}
                    style={styles.hospitalFilterOptionHeader}
                  >
                    <View style={[styles.filterOptionIcon, hospitalFilterMode === "radius" && styles.filterOptionIconActive]}>
                      <SlidersHorizontal size={18} color={hospitalFilterMode === "radius" ? colors.white : colors.teal} />
                    </View>
                    <View style={styles.filterOptionContent}>
                      <AppText variant="bodyStrong">Theo bán kính</AppText>
                      <AppText variant="caption" color={colors.muted}>Tìm bệnh viện gần bạn trong bán kính đã chọn.</AppText>
                    </View>
                  </Pressable>
                  <View style={styles.radiusChipRow}>
                    {HOSPITAL_FILTER_RADIUS_OPTIONS.map((value) => {
                      const selected = hospitalFilterMode === "radius" && value === radiusKm;
                      return (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => { setRadiusKm(value); selectHospitalFilter("radius"); }}
                          style={[styles.radiusChip, selected && styles.radiusChipActive]}
                        >
                          <AppText
                            variant="bodyStrong"
                            color={selected ? colors.white : colors.muted}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                            style={styles.radiusChipText}
                          >
                            {value} km
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {hospitalFilterMode !== "none" ? (
                  <Pressable accessibilityRole="button" onPress={clearHospitalFilter} style={styles.clearHospitalFilterButton}>
                    <X size={17} color={colors.warning} />
                    <AppText variant="bodyStrong" color={colors.warning}>Xóa lọc</AppText>
                  </Pressable>
                ) : null}
              </>
            )}
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

        <View style={styles.nearbyStatus} accessibilityLiveRegion="polite">
          <AppText variant="caption" color={apiNotice ? colors.warning : colors.muted}>{apiNotice || nearbySummary}</AppText>
          {locationStatus === "denied" || locationStatus === "unsupported" ? (
            <AppText variant="caption" color={colors.warning}>
              {locationStatus === "denied" ? "Chưa được cấp quyền vị trí. Hãy bật quyền vị trí rồi thử lại." : "Chưa lấy được vị trí. Hãy kiểm tra GPS/quyền vị trí rồi thử lại."}
            </AppText>
          ) : null}
          {usesNearbyHospitalFilter && nearby.error ? <Button size="sm" variant="ghost" onPress={nearby.reload}>Thử tìm lại</Button> : null}
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
          nearbyRadiusKm={usesNearbyHospitalFilter ? radiusKm : null}
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
          isClinicalFlow={clinical.isClinicalFlow && !hasManualDepartmentFilter && !usesNearbyHospitalFilter && hospitalFilterMode !== "top"}
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
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  hospitalFilterButton: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  hospitalFilterButtonActive: {
    backgroundColor: colors.teal,
  },
  hospitalFilterButtonLabel: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  hospitalFilterBadge: {
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  hospitalFilterPanel: {
    alignSelf: "flex-start",
    width: "100%",
    maxWidth: 360,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.2)",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 4,
  },
  hospitalFilterPrompt: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  hospitalFilterOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    minHeight: 72,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.18)",
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  hospitalFilterRadiusOption: {
    flexDirection: "column",
  },
  hospitalFilterOptionHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  hospitalFilterOptionActive: {
    borderColor: colors.teal,
    backgroundColor: colors.mint,
  },
  filterOptionIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(8,127,140,0.1)",
  },
  filterOptionIconActive: {
    backgroundColor: colors.teal,
  },
  filterOptionContent: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs / 2,
  },
  useLocationButton: {
    marginTop: spacing.sm,
    alignSelf: "stretch",
  },
  radiusChipRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  radiusChip: {
    flex: 1,
    flexBasis: 0,
    minHeight: 34,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingHorizontal: spacing.xs,
  },
  radiusChipText: {
    textAlign: "center",
  },
  radiusChipActive: {
    backgroundColor: colors.teal,
  },
  clearHospitalFilterButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.28)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(254,242,242,0.96)",
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
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
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
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
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
