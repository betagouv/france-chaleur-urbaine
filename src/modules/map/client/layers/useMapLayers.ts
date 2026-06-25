import type { GeoJSONSource, GeoJSONSourceSpecification, LayerSpecification } from 'maplibre-gl';
import { useEffect, useRef } from 'react';

import { useMapInstance, useMapReady, useUserResources } from '../core/MapCanvasContext';

/** A GeoJSON source driven by component data. If a source with this `id` already exists
 * (e.g. a static spec source), it is left in place and only its data is updated. */
export type MapDynamicSource = {
  id: string;
  data: GeoJSON.GeoJSON;
  promoteId?: GeoJSONSourceSpecification['promoteId'];
};

/** A layer added on top of the base layers. `source` references either one of this
 * component's `sources` or an existing base source (`reseaux-de-chaleur`, …). */
export type MapDynamicLayer = LayerSpecification & { source: string };

export type MapLayersProps = {
  sources?: readonly MapDynamicSource[];
  layers?: readonly MapDynamicLayer[];
};

/**
 * Declarative, data-driven management of ad-hoc sources + layers for one component.
 *
 * Centralizes the error-prone lifecycle that each bridge used to re-implement: `mapReady`
 * gating, source-before-layer ordering, `userResources` tracking (so overlays survive a
 * base-style swap), and teardown order (layers before sources). Single-component ownership
 * only — no cross-component effect ordering, so it never fights React's child-first effects.
 *
 * - Sources: created if missing, removed on unmount **only if this hook created them**
 *   (pre-existing static sources are never removed). Data is synced on reference change.
 * - Layers: added on top, removed on unmount / when the layer set changes. A layer whose
 *   source isn't mounted yet is skipped (e.g. a base layer disabled in the config).
 * - Vector layers default to `source-layer: 'layer'` (the module-wide tile convention).
 */
export function useMapLayers({ sources, layers }: MapLayersProps) {
  const map = useMapInstance();
  const mapReady = useMapReady();
  const userResources = useUserResources();
  const lastDataRef = useRef(new Map<string, GeoJSON.GeoJSON>());

  // Signatures: re-run structure effects only when the shape changes, not on every render.
  // Data updates (frequent) go through the dedicated effect below, never tearing layers down.
  const sourceIds = (sources ?? []).map((source) => source.id).join('|');
  const layersSignature = JSON.stringify(layers ?? []);

  // Sources structure: create the ones that don't exist yet, remove only those we created.
  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const createdSourceIds: string[] = [];
    for (const source of sources ?? []) {
      if (map.getSource(source.id)) {
        continue;
      }
      map.addSource(source.id, { data: source.data, ...(source.promoteId ? { promoteId: source.promoteId } : {}), type: 'geojson' });
      userResources.sources.add(source.id);
      lastDataRef.current.set(source.id, source.data);
      createdSourceIds.push(source.id);
    }
    return () => {
      for (const id of createdSourceIds) {
        if (map.getSource(id)) {
          map.removeSource(id);
        }
        userResources.sources.delete(id);
        lastDataRef.current.delete(id);
      }
    };
    // `sourceIds` is the stable signature of `sources` (data changes go through the data effect below).
  }, [map, mapReady, userResources, sourceIds]);

  // Layers structure: added after sources (declaration order) so own sources already exist.
  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const addedLayerIds: string[] = [];
    for (const layer of layers ?? []) {
      const source = map.getSource(layer.source);
      if (!source || map.getLayer(layer.id)) {
        continue;
      }
      // `source-layer` only exists on some members of the LayerSpecification union — read it safely.
      const sourceLayer = (layer as { 'source-layer'?: string })['source-layer'];
      const needsSourceLayer = source.type === 'vector' && !sourceLayer;
      map.addLayer({ ...layer, ...(needsSourceLayer ? { 'source-layer': 'layer' } : {}) });
      userResources.layers.add(layer.id);
      addedLayerIds.push(layer.id);
    }
    return () => {
      for (const id of addedLayerIds) {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
        userResources.layers.delete(id);
      }
    };
    // `layersSignature` is the stable signature of `layers`.
  }, [map, mapReady, userResources, layersSignature]);

  // Data sync: push new data into existing sources when its reference changes (no teardown).
  useEffect(() => {
    if (!mapReady) {
      return;
    }
    for (const source of sources ?? []) {
      if (lastDataRef.current.get(source.id) === source.data) {
        continue;
      }
      const mapSource = map.getSource(source.id) as GeoJSONSource | undefined;
      if (mapSource && 'setData' in mapSource) {
        mapSource.setData(source.data);
        lastDataRef.current.set(source.id, source.data);
      }
    }
  }, [map, mapReady, sources]);
}

/**
 * Component wrapper around {@link useMapLayers}, for declarative usage as a child of `<Map>`:
 * `<MapLayers sources={…} layers={…} />`.
 */
export function MapLayers(props: MapLayersProps) {
  useMapLayers(props);
  return null;
}
