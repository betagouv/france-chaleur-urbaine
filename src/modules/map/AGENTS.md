# Module Map (V2)

> New map module replacing `src/components/Map/`. Built step-by-step under the plan `.ai/plans/map-v2-handover.md`.

## Status

🚧 In progress — coexists with the V1 component `src/components/Map/Map.tsx` until full migration.

Validated manually on the sandbox page `/dev/map-v2` before moving on.

## Goals

- Multiple instances active simultaneously without interference (no singletons).
- Controls built-in (opt-out via `interactive={false}` for static maps).
- One declarative entry-point for predefined layers (`layers` + `config` on `<MapCanvas>`).
- V1-fidelity click/hover (15px buffer, geometry priority, turf snap).
- Performance by default: per-layer diff on config change, lazy mount.

## Engine

MapLibre GL direct (no `react-map-gl` wrapper).

## Styling

Tailwind only. No legacy `Box` / `Text` / `Heading` props-style components — write `<div>` / `<span>` / `<h*>` with Tailwind classes. Same for DSFR text classes : prefer `text-xs|sm|base` over `fr-text--xs|sm|md` (DSFR ships a hidden `margin-bottom`).

## Top-level components

Two entry points, picked by usage:

| Component | Use when… | Source of config | Built-in features |
|-----------|-----------|------------------|-------------------|
| `MapCanvas` | mini-map / embed / custom layer set — no legend, no search | `config` prop (full `MapConfiguration`) | controls, layers via `layers` prop |
| `Map` | app pages, iframes, sandboxes — built-in layers + provider | `config` prop (initial `DeepPartial<MapConfiguration>`) | mounts own `MapStoreProvider` (Jotai store scoped per-instance), legend drawer, search/eligibility overlay |

`Map` is `dynamic({ ssr: false })` (defined in `client/Map.tsx`) and lazily loads its implementation `client/core/MapImpl.tsx`. **Don't merge `MapImpl` into `Map.tsx`** — the wrapper file must stay free of `maplibre-gl` imports for the `dynamic` split to work.

### `Map` props

| Prop | Default | Description |
|---|---|---|
| `config` | — | Initial `DeepPartial<MapConfiguration>`. `Map` mounts its own provider from this; runtime mutations (legend toggles) live in the provider. Changing this prop after mount has no effect. |
| `initialView` | center=France, zoom=5 | Same shape as `MapCanvas`. |
| `interactive` | `true` | Forwards to `MapCanvas`. |
| `legend` | `false` | `false` / `'hidden'` (button only) / `'auto'` (open on ≥ 768px). When enabled, `MapLegend` owns the `?tab` URL param (nuqs) — host pages must not reuse `tab` for their own state. |
| `search` | `'none'` | `'none'` / `'network'` (address + heating-network → flyTo/fitBounds) / `'eligibility'` (address → tRPC query + colored marker history). |
| `searchPlaceholder` | — | Override the search input placeholder. |
| `mapRef` | — | External `RefObject<MapCanvasController \| null>` (e.g. for FlyToButtons). |
| `className`, `children` | — | Standard. |

## Current structure

