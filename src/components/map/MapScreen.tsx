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
import type { MapLoadStatus, MapZoomDirection, MapZoomAction } from "./FacilityMapView.types";

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
  const recommendedDepartmentName =
    clinical.isClinicalFlow && clinical.status === "ready" ? clinical.context?.recommendedDepartment?.departmentName ?? "" : "";

  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText, 400);
  const [departmentSearchText, setDepartmentSearchText] = useState("");
  const debouncedDepartmentSearch = useDebouncedValue(departmentSearchText, 300);
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

  const { facilities: recommendedFacilities, unavailableCount } = useMemo(() => {
    if (!clinical.isClinicalFlow || clinical.status !== "ready" || !clinical.context) {
      return { facilities: [] as NormalizedFacility[], order: new Map<string, number>(), unavailableCount: 0 };
    }
    return buildRecommendedFacilities(clinical.context.recommendedFacilities, facilities);
  }, [clinical.context, clinical.isClinicalFlow, clinical.status, facilities]);

  const hasManualDepartmentFilter = Boolean(normalizeSearchText(departmentSearchText));
  const baseFacilities = clinical.isClinicalFlow && !hasManualDepartmentFilter ? recommendedFacilities : facilities;

  const filteredFacilities = useMemo(() => {
    const normalizedSearch = normalizeSearchText(debouncedSearch);
    const normalizedDepartmentSearch = normalizeSearchText(debouncedDepartmentSearch);

    return baseFacilities.filter((facility) => {
      if (normalizedDepartmentSearch) {
        const matchDepartmentSearch = [...facility.departments, ...facility.departmentIds].some((field) =>
          normalizeSearchText(field).includes(normalizedDepartmentSearch),
        );
        if (!matchDepartmentSearch) return false;
      }

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
  }, [baseFacilities, clinical.isClinicalFlow, debouncedDepartmentSearch, debouncedSearch, params.departmentId, selectedType]);

  const visibleFacilities = useMemo(
    () =>
      filteredFacilities.map((facility) => ({
        ...facility,
        distanceKm: getFacilityDistanceKm(facility, userLocation),
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
      facility.departments.forEach((department) => {
        const normalized = normalizeSearchText(department);
        if (normalized && !departments.has(normalized)) {
          departments.set(normalized, department);
        }
      });
    });
    return Array.from(departments.values()).sort((first, second) => first.localeCompare(second, "vi"));
  }, [facilities]);

  const hasActiveFacilitiesWithoutMapData = facilities.length > 0 && facilities.every((facility) => !facility.hasValidCoordinates);
  const activeDepartmentLabel = departmentSearchText || recommendedDepartmentName || "Tất cả các khoa";

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
  const zoomMap = useCallback((direction: MapZoomDirection) => {
    setZoomAction((current) => ({ id: (current?.id ?? 0) + 1, direction }));
  }, []);
  const selectDepartment = useCallback((department: string) => {
    setDepartmentSearchText(department);
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
            onPress={() => setDepartmentMenuVisible((current) => !current)}
            style={[styles.departmentMenuButton, departmentSearchText ? styles.departmentMenuButtonActive : null]}
          >
            <Stethoscope size={17} color={colors.teal} />
            <AppText variant="bodyStrong" color={colors.teal} numberOfLines={1} style={styles.departmentMenuLabel}>
              {activeDepartmentLabel}
            </AppText>
            <ChevronDown size={17} color={colors.teal} />
          </Pressable>
        </View>

        {departmentMenuVisible ? (
          <View style={styles.departmentMenu}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.departmentMenuScroll}>
              <Pressable
                accessibilityRole="button"
                onPress={() => selectDepartment("")}
                style={[styles.departmentOption, !departmentSearchText && styles.departmentOptionActive]}
              >
                <AppText variant="bodyStrong" color={!departmentSearchText ? colors.teal : colors.ink}>
                  Tất cả các khoa
                </AppText>
              </Pressable>
              {departmentOptions.map((department) => {
                const selected = departmentSearchText === department;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={department}
                    onPress={() => selectDepartment(department)}
                    style={[styles.departmentOption, selected && styles.departmentOptionActive]}
                  >
                    <AppText variant="bodyStrong" color={selected ? colors.teal : colors.ink} numberOfLines={1}>
                      {department}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.mapSearchPanel}>
          <View style={styles.departmentSearchRow}>
            <Search size={17} color={colors.teal} />
            <TextInput
              accessibilityLabel="Tìm theo chuyên khoa"
              value={departmentSearchText}
              onChangeText={setDepartmentSearchText}
              placeholder="Tìm theo chuyên khoa..."
              placeholderTextColor={colors.subtle}
              returnKeyType="search"
              style={styles.departmentSearchInput}
            />
            {departmentSearchText ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xóa tìm kiếm chuyên khoa"
                onPress={() => setDepartmentSearchText("")}
                style={styles.clearSearchButton}
              >
                <X size={15} color={colors.ink} />
              </Pressable>
            ) : null}
          </View>
          {departmentSearchText ? (
            <AppText variant="caption" color={colors.subtle}>
              {visibleFacilities.length} cơ sở phù hợp
            </AppText>
          ) : null}
        </View>

        {clinical.isClinicalFlow && clinical.status === "ready" && !hasManualDepartmentFilter ? (
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
          disabled={locationStatus === "loading" || locationStatus === "ready"}
          onPress={requestUserLocation}
          style={styles.locateButton}
        >
          <View style={styles.inlineButton}>
            <MapPin size={16} color={colors.ink} />
            <AppText variant="bodyStrong">{locationStatus === "ready" ? "Đã có vị trí" : "Dùng vị trí của tôi"}</AppText>
          </View>
        </Button>

        <Button onPress={openList} style={styles.nearbyButton}>
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
    maxHeight: 240,
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
  mapSearchPanel: {
    display: "none",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.18)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: spacing.sm,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  departmentSearchRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  departmentSearchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0,
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
    display: "none",
    flexDirection: "row",
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
