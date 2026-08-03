# Mobile Map Quality Audit

Date: 2026-08-03

Source of truth: `SEP490_FE_MedicalAIAssistant`

## Summary

The Web map and the native Mobile map are aligned on the same free vector tile
style: CARTO Positron via MapLibre.

The poor "preview map" quality seen on the Android emulator happens when the
app is launched in Expo Go. Expo Go does not include
`@maplibre/maplibre-react-native`, so Mobile intentionally falls back to an SVG
map preview to avoid the `MLRNCameraModule` native-module crash. That fallback
has no real tile provider, labels, road layer, building layer, or landmark
layer.

To see the same real map quality as Web, run a custom dev client or native app
build, not Expo Go.

## Web Map

- Provider: MapLibre GL JS through `react-map-gl/maplibre`.
- Tile provider: CARTO basemaps.
- Style URL: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`.
- Tile type: vector style with vector tile sources from the style document.
- Map layers: inherited from the CARTO Positron style.
- Labels: provided by the style.
- Roads: provided by the style.
- Buildings: provided by the style where available.
- Landmarks/POI: provided by the style where available.
- Markers: React DOM markers, acceptable on Web for the current data size.

## Mobile Map

### Expo Go Runtime

- Provider: no native map provider.
- Tile provider: none.
- Raster tile: none.
- Vector tile: none.
- Labels: none.
- Road/building/landmark layers: none.
- Rendering: local SVG fallback with memoized markers, gesture-handler, and
  Reanimated pan/zoom.
- Purpose: safe preview only, because Expo Go cannot link MapLibre native
  modules.

### Custom Dev Client / Native Build Runtime

- Provider: `@maplibre/maplibre-react-native`.
- Tile provider: CARTO basemaps.
- Style URL: `EXPO_PUBLIC_MAP_STYLE_URL`, falling back to the same CARTO
  Positron style used by Web.
- Raster tile: not used by default.
- Vector tile: yes, through the style URL.
- Min zoom: 9.
- Max zoom: 18.
- Bounds: constrained around HCMC to avoid accidental panning into unloaded
  irrelevant regions.
- Labels/roads/buildings/landmarks: inherited from the vector style.
- Camera: native MapLibre camera with 60 FPS preference and short ease
  animations.
- Markers: moved from React `<Marker>` components to `GeoJSONSource + Layer`.
- Cluster: native source clustering enabled.

## Performance Changes

- Marker rendering now runs through MapLibre layers instead of React marker
  subtrees.
- Cluster rendering is native and avoids rendering every marker at lower zooms.
- Only the GeoJSON source updates when selected facility changes.
- Cluster tap animates camera to the expansion zoom.
- Facility tap selects the facility and eases the camera to zoom 16.
- Bottom sheet remains outside the map component and is memoized, so opening it
  does not rebuild the native map.
- Search remains debounced in `MapScreen` before it changes the map data.
- FlatList sheet already uses virtualization settings:
  `initialNumToRender`, `maxToRenderPerBatch`, `removeClippedSubviews`,
  `updateCellsBatchingPeriod`, and `windowSize`.

## Remaining Runtime Requirement

Expo Go will still show the fallback preview. This is expected and correct.

Use one of these paths for real tiles:

```bash
npx expo run:android
npx expo start --dev-client
```

or create an EAS development build that includes
`@maplibre/maplibre-react-native`.

## Follow-up Options

- If the project receives a paid provider key, set `EXPO_PUBLIC_MAP_STYLE_URL`
  to a higher-detail MapTiler/Mapbox-compatible vector style.
- Add offline tile packs for HCMC once the production tile provider is final.
- Profile FPS on a real Android mid-range device with Android Studio Profiler.
