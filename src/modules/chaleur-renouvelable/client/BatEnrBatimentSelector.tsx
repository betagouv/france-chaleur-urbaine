import type { MapGeoJSONFeature, MapLayerMouseEvent, Popup } from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';

import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/constants';
import { useMapInstance, useMapReady } from '@/modules/map/client/core/MapCanvasContext';
import { useMapClickCapture } from '@/modules/map/client/interactions/clickHandlers';
import { type MapDynamicLayer, useMapLayers } from '@/modules/map/client/layers/useMapLayers';

const SOURCE_ID = 'bat-enr-batiments-selector';
const FILL_LAYER_ID = 'bat-enr-batiments-selector-fill';
const LINE_LAYER_ID = 'bat-enr-batiments-selector-line';

const COLOR_DEFAULT = '#999999';
const COLOR_ACTIVE = '#4550e5';
const COLOR_HOVER = '#1f3fd8';
const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

const BAT_ENR_SELECTOR_LAYERS = [
  {
    id: FILL_LAYER_ID,
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        COLOR_ACTIVE,
        ['boolean', ['feature-state', 'hover'], false],
        COLOR_HOVER,
        COLOR_DEFAULT,
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.5,
        ['boolean', ['feature-state', 'hover'], false],
        0.65,
        0.15,
      ],
    },
    source: SOURCE_ID,
    type: 'fill',
  },
  {
    id: LINE_LAYER_ID,
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        COLOR_ACTIVE,
        ['boolean', ['feature-state', 'hover'], false],
        COLOR_HOVER,
        '#666666',
      ],
      'line-opacity': 0.85,
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        2.5,
        ['boolean', ['feature-state', 'hover'], false],
        3,
        0.8,
      ],
    },
    source: SOURCE_ID,
    type: 'line',
  },
] satisfies readonly MapDynamicLayer[];

type SelectableBatEnrBatiment = BatEnrBatiment & {
  batiment_construction_id: string;
  geometry: GeoJSON.Geometry;
};

type BatEnrBatimentFeatureProperties = {
  address: string | null;
  averageHousingArea: number | null;
  batimentConstructionId: string;
  dpe: string | null;
  heatingEnergy: string | null;
  heatingInstallation: string | null;
  housingCount: number | null;
};

type BatEnrBatimentSelectorProps = {
  batiments: SelectableBatEnrBatiment[];
  value: string | null;
  onSelect: (batimentConstructionId: string) => void;
};

export function BatEnrBatimentSelector({ batiments, value, onSelect }: BatEnrBatimentSelectorProps) {
  const map = useMapInstance();
  const mapReady = useMapReady();
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const featureCollection = useMemo(() => getBatEnrBatimentsFeatureCollection(batiments), [batiments]);
  const sources = useMemo(() => [{ data: featureCollection, id: SOURCE_ID, promoteId: 'batimentConstructionId' }], [featureCollection]);

  useMapLayers({ layers: BAT_ENR_SELECTOR_LAYERS, sources });
  useMapClickCapture(featureCollection.features.length > 0);

  useEffect(() => {
    if (!mapReady || !value || !map.getSource(SOURCE_ID)) {
      return;
    }

    map.setFeatureState({ id: value, source: SOURCE_ID }, { selected: true });
    return () => {
      try {
        map.removeFeatureState({ id: value, source: SOURCE_ID }, 'selected');
      } catch {}
    };
  }, [featureCollection, map, mapReady, value]);

  useEffect(() => {
    if (!mapReady || !map.getLayer(FILL_LAYER_ID)) {
      return;
    }

    let hoveredBatimentConstructionId: string | null = null;
    let isEffectActive = true;
    let PopupConstructor: typeof Popup | null = null;
    let hoverPopup: Popup | null = null;

    import('maplibre-gl').then((maplibre) => {
      if (isEffectActive) {
        PopupConstructor = maplibre.Popup;
      }
    });

    const clearHover = () => {
      if (!hoveredBatimentConstructionId) {
        return;
      }

      try {
        map.removeFeatureState({ id: hoveredBatimentConstructionId, source: SOURCE_ID }, 'hover');
      } catch {}
      hoveredBatimentConstructionId = null;
      hoverPopup?.remove();
      hoverPopup = null;
    };

    const showTooltip = (event: MapLayerMouseEvent, feature: MapGeoJSONFeature) => {
      if (!PopupConstructor) {
        return;
      }

      const tooltipHtml = getBatEnrBatimentTooltipHtml(getFeatureTooltipProperties(feature));

      if (!hoverPopup) {
        hoverPopup = new PopupConstructor({
          closeButton: false,
          closeOnClick: false,
          maxWidth: '280px',
          offset: 12,
          padding: map.getPadding(),
        });
      }

      hoverPopup.setLngLat(event.lngLat).setHTML(tooltipHtml).addTo(map);
    };

    const handleMouseMove = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const batimentConstructionId = getFeatureBatimentConstructionId(feature);
      map.getCanvas().style.cursor = batimentConstructionId ? 'pointer' : '';

      if (batimentConstructionId === hoveredBatimentConstructionId) {
        if (feature) {
          showTooltip(event, feature);
        }
        return;
      }

      clearHover();
      if (batimentConstructionId) {
        map.setFeatureState({ id: batimentConstructionId, source: SOURCE_ID }, { hover: true });
        hoveredBatimentConstructionId = batimentConstructionId;
      }

      if (feature) {
        showTooltip(event, feature);
      }
    };

    const handleMouseLeave = () => {
      clearHover();
      map.getCanvas().style.cursor = '';
    };

    const handleClick = (event: MapLayerMouseEvent) => {
      const batimentConstructionId = getFeatureBatimentConstructionId(event.features?.[0]);

      if (batimentConstructionId) {
        onSelectRef.current(batimentConstructionId);
      }
    };

    map.on('mousemove', FILL_LAYER_ID, handleMouseMove);
    map.on('mouseleave', FILL_LAYER_ID, handleMouseLeave);
    map.on('click', FILL_LAYER_ID, handleClick);

    return () => {
      isEffectActive = false;
      map.off('mousemove', FILL_LAYER_ID, handleMouseMove);
      map.off('mouseleave', FILL_LAYER_ID, handleMouseLeave);
      map.off('click', FILL_LAYER_ID, handleClick);
      clearHover();
      hoverPopup?.remove();
      map.getCanvas().style.cursor = '';
    };
  }, [map, mapReady]);

  return null;
}