```
src/modules/map/
  AGENTS.md
  shared/
    types.ts                  # LngLat, BBox, InitialView
    config.ts                 # default view, OSM + satellite styles, defaultStyles
    osm.config.json, satellite.config.json  # raw MapLibre style specs
  client/
    Map.tsx                   # dynamic({ ssr: false }) wrapper — keep slim
    MapCanvas.tsx             # core — single MapLibre instance + ConfiguredLayers + MapInteractions
    MapStoreProvider.tsx      # per-<Map> Jotai store (createStore + Provider + hydrate config)
    components/
      DownloadNetworkGeometryButton.tsx  # network geometry export button (used by réseaux specs)
    config/
      useMapConfig.ts         # reads/mutates `mapConfigAtom` + reducer (atoms declared here)
      useMapConfiguration.ts  # builds a full MapConfiguration (fetches RDC limits via tRPC)
      map-configuration.ts    # types + createMapConfiguration
    core/
      MapImpl.tsx             # impl loaded by Map — mounts MapStoreProvider + canvas + overlays
      MapCanvasContext.tsx    # context (local to MapCanvas subtree): map, mapReady, controller, userResources
      controller.ts           # imperative API (flyTo, fitBounds, setStyle)
      common.tsx              # MapSourceLayersSpecification, popup helpers
    interactions/
      atoms.ts                # mapInstance / mapReady / mapDraw / isDrawing atoms (scoped via MapStoreProvider)
      MapInteractions.tsx     # V1-style click/hover + turf snap + popup portal (paused while isDrawing)
      MapInstanceSync.tsx     # bridges MapCanvasContext into atoms (mounted under MapCanvas)
      MapDrawHost.tsx         # mounts a MapboxDraw control, exposed via mapDrawAtom
      MapMarker.tsx           # HTML marker overlay (uses useMapInstance)
      BdnbBatimentSelector.tsx # building selector on the bdnb-batiments source (controlled, lock-on-select)
      FileDropHandler.tsx     # drag/drop + paste geo-file → GeoJSON source overlay
      fileConversion.ts       # file → GeoJSON helpers (kml/kmz/geojson/shapefile, proj4)
    controls/                 # IControl wrappers (mounted by MapCanvas when interactive)
    layers/
      ConfiguredLayers.tsx    # component + useConfiguredLayers hook
      all-layers.ts           # the built-in layer set mounted by <Map>
      specs/                  # MapSourceLayersSpecification + matching <layer>.legend.tsx
    legend/
      atoms.ts                       # legendOpenAtom (scoped via MapStoreProvider)
      MapLegend.tsx                  # the 4-tab legend (Réseaux/Potentiel/EnR&R/Outils)
      LegendDrawer.tsx               # left-side drawer; reads/writes legendOpenAtom
      LegendCheckbox.tsx, LegendIntervalSlider.tsx, LegendSection.tsx, LegendIcon.tsx
      ReseauxDeChaleurFilters.tsx    # V1-parity filter panel bound to the Jotai config store
    search/
      MapSearchInput.tsx          # combined BAN + reseaux.searchForMap autocomplete
      AddressSearchInput.tsx      # BAN-only autocomplete (eligibility flow)
      EligibilityResultsPanel.tsx # listing of tested addresses (mounted under the search input when search='eligibility')
      legacy/
        CardSearchDetails.tsx # ⚠️ styled-components — to port/revisit (eligibility result card, used by V1 too)
    dev/
      Sandbox.tsx             # one <Map> piloted by a mini-form (/dev/map-v2)
      MapV1Demo.tsx, FlyToButtons.tsx
```

## Public API

### Core

| Export | Kind | Description |
|---|---|---|
| `MapCanvas` | Component | Single MapLibre instance for the component lifetime. Mounts built-in controls + interactions when `interactive`. |
| `useMapInstance()` | Hook | Returns the MapLibre `Map` instance (children of `<MapCanvas>`). |
| `useMapCanvasController()` | Hook | Imperative controller `{ flyTo, fitBounds, setStyle, ... }` for children. |
| `useMapReady()` | Hook | `true` once the map's `load` event fired. |
| `MapCanvasController` | Type | Type of the controller. |
| `LngLat`, `BBox`, `InitialView` | Types | From `shared/types.ts`. |

### `MapCanvas` props

| Prop | Default | Description |
|---|---|---|
| `initialView` | center=France, zoom=5 | `{ center, zoom? }` or `{ bbox }` — snapshotted at mount, change later via controller. |
| `interactive` | `true` | When `false`: pan/zoom/touch disabled, no controls (attribution still rendered), no click/hover popups. |
| `layers` | — | V1-style `MapSourceLayersSpecification[]`. Auto-mounted + diffed against `config`. |
| `config` | — | `MapConfiguration` driving each spec's `isVisible` / `filter`. |
| `mapRef` | — | Optional `RefObject<MapCanvasController \| null>` for outside-the-tree access (e.g. external buttons calling `flyTo`). |
| `className` | — | Tailwind utility classes for the outer container. |
| `children` | — | Optional overlays / future dynamic layers. |

Zoom bounds and the FCU attribution (link to `/donnees`) are hardcoded — they don't vary across callers.

### Centralized layers

| Export | Description |
|---|---|
| `MapSourceLayersSpecification` | Source + sublayers + V1-style `isVisible(config)` / `filter(config)` / optional `popup`. |
| `MapLayerSpecification` | One render layer with popup handler. |
| `reseauxDeChaleurLayersSpec` | First migrated spec (`layers/specs/reseauxDeChaleur.tsx`). More to follow. |
| `ConfiguredLayers` / `useConfiguredLayers(layers, config)` | Component + hook. The component is rendered conditionally by `<MapCanvas>` when both `layers` and `config` are present. |

