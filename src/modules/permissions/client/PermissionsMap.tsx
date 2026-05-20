import Loader from '@/components/ui/Loader';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { MapFitBounds } from '@/modules/map/client/interactions/MapFitBounds';
import { type MapDynamicLayer, type MapDynamicSource, MapLayers } from '@/modules/map/client/layers/useMapLayers';
import { Map } from '@/modules/map/client/Map';
import type { BBox } from '@/modules/map/shared/types';
import trpc, { type RouterOutput } from '@/modules/trpc/client';

const highlightColor = '#e11d48';

const mapConfiguration = createMapConfiguration({
  reseauxDeChaleur: { show: true },
  reseauxEnConstruction: true,
  zonesDeDeveloppementPrioritaire: true,
});

type PermissionsMapData = RouterOutput['permissions']['myMapData'];

/** Builds the highlight overlays (layers on base sources + a `user-territories` GeoJSON source). */
function buildOverlays(mapData: PermissionsMapData): { sources: MapDynamicSource[]; layers: MapDynamicLayer[] } {
  const { highlightReseauxExistants, highlightReseauxEnConstruction, highlightPdpIdsFcu, territories } = mapData;
  const sources: MapDynamicSource[] = [];
  const layers: MapDynamicLayer[] = [];

  if (highlightReseauxExistants.length > 0) {
    layers.push({
      filter: ['in', ['get', 'id_fcu'], ['literal', highlightReseauxExistants]],
      id: 'permissions-highlight-reseaux-existants',
      paint: { 'line-color': highlightColor, 'line-opacity': 0.9, 'line-width': 4 },
      source: 'reseaux-de-chaleur',
      type: 'line',
    });
  }

  if (highlightReseauxEnConstruction.length > 0) {
    layers.push(
      {
        filter: ['all', ['==', ['get', 'is_zone'], false], ['in', ['get', 'id_fcu'], ['literal', highlightReseauxEnConstruction]]],
        id: 'permissions-highlight-reseaux-construction',
        paint: { 'line-color': highlightColor, 'line-opacity': 0.9, 'line-width': 4 },
        source: 'reseaux-en-construction',
        type: 'line',
      },
      {
        filter: ['all', ['==', ['get', 'is_zone'], true], ['in', ['get', 'id_fcu'], ['literal', highlightReseauxEnConstruction]]],
        id: 'permissions-highlight-reseaux-construction-zones',
        paint: { 'fill-color': highlightColor, 'fill-opacity': 0.2 },
        source: 'reseaux-en-construction',
        type: 'fill',
      }
    );
  }

  if (highlightPdpIdsFcu.length > 0) {
    layers.push({
      filter: ['in', ['get', 'id_fcu'], ['literal', highlightPdpIdsFcu]],
      id: 'permissions-highlight-pdp',
      paint: { 'fill-color': highlightColor, 'fill-opacity': 0.15 },
      source: 'perimetres-de-developpement-prioritaire',
      type: 'fill',
    });
  }

  if (territories.features.length > 0) {
    sources.push({ data: territories, id: 'user-territories' });
    layers.push(
      {
        id: 'user-territories-fill',
        paint: { 'fill-color': highlightColor, 'fill-opacity': 0.12 },
        source: 'user-territories',
        type: 'fill',
      },
      {
        id: 'user-territories-outline',
        paint: { 'line-color': highlightColor, 'line-opacity': 0.8, 'line-width': 2 },
        source: 'user-territories',
        type: 'line',
      }
    );
  }

  return { layers, sources };
}

type PermissionsMapProps = {
  /** Bounds of the selected permission to frame, or `undefined` to keep the initial view. */
  focusBounds?: BBox;
};

/**
 * Displays the user's permissions on an interactive map,
 * highlighting their networks and territories.
 */
const PermissionsMap = ({ focusBounds }: PermissionsMapProps) => {
  const { data: mapData, isLoading } = trpc.permissions.myMapData.useQuery(undefined);

  if (isLoading || !mapData) {
    return <Loader />;
  }

  const { sources, layers } = buildOverlays(mapData);

  // Frame the selected permission at mount (instant, no `mapReady` race); fall back to all-data bounds
  // when nothing is selected. `MapFitBounds` then handles later selection changes (map already alive).
  const initialBounds = focusBounds ?? mapData.bounds;

  return (
    <div className="h-[500px]">
      <Map config={mapConfiguration} initialView={initialBounds ? { bbox: initialBounds } : undefined} legend={false}>
        <MapLayers sources={sources} layers={layers} />
        <MapFitBounds bbox={focusBounds} padding={50} />
      </Map>
    </div>
  );
};

export default PermissionsMap;