export function isSelectableBatEnrBatiment(batiment: BatEnrBatiment): batiment is SelectableBatEnrBatiment {
  return batiment.batiment_construction_id !== null && batiment.geometry !== null;
}

export function getBatEnrBatimentsFeatureCollection(batiments: SelectableBatEnrBatiment[]) {
  const features = batiments.map((batiment) => {
    return {
      geometry: batiment.geometry,
      id: batiment.batiment_construction_id,
      properties: {
        address: batiment.adresse,
        averageHousingArea: batiment.dpe_representatif_logement_surface_habitable_immeuble,
        batimentConstructionId: batiment.batiment_construction_id,
        dpe: batiment.classe_bilan_dpe,
        heatingEnergy: batiment.type_energie_chauffage,
        heatingInstallation: batiment.type_installation_chauffage,
        housingCount: batiment.ffo_bat_nb_log,
      },
      type: 'Feature',
    } satisfies GeoJSON.Feature<GeoJSON.Geometry, BatEnrBatimentFeatureProperties>;
  });

  return {
    features,
    type: 'FeatureCollection',
  } satisfies GeoJSON.FeatureCollection<GeoJSON.Geometry, BatEnrBatimentFeatureProperties>;
}

function getFeatureBatimentConstructionId(feature?: MapGeoJSONFeature) {
  if (typeof feature?.id === 'string') {
    return feature.id;
  }

  const batimentConstructionId = feature?.properties?.batimentConstructionId;

  return typeof batimentConstructionId === 'string' ? batimentConstructionId : undefined;
}

function getFeatureTooltipProperties(feature: MapGeoJSONFeature): BatEnrBatimentFeatureProperties {
  return {
    address: getNullableStringProperty(feature.properties, 'address'),
    averageHousingArea: getNullableNumberProperty(feature.properties, 'averageHousingArea'),
    batimentConstructionId: getFeatureBatimentConstructionId(feature) ?? '',
    dpe: getNullableStringProperty(feature.properties, 'dpe'),
    heatingEnergy: getNullableStringProperty(feature.properties, 'heatingEnergy'),
    heatingInstallation: getNullableStringProperty(feature.properties, 'heatingInstallation'),
    housingCount: getNullableNumberProperty(feature.properties, 'housingCount'),
  };
}

function getBatEnrBatimentTooltipHtml(properties: BatEnrBatimentFeatureProperties) {
  const rows = [
    getTooltipRow('DPE', properties.dpe),
    getTooltipRow('Surface moyenne', formatSquareMeters(properties.averageHousingArea)),
    getTooltipRow('Logements', formatNumber(properties.housingCount)),
    getTooltipRow('Énergie chauffage', properties.heatingEnergy),
    getTooltipRow('Installation', properties.heatingInstallation),
  ].filter((row) => row !== null);

  return `
    <div class="text-sm">
      <div class="mb-1 font-bold">${escapeHtml(properties.address ?? 'Bâtiment sélectionnable')}</div>
      ${
        rows.length > 0
          ? `<div class="grid gap-1">${rows.join('')}</div>`
          : '<div class="text-xs text-gray-600">Aucune information détaillée disponible.</div>'
      }
    </div>
  `;
}

function getTooltipRow(label: string, value?: number | string | null) {
  return value ? `<div><span class="font-medium">${escapeHtml(label)} :</span> ${escapeHtml(String(value))}</div>` : null;
}

function formatNumber(value: number | null) {
  return value !== null ? NUMBER_FORMATTER.format(value) : null;
}

function formatSquareMeters(value: number | null) {
  return value !== null ? `${NUMBER_FORMATTER.format(value)} m²` : null;
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function getNullableStringProperty(properties: Record<string, unknown>, key: string) {
  const value = properties[key];

  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function getNullableNumberProperty(properties: Record<string, unknown>, key: string) {
  const value = properties[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
