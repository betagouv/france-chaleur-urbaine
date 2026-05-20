import type { GeoJSONSourceSpecification, LayerSpecification, SourceSpecification } from 'maplibre-gl';
import { useEffect, useRef } from 'react';

import { clientConfig } from '@/client-config';
import type { MapConfiguration } from '@/components/Map/map-configuration';
import { tileSourcesMaxZoom } from '@/modules/tiles/constants';

import type { MapSourceLayersSpecification } from '../core/common';
import { useMapInstance, useMapReady, useUserResources } from '../core/MapCanvasContext';

function isGeoJSONSource(source: MapSourceLayersSpecification['source']): source is GeoJSONSourceSpecification {
  return !!source && 'type' in source && source.type === 'geojson';
}

type AppliedState = { visibility?: boolean; filter?: string };

type ConfiguredLayersProps = {
  layers: readonly MapSourceLayersSpecification[];
  config: MapConfiguration;
};

/**
 * Drives V1-style layer specs against a `MapConfiguration`. Mount it
 * conditionally — when mounted, sources/layers are added and kept in sync;
 * when unmounted, everything is removed. Click/hover are handled by the
 * sibling `<MapInteractions>`.
 */
export function ConfiguredLayers({ layers, config }: ConfiguredLayersProps) {
  useConfiguredLayers(layers, config);
  return null;
}

/**
 * Hook backing `<ConfiguredLayers>`:
 *  - mounts sources + sublayers once the style is loaded (mirrors V1 `loadMapLayers`),
 *  - on config change, diffs `isVisible(config)` / `filter(config)` per layer and
 *    only pushes the ones that actually changed,
 *  - removes sources + layers on unmount.
 *
 * Style swaps (`controller.setStyle`) preserve user resources via `transformStyle`,
 * so this hook never re-registers across base-style changes.
 */
export function useConfiguredLayers(layers: readonly MapSourceLayersSpecification[], config: MapConfiguration) {
  const map = useMapInstance();
  const mapReady = useMapReady();
  const userResources = useUserResources();
  const configRef = useRef(config);
  configRef.current = config;
  const appliedRef = useRef(new Map<string, AppliedState>());

  // Mount sources + sublayers as soon as the style is loaded. Mirrors V1's
  // imperative `loadMapLayers`: one tight `addSource` + `addLayer` loop, no
  // fragmentation across React subtrees. Cleanup removes them in reverse on
  // unmount so toggling a spec off cleans up.
  useEffect(() => {
    if (!mapReady) {
      return;
    }

    for (const spec of layers) {
      if (!map.getSource(spec.sourceId)) {
        const sourceSpec: SourceSpecification = isGeoJSONSource(spec.source)
          ? spec.source
          : {
              ...(spec.source ?? {}),
              maxzoom: spec.source?.maxzoom ?? tileSourcesMaxZoom,
              tiles: [`${clientConfig.websiteUrl}/api/map/${spec.sourceId}/{z}/{x}/{y}`],
              type: 'vector',
            };
        map.addSource(spec.sourceId, sourceSpec);
        userResources.sources.add(spec.sourceId);
      }

      const isGeojson = isGeoJSONSource(spec.source);
      for (const layer of spec.layers) {
        if (map.getLayer(layer.id)) {
          continue;
        }
        const visible = layer.isVisible(configRef.current);
        const filter = layer.filter ? layer.filter(configRef.current) : undefined;
        map.addLayer({
          ...layer,
          layout: { ...(layer.layout ?? {}), visibility: visible ? 'visible' : 'none' },
          source: spec.sourceId,
          ...(isGeojson ? {} : { 'source-layer': layer['source-layer'] ?? 'layer' }),
          ...(filter ? { filter } : {}),
        } as LayerSpecification);
        userResources.layers.add(layer.id);
        appliedRef.current.set(layer.id, {
          filter: filter ? JSON.stringify(filter) : undefined,
          visibility: visible,
        });
      }
    }

    return () => {
      for (const spec of layers) {
        for (const layer of spec.layers) {
          if (map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
          userResources.layers.delete(layer.id);
          appliedRef.current.delete(layer.id);
        }
        if (map.getSource(spec.sourceId)) {
          map.removeSource(spec.sourceId);
        }
        userResources.sources.delete(spec.sourceId);
      }
    };
  }, [map, mapReady, userResources, layers]);

  // Diff per-layer on config change: compare the previous `isVisible` /
  // `filter` outputs against the current ones and only push the ones that
  // actually changed (no global re-walk like V1's `applyMapConfigurationToLayers`).
  useEffect(() => {
    if (!mapReady) {
      return;
    }
    for (const spec of layers) {
      for (const layer of spec.layers) {
        if (!map.getLayer(layer.id)) {
          continue;
        }
        const applied = appliedRef.current.get(layer.id) ?? {};

        const nextVisible = layer.isVisible(config);
        if (nextVisible !== applied.visibility) {
          map.setLayoutProperty(layer.id, 'visibility', nextVisible ? 'visible' : 'none');
          applied.visibility = nextVisible;
        }

        if (layer.filter) {
          const nextFilter = layer.filter(config);
          const nextFilterStr = JSON.stringify(nextFilter);
          if (nextFilterStr !== applied.filter) {
            map.setFilter(layer.id, nextFilter);
            applied.filter = nextFilterStr;
          }
        }

        appliedRef.current.set(layer.id, applied);
      }
    }
  }, [map, mapReady, layers, config]);
}
