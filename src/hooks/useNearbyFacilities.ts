import { useCallback, useEffect, useState } from "react";

import { medicalFacilitiesApi, NearbyFacilityFilters } from "@/src/services/facilityService";
import { NormalizedFacility } from "@/src/types/facility";
import { getArrayData, normalizeFacility } from "@/src/utils/facilityNormalize";
import { GeoPoint } from "@/src/utils/facilityRanking";
import { FacilityRatingSummary } from "@/src/utils/facilityRating";

type NearbyState = { key: string; facilities: NormalizedFacility[]; loading: boolean; error: string };

export function useNearbyFacilities(location: GeoPoint | null, radiusKm: number, departmentId: string) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<NearbyState>({ key: "", facilities: [], loading: false, error: "" });
  // A new filter/location never displays results belonging to the previous query.
  const queryKey = location ? JSON.stringify({ latitude: location.latitude, longitude: location.longitude, radiusKm, departmentId }) : "";
  const key = queryKey ? `${queryKey}:${revision}` : "";
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    if (!queryKey) return;
    let active = true;
    setState({ key, facilities: [], loading: true, error: "" });
    const query: NearbyFacilityFilters = JSON.parse(queryKey);
    Promise.resolve().then(() => medicalFacilitiesApi.nearby(query)).then((response) => {
      if (!active) return;
      if (!Array.isArray(response.data)) throw new Error("Invalid nearby response");
      const facilities = getArrayData(response)
        .map((facility) => normalizeFacility(facility))
        .filter((facility) => facility.isActive)
        .sort((left, right) => (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity));
      setState({ key, facilities, loading: false, error: "" });
    }).catch(() => {
      if (active) setState({ key, facilities: [], loading: false, error: "Chưa thể tìm cơ sở y tế gần bạn. Vui lòng thử lại." });
    });
    return () => { active = false; };
  }, [key, queryKey]);

  const current = state.key === key;
  const updateRating = useCallback((facilityId: string, summary: FacilityRatingSummary) => {
    setState((previous) => ({ ...previous, facilities: previous.facilities.map((facility) => facility.facilityId === facilityId ? { ...facility, ...summary } : facility) }));
  }, []);
  return {
    facilities: queryKey && current ? state.facilities : [],
    loading: Boolean(queryKey) && (!current || state.loading),
    error: current ? state.error : "",
    reload,
    updateRating,
  };
}
