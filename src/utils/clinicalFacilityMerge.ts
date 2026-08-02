// Ported from the clinicalRecommendationFacilities/recommendedFacilityOrder
// logic in Web's NearbyClinicPage.jsx (§2/§6 of the port contract): in the
// clinical flow, facilities are NOT re-scored by distance/department match —
// they keep the order the backend/cached analysis already returned, merged
// onto the live "active facilities" data when a match exists.
import { ClinicalFacility } from "@/src/types/symptomAnalysis";
import { NormalizedFacility } from "@/src/types/facility";
import { normalizeFacility } from "@/src/utils/facilityNormalize";

export function buildRecommendedFacilities(
  recommendedFacilities: ClinicalFacility[],
  loadedFacilities: NormalizedFacility[],
) {
  const loadedById = new Map(loadedFacilities.map((facility) => [facility.facilityId, facility]));
  const facilities: NormalizedFacility[] = [];
  const order = new Map<string, number>();
  let unavailableCount = 0;

  recommendedFacilities.forEach((recommended) => {
    if (recommended.isActive === false) {
      unavailableCount += 1;
      return;
    }

    const facilityId = recommended.facilityId;
    const matched = loadedById.get(facilityId) ?? normalizeFacility(recommended as unknown as Record<string, unknown>);
    facilities.push(matched);
    order.set(facilityId, order.size);
  });

  return { facilities, order, unavailableCount };
}