### Interactions

Built-in. When `interactive=true` and `layers` are provided, `<MapCanvas>` mounts `<MapInteractions layers={layers} />`:
- selectable layers = sublayers without `unselectable: true`,
- on `mousemove` / `click` / `touchend`: `queryRenderedFeatures` over a 15px buffer around the cursor,
- pick by geometry priority (Point > Line > Polygon), nearest-distance tie-break via turf,
- hover state applied via `setFeatureState`,
- popup opened at the turf-snapped nearest point on the feature, content portal'd into a `maplibregl.Popup`.

`MapInteractions.tsx` exports both the component and the underlying `useMapInteractions(layers)` hook for advanced callers.

### Building selector

`<BdnbBatimentSelector value onSelect />` — child of `<Map>` or `<MapCanvas>`. Mounts its own `fill` + `line` layers on the `bdnb-batiments` source (reuses the existing source if `caracteristiquesBatiments` is in `allLayers`, otherwise adds one). Controlled by the parent:

- `value === null` → user can hover (blue highlight) and click to pick. `onSelect(batiment_groupe_id)` fires.
- `value === '<id>'` → that building is painted blue (`feature-state.selected`), all clicks/hovers are ignored. To unlock, parent passes `value = null` (typically via an out-of-map button).

Style is intentionally sober : gray translucent fill + thin outline; blue accent on hover/selected. Don't activate `caracteristiquesBatiments` in the same map — both layers paint on the same source and overlap.

Only the `batiment_groupe_id` is emitted. Callers that need details should query `trpc.bdnb.getBdnbBatimentDetails` themselves.

## Lifecycle and reliability notes

- **Single instance per component lifetime**: deferred cleanup (`setTimeout 0`) preserves the MapLibre instance across React 18 strict-mode mount/unmount/mount cycles. Real `map.remove()` only on genuine unmount.
- **Mount-only view props**: `initialView` and `interactive` are snapshotted at the first mount. Use the controller for runtime updates. To switch a map between interactive and static, remount it with a `key` derived from the value.
- **`mapReady` gates layer setup**: `useConfiguredLayers` only adds sources/layers once `mapReady` becomes `true`. No `map.once('load', …)` race with strict-mode cleanups.
- **Style switching**: `controller.setStyle(...)` uses MapLibre's `transformStyle` to preserve user-added sources/layers atomically. Tracking owned by `userResources` on the context.

## Loading convention (page-level)

**`Map` is SSR-disabled out of the box** (`dynamic({ ssr: false })` in `client/Map.tsx`). Most app pages just `import { Map } from '@/modules/map/client/Map'`:

```tsx
// FooMap.tsx — client- or server-rendered
import { Map } from '@/modules/map/client/Map';

export default function FooMap() {
  return <Map config={{ reseauxDeChaleur: { show: true } }} legend="auto" search="network" />;
}
```

For mini-maps / embeds that need a custom layer set or no provider:

```tsx
// MiniMap.tsx — client-only file
import { MapCanvas } from '@/modules/map/client/MapCanvas';
import { reseauxDeChaleurLayersSpec } from '@/modules/map/client/layers/specs/reseauxDeChaleur';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';

const config = createMapConfiguration({ reseauxDeChaleur: { show: true } });
export default function MiniMap() {
  return <MapCanvas layers={[...reseauxDeChaleurLayersSpec]} config={config} interactive={false} />;
}
```

**Anti-patterns to avoid**:
- Moving the impl into `Map.tsx` — breaks the SSR split, `maplibre-gl` ends up in the server bundle.
- `dynamic()` on individual controls or layers — cascade of HTTP requests.
- Static imports of `maplibre-gl` inside SSR-rendered files — crashes the build.
- `React.lazy()` for map components — same cascade problem.

## Coming next

- Outils tab: distance / extract / linear heat density (currently disabled placeholders in `MapLegend.tsx`).
- Map config piloted by URL (likely via a `Map` prop) — not implemented yet; the current provider state is in-memory only.
- Phase 4 — primitives for ad-hoc dynamic React layers (à-la `<MapSource>` / `<MapLayer>`).
