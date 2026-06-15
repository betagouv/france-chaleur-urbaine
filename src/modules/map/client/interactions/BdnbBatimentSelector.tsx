import type { MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useRef } from 'react';

import { clientConfig } from '@/client-config';
import { tileSourcesMaxZoom } from '@/modules/tiles/constants';
import type { TileSourceId } from '@/modules/tiles/server/tiles.config';

import { useMapInstance, useMapReady, useUserResources } from '../core/MapCanvasContext';
import { bdnbBatimentsTilesSource } from '../layers/specs/bdnb/common';
import { useMapClickCapture } from './clickHandlers';

const SOURCE_ID = 'bdnb-batiments' satisfies TileSourceId;
const SOURCE_LAYER = 'layer';
const FILL_LAYER_ID = 'bdnb-batiment-selector-fill';
const LINE_LAYER_ID = 'bdnb-batiment-selector-line';

const COLOR_DEFAULT = '#999999';
const COLOR_ACTIVE = '#4550e5';

type BdnbBatimentSelectorProps = {
  /** ID du bâtiment sélectionné. `null` = aucun, l'utilisateur peut cliquer. */
  value: string | null;
  /** Appelé uniquement quand `value` est `null` et que l'utilisateur clique sur un bâtiment. */
  onSelect: (batiment_groupe_id: string) => void;
};

/**
 * Sélecteur de bâtiment basé sur la source `bdnb-batiments`.
 *
 * - Monte ses propres layers (fill + line) avec un style sobre (gris + outline)
 *   et un highlight bleu au hover / sur la sélection.
 * - Contrôlé par le parent : tant que `value !== null`, aucun clic n'est pris
 *   en compte (verrou). Le parent réautorise en repassant `value = null`.
 * - Émet uniquement `batiment_groupe_id` ; le parent fait son éventuel fetch.
 *
 * À placer en enfant de `<Map>` ou `<MapCanvas>`. Si la couche
 * `caracteristiquesBatiments` est active dans le config, elle peindra
 * par-dessus — à éviter pour ce use case.
 */
export function BdnbBatimentSelector({ value, onSelect }: BdnbBatimentSelectorProps) {
  const map = useMapInstance();
  const mapReady = useMapReady();
  const userResources = useUserResources();

  // Stash latest props in refs so the click/hover effect can stay mounted once.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const valueRef = useRef(value);
  valueRef.current = value;

  // While unlocked (`value === null`) we own the click: pause base interactions (no réseau popup
  // under the building), like the drawing tools' mode. We keep our own layer-scoped click below.
  useMapClickCapture(value === null);

  // Mount source (if not already provided by ConfiguredLayers) + selector layers.
  useEffect(() => {
    if (!mapReady) {
      return;
    }
    let ownsSource = false;
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        ...bdnbBatimentsTilesSource,
        maxzoom: bdnbBatimentsTilesSource.maxzoom ?? tileSourcesMaxZoom,
        tiles: [`${clientConfig.websiteUrl}/api/map/${SOURCE_ID}/{z}/{x}/{y}`],
        type: 'vector',
      });
      userResources.sources.add(SOURCE_ID);
      ownsSource = true;
    }

    map.addLayer({
      id: FILL_LAYER_ID,
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          COLOR_ACTIVE,
          ['boolean', ['feature-state', 'hover'], false],
          COLOR_ACTIVE,
          COLOR_DEFAULT,
        ],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          0.5,
          ['boolean', ['feature-state', 'hover'], false],
          0.4,
          0.15,
        ],
      },
      source: SOURCE_ID,
      'source-layer': SOURCE_LAYER,
      type: 'fill',
    });
    userResources.layers.add(FILL_LAYER_ID);

    map.addLayer({
      id: LINE_LAYER_ID,
      paint: {
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          COLOR_ACTIVE,
          ['boolean', ['feature-state', 'hover'], false],
          COLOR_ACTIVE,
          '#666666',
        ],
        'line-opacity': 0.85,
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          2.5,
          ['boolean', ['feature-state', 'hover'], false],
          2,
          0.8,
        ],
      },
      source: SOURCE_ID,
      'source-layer': SOURCE_LAYER,
      type: 'line',
    });
    userResources.layers.add(LINE_LAYER_ID);

    return () => {
      if (map.getLayer(LINE_LAYER_ID)) {
        map.removeLayer(LINE_LAYER_ID);
      }
      userResources.layers.delete(LINE_LAYER_ID);
      if (map.getLayer(FILL_LAYER_ID)) {
        map.removeLayer(FILL_LAYER_ID);
      }
      userResources.layers.delete(FILL_LAYER_ID);
      if (ownsSource && map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
        userResources.sources.delete(SOURCE_ID);
      }
    };
  }, [map, mapReady, userResources]);

  // Apply / clear the `selected` feature-state when `value` changes.
  useEffect(() => {
    if (!mapReady || !value) {
      return;
    }
    map.setFeatureState({ id: value, source: SOURCE_ID, sourceLayer: SOURCE_LAYER }, { selected: true });
    return () => {
      try {
        map.removeFeatureState({ id: value, source: SOURCE_ID, sourceLayer: SOURCE_LAYER }, 'selected');
      } catch {
        // Source may have been removed already; ignore.
      }
    };
  }, [map, mapReady, value]);

  // Click + hover handlers — bound to the fill layer only. Self-contained: base interactions are
  // paused via `useMapClickCapture` above while selecting, so nothing else reacts to the click.
  useEffect(() => {
    if (!mapReady) {
      return;
    }
    let hoveredId: string | null = null;

    const clearHover = () => {
      if (!hoveredId) return;
      try {
        map.removeFeatureState({ id: hoveredId, source: SOURCE_ID, sourceLayer: SOURCE_LAYER }, 'hover');
      } catch {
        // Source may have been removed; ignore.
      }
      hoveredId = null;
    };

    const onMouseMove = (event: MapLayerMouseEvent) => {
      if (valueRef.current !== null) {
        return;
      }
      const feature = event.features?.[0];
      const id = feature?.properties?.batiment_groupe_id as string | undefined;
      map.getCanvas().style.cursor = id ? 'pointer' : '';
      if (id === hoveredId) {
        return;
      }
      clearHover();
      if (id) {
        map.setFeatureState({ id, source: SOURCE_ID, sourceLayer: SOURCE_LAYER }, { hover: true });
        hoveredId = id;
      }
    };

    const onMouseLeave = () => {
      clearHover();
      map.getCanvas().style.cursor = '';
    };

    const onClick = (event: MapLayerMouseEvent) => {
      if (valueRef.current !== null) {
        return;
      }
      const id = event.features?.[0]?.properties?.batiment_groupe_id as string | undefined;
      if (id) {
        onSelectRef.current(id);
      }
    };

    map.on('mousemove', FILL_LAYER_ID, onMouseMove);
    map.on('mouseleave', FILL_LAYER_ID, onMouseLeave);
    // `click` is dispatched on tap too, no need for a separate `touchend`.
    map.on('click', FILL_LAYER_ID, onClick);

    return () => {
      map.off('mousemove', FILL_LAYER_ID, onMouseMove);
      map.off('mouseleave', FILL_LAYER_ID, onMouseLeave);
      map.off('click', FILL_LAYER_ID, onClick);
      clearHover();
      map.getCanvas().style.cursor = '';
    };
  }, [map, mapReady]);

  return null;
}
