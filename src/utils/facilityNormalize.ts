// Ported from src/pages/NearbyClinicPage.jsx (Web) — normalizeFacility(),
// normalizeFacilityType(), TYPE_LABELS, mergeFacilityDetail(), and the
// getArrayData/getObjectData response-unwrapping helpers.
import { FacilityDepartment, FacilityDepartmentRelation, FacilityTypeKey, NormalizedFacility } from "@/src/types/facility";
import { normalizeFacilityRating } from "./facilityRating";

export const TYPE_LABELS: Record<FacilityTypeKey, string> = {
  hospital: "Bệnh viện",
  clinic: "Phòng khám",
  pharmacy: "Nhà thuốc",
  emergency: "Cấp cứu",
  other: "Cơ sở y tế",
};

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export { normalizeSearchText };

export function normalizeFacilityType(value: unknown): FacilityTypeKey {
  const text = normalizeSearchText(value);
  if (!text) return "other";
  if (text.includes("hospital") || text.includes("benh vien")) return "hospital";
  if (text.includes("clinic") || text.includes("phong kham")) return "clinic";
  if (text.includes("pharmacy") || text.includes("nha thuoc")) return "pharmacy";
  if (text.includes("emergency") || text.includes("cap cuu")) return "emergency";
  return "other";
}

function coordinateOrNull(value: unknown, min: number, max: number) {
  if (value == null || String(value).trim() === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) return null;
  return numeric;
}

