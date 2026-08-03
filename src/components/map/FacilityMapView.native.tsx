// Picks the real MapLibre map or the Expo Go fallback based on the actual
// runtime environment, instead of disabling the real map unconditionally.
//
// Why this needs a *lazy* require() instead of a static import: importing
// @maplibre/maplibre-react-native calls TurboModuleRegistry.getEnforcing(...)
// at module top level (confirmed by reading the installed package's
// NativeMapViewModule.js), which throws immediately if the native module
// isn't linked into the running binary — true for Expo Go, which only ships
// modules from the Expo SDK. A static `import` at the top of this file would
// be evaluated eagerly regardless of any runtime check below it, crashing
// Expo Go before any condition could be tested. Requiring the MapLibre-based
// component lazily, only on the non-Expo-Go branch, keeps its import out of
// the module graph Expo Go ever evaluates.
import Constants, { ExecutionEnvironment } from "expo-constants";
import type { ComponentType } from "react";

import type { FacilityMapViewProps } from "./FacilityMapView.types";
import { FacilityMapViewFallback } from "./FacilityMapViewFallback";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function loadMapLibreComponent() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- see module doc comment above
  const mod = require("./FacilityMapViewMapLibre") as typeof import("./FacilityMapViewMapLibre");
  return mod.FacilityMapViewMapLibre;
}

export const FacilityMapView: ComponentType<FacilityMapViewProps> = isExpoGo
  ? FacilityMapViewFallback
  : loadMapLibreComponent();
