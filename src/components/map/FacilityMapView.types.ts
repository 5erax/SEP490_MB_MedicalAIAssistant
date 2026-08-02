import { NormalizedFacility } from "@/src/types/facility";
import { GeoPoint } from "@/src/utils/facilityRanking";

export type MapLoadStatus = "loading" | "ready" | "error";

export type FacilityMapViewProps = {
  facilities: NormalizedFacility[];
  selectedFacility: NormalizedFacility | null;
  userLocation: GeoPoint | null;
  onSelectFacility: (facility: NormalizedFacility) => void;
  onStatusChange?: (status: MapLoadStatus) => void;
  retryKey?: number;
};
