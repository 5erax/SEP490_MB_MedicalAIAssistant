export type FacilityTypeKey = "hospital" | "clinic" | "pharmacy" | "emergency" | "other";

export type FacilityDepartment = {
  id: string;
  name: string;
};

// Ported from normalizeFacility() in Web's NearbyClinicPage.jsx.
export type NormalizedFacility = {
  facilityId: string;
  facilityName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  hasValidCoordinates: boolean;
  phone: string;
  phoneLabel: string;
  website: string;
  imageUrl: string;
  description: string;
  facilityType: string;
  facilityTypeKey: FacilityTypeKey;
  facilityTypeLabel: string;
  openingHours: string;
  isActive: boolean;
  departments: string[];
  departmentIds: string[];
  consultationDepartments: FacilityDepartment[];
  distanceKm?: number | null;
};

export type FacilityDepartmentRelation = {
  facilityId: string;
  departmentId: string;
  departmentName: string;
};
