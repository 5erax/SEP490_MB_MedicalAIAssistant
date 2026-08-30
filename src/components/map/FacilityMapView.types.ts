import { NormalizedFacility } from "@/src/types/facility";
import { GeoPoint } from "@/src/utils/facilityRanking";

export type MapLoadStatus = "loading" | "ready" | "error";
export type MapZoomDirection = "in" | "out";

export type MapZoomAction = {
  id: number;
  direction: MapZoomDirection;
};

export type FacilityMapViewProps = {
  facilities: NormalizedFacility[];
  selectedFacility: NormalizedFacility | null;
  userLocation: GeoPoint | null;
  onSelectFacility: (facility: NormalizedFacility) => void;
  onStatusChange?: (status: MapLoadStatus) => void;
  retryKey?: number;
  zoomAction?: MapZoomAction;
};
