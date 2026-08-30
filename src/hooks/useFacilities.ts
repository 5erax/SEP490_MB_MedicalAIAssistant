// Ported from the data-fetching effect in Web's NearbyClinicPage.jsx: fetch
// active facilities + facility-department relations in parallel
// (Promise.allSettled semantics — a relation-fetch failure degrades
// gracefully instead of blocking the facility list), normalize, and surface
// the same non-blocking "apiNotice" banner states.
import { useCallback, useEffect, useState } from "react";

import { facilityDepartmentsApi, medicalFacilitiesApi } from "@/src/services/facilityService";
import { NormalizedFacility } from "@/src/types/facility";
import { buildRelationsByFacility, getArrayData, normalizeFacility } from "@/src/utils/facilityNormalize";
import { FacilityRatingSummary } from "@/src/utils/facilityRating";

export function useFacilities() {
  const [facilities, setFacilities] = useState<NormalizedFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiNotice, setApiNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setApiNotice("");

    const [facilityResult, relationResult] = await Promise.allSettled([
      medicalFacilitiesApi.active(),
      facilityDepartmentsApi.active(),
    ]);

    if (facilityResult.status === "rejected") {
      setFacilities([]);
      setApiNotice("Chưa thể tải danh sách cơ sở y tế. Vui lòng kiểm tra kết nối và thử lại.");
      setLoading(false);
      return;
    }

    const rawFacilities = getArrayData(facilityResult.value);
    const relationsByFacility =
      relationResult.status === "fulfilled" ? buildRelationsByFacility(getArrayData(relationResult.value)) : new Map();

    const normalized = rawFacilities.map((facility) => {
      const relations = relationsByFacility.get(String((facility as Record<string, unknown>).facilityId ?? (facility as Record<string, unknown>).id)) ?? [];
      return normalizeFacility(facility, relations, relations.map((relation: { id: string }) => relation.id));
    });

    setFacilities(normalized);

    if (relationResult.status === "rejected") {
      setApiNotice("Danh sách khoa liên kết đang tạm thời chưa đầy đủ.");
    } else if (normalized.length === 0) {
      setApiNotice("Chưa có cơ sở y tế đang hoạt động.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateRating = useCallback((facilityId: string, summary: FacilityRatingSummary) => {
    setFacilities((current) => current.map((facility) => facility.facilityId === facilityId ? { ...facility, ...summary } : facility));
  }, []);

  return { facilities, loading, apiNotice, reload: load, updateRating };
}
