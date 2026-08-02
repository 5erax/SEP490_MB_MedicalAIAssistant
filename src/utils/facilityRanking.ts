// Ported 1:1 from src/pages/DashboardPage.jsx (Web) — facility ranking after
// a specialty-intake result. Kept as a standalone module (not just Dashboard)
// because Nearby Clinics/Map (Module 3) also ranks facilities from cached
// clinical results.
import { ClinicalAnalysisResult, ClinicalDepartment, ClinicalFacility } from "@/src/types/symptomAnalysis";

export type GeoPoint = { latitude: number; longitude: number };

// Distance helpers only need coordinates, so they accept any facility-like
// shape with lat/lng — shared between symptomAnalysis's ClinicalFacility
// (Dashboard) and facility.ts's NormalizedFacility (Map), which otherwise
// differ (departments: ClinicalDepartment[] vs string[]).
type HasCoordinates = { latitude: number | null; longitude: number | null };

function coordinateOrNull(value: unknown, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) return null;
  return numeric;
}

export function getFacilityCoordinates(facility: HasCoordinates): GeoPoint | null {
  const latitude = coordinateOrNull(facility.latitude, -90, 90);
  const longitude = coordinateOrNull(facility.longitude, -180, 180);
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

function distanceKmBetween(first: GeoPoint, second: GeoPoint) {
  const radiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(second.latitude - first.latitude);
  const deltaLon = toRadians(second.longitude - first.longitude);
  const lat1 = toRadians(first.latitude);
  const lat2 = toRadians(second.latitude);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getFacilityDistanceKm(facility: HasCoordinates, userLocation: GeoPoint | null) {
  const facilityLocation = getFacilityCoordinates(facility);
  if (!facilityLocation || !userLocation) return null;
  return distanceKmBetween(userLocation, facilityLocation);
}

export function getFacilityId(facility: ClinicalFacility | null | undefined) {
  return facility?.facilityId || "";
}

export function formatDistance(distanceKm: number | null) {
  if (distanceKm == null) return "";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

function hasDepartmentMatch(facility: ClinicalFacility, department: ClinicalDepartment | null) {
  if (!department) return false;
  const departmentId = String(department.departmentId || "");
  const departmentName = String(department.departmentName || "").toLowerCase();
  const departments = Array.isArray(facility.departments) ? facility.departments : [];

  return departments.some(
    (item) =>
      (departmentId && String(item.departmentId) === departmentId)
      || (departmentName && String(item.departmentName || "").toLowerCase().includes(departmentName)),
  );
}

function scoreFacility(facility: ClinicalFacility, department: ClinicalDepartment | null, userLocation: GeoPoint | null) {
  let score = 0;
  if (hasDepartmentMatch(facility, department)) score += 100;
  const distanceKm = getFacilityDistanceKm(facility, userLocation);
  if (distanceKm != null) score += Math.max(0, 60 - distanceKm * 4);
  else if (getFacilityCoordinates(facility)) score += 20;
  const rating = facility.rating || facility.averageRating;
  if (rating) score += Number(rating) * 3;
  if (facility.isActive) score += 12;
  if (facility.openingHours) score += 8;
  if (facility.phone) score += 6;
  if (facility.website) score += 4;
  return score;
}

export function getFacilityRankingReason(
  facility: ClinicalFacility,
  department: ClinicalDepartment | null,
  userLocation: GeoPoint | null,
) {
  const reasons: string[] = [];
  const distanceKm = getFacilityDistanceKm(facility, userLocation);

  if (hasDepartmentMatch(facility, department)) reasons.push("có chuyên khoa liên quan");
  if (distanceKm != null) reasons.push(`cách bạn khoảng ${formatDistance(distanceKm)}`);
  else if (getFacilityCoordinates(facility)) reasons.push("có tọa độ sẵn sàng điều hướng");
  const rating = facility.rating || facility.averageRating;
  if (rating) reasons.push(`${rating} sao đánh giá`);
  if (facility.isActive) reasons.push("đang hoạt động");

  return reasons.length ? `Ưu tiên vì ${reasons.join(", ")}.` : "Nằm trong danh sách cơ sở được hệ thống gợi ý.";
}

export function getRecommendedDepartment(result: ClinicalAnalysisResult | null): ClinicalDepartment | null {
  if (result?.recommendedDepartment) return result.recommendedDepartment;

  const facilities = result?.recommendedFacilities ?? [];
  for (const facility of facilities) {
    const department = facility.departments?.[0];
    if (department) return department;
  }
  return null;
}

export function sortRecommendedFacilities(result: ClinicalAnalysisResult | null, userLocation: GeoPoint | null) {
  const department = getRecommendedDepartment(result);
  return [...(result?.recommendedFacilities ?? [])].sort(
    (left, right) => scoreFacility(right, department, userLocation) - scoreFacility(left, department, userLocation),
  );
}