function toStringOrEmpty(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function getArrayData(response: unknown): Record<string, unknown>[] {
  const withData = response as { data?: unknown } | undefined;
  const data = withData?.data;
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const items = (data as { items?: unknown } | undefined)?.items;
  if (Array.isArray(items)) return items as Record<string, unknown>[];
  return [];
}

export function getObjectData<T = Record<string, unknown>>(response: unknown): T {
  const withData = response as { data?: { data?: T } & T } | undefined;
  return (withData?.data?.data ?? withData?.data ?? response) as T;
}

export function normalizeFacility(
  facility: Record<string, unknown>,
  relationDepartments: FacilityDepartment[] = [],
  relationDepartmentIds: string[] = [],
): NormalizedFacility {
  const facilityId = toStringOrEmpty(facility.facilityId ?? facility.id);
  const facilityType = toStringOrEmpty(facility.facilityType);
  const facilityTypeKey = normalizeFacilityType(facilityType);

  const embeddedDepartments = Array.isArray(facility.departments)
    ? (facility.departments as unknown[]).map((department) =>
        typeof department === "string" ? department : toStringOrEmpty((department as Record<string, unknown>)?.departmentName ?? (department as Record<string, unknown>)?.name),
      ).filter(Boolean)
    : [];
  const embeddedDepartmentDetails = Array.isArray(facility.departments)
    ? facility.departments.filter((department) => department && typeof department === "object").map((department) => ({
        id: toStringOrEmpty(department.departmentId ?? department.id),
        name: toStringOrEmpty(department.departmentName ?? department.name),
      })).filter((department) => department.id && department.name)
    : [];
  const embeddedDepartmentIds = Array.isArray(facility.departmentIds)
    ? (facility.departmentIds as unknown[]).map(toStringOrEmpty).filter(Boolean)
    : [];

  const departments = Array.from(new Set([...embeddedDepartments, ...relationDepartments.map((d) => d.name)])); // dedup
  const departmentIds = Array.from(new Set([...embeddedDepartmentIds, ...embeddedDepartmentDetails.map((department) => department.id), ...relationDepartmentIds]));

  const consultationMap = new Map<string, FacilityDepartment>();
  [...embeddedDepartmentDetails, ...relationDepartments].forEach((department) => {
    if (department.id) consultationMap.set(department.id, department);
  });

  return {
    facilityId,
    ...normalizeFacilityRating(facility),
    facilityName: toStringOrEmpty(facility.facilityName) || "Cơ sở y tế",
    address: toStringOrEmpty(facility.address) || "TP.HCM",
    latitude: coordinateOrNull(facility.latitude, -90, 90),
    longitude: coordinateOrNull(facility.longitude, -180, 180),
    hasValidCoordinates:
      coordinateOrNull(facility.latitude, -90, 90) !== null && coordinateOrNull(facility.longitude, -180, 180) !== null,
    phone: toStringOrEmpty(facility.phone),
    phoneLabel: toStringOrEmpty(facility.phone) || "Chưa có số điện thoại",
    website: toStringOrEmpty(facility.website),
    imageUrl: toStringOrEmpty(facility.imageUrl ?? facility.thumbnailUrl ?? facility.photoUrl),
    description: toStringOrEmpty(facility.description ?? facility.summary),
    facilityType,
    facilityTypeKey,
    facilityTypeLabel: TYPE_LABELS[facilityTypeKey],
    openingHours: toStringOrEmpty(facility.openingHours) || "Đang cập nhật",
    isActive: facility.isActive !== false,
    departments: departments.length ? departments : ["Đa khoa"],
    departmentIds,
    consultationDepartments: Array.from(consultationMap.values()),
    distanceKm: typeof facility.distanceKm === "number" && Number.isFinite(facility.distanceKm) && facility.distanceKm >= 0 ? facility.distanceKm : null,
  };
}

export function mergeFacilityDetail(existing: NormalizedFacility, apiFacility: Record<string, unknown>): Record<string, unknown> {
  return {
    ...existing,
    ...normalizeFacilityRating(apiFacility),
    phone: toStringOrEmpty(apiFacility.phone) || existing.phone,
    website: toStringOrEmpty(apiFacility.website) || existing.website,
    openingHours: toStringOrEmpty(apiFacility.openingHours) || existing.openingHours,
    imageUrl: toStringOrEmpty(apiFacility.imageUrl ?? apiFacility.thumbnailUrl ?? apiFacility.photoUrl) || existing.imageUrl,
    description: toStringOrEmpty(apiFacility.description ?? apiFacility.summary) || existing.description,
  };
}

export function buildRelationsByFacility(relations: Record<string, unknown>[]): Map<string, FacilityDepartment[]> {
  const relationsByFacility = new Map<string, FacilityDepartment[]>();

  relations.forEach((relation) => {
    const facilityId = toStringOrEmpty(
      relation.facilityId ?? relation.medicalFacilityId ?? (relation.facility as Record<string, unknown> | undefined)?.id,
    );
    const departmentId = toStringOrEmpty(
      relation.departmentId ?? relation.medicalDepartmentId ?? (relation.department as Record<string, unknown> | undefined)?.id,
    );
    const departmentName =
      toStringOrEmpty(
        relation.departmentName ?? relation.medicalDepartmentName ?? (relation.department as Record<string, unknown> | undefined)?.name,
      ) || "Chuyên khoa chưa cập nhật tên";

    if (!facilityId) return;
    const list = relationsByFacility.get(facilityId) ?? [];
    list.push({ id: departmentId, name: departmentName });
    relationsByFacility.set(facilityId, list);
  });

  return relationsByFacility;
}

export function toFacilityDepartmentRelations(relations: Record<string, unknown>[]): FacilityDepartmentRelation[] {
  return relations.map((relation) => ({
    facilityId: toStringOrEmpty(
      relation.facilityId ?? relation.medicalFacilityId ?? (relation.facility as Record<string, unknown> | undefined)?.id,
    ),
    departmentId: toStringOrEmpty(
      relation.departmentId ?? relation.medicalDepartmentId ?? (relation.department as Record<string, unknown> | undefined)?.id,
    ),
    departmentName:
      toStringOrEmpty(
        relation.departmentName ?? relation.medicalDepartmentName ?? (relation.department as Record<string, unknown> | undefined)?.name,
      ) || "Chuyên khoa chưa cập nhật tên",
  }));
}
