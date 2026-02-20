import Button from '@codegouvfr/react-dsfr/Button';
import type { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import { useKeyboardEvent } from '@react-hookz/web';
import center from '@turf/center';
import { lineString, points } from '@turf/helpers';
import length from '@turf/length';
import { atom, useAtom } from 'jotai';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import useFCUMap from '@/components/Map/MapProvider';
import Box from '@/components/ui/Box';
import Divider from '@/components/ui/Divider';
import Text from '@/components/ui/Text';
import Tooltip from '@/components/ui/Tooltip';
import { trackEvent, trackPostHogEvent } from '@/modules/analytics/client';
import type { LinearHeatDensity } from '@/modules/data/constants';
import { formatDistance } from '@/modules/geo/client/helpers';
import trpc from '@/modules/trpc/client';
import { downloadObject } from '@/utils/browser';
import { formatAsISODateMinutes } from '@/utils/date';

import type { MapSourceLayersSpecification } from '../../layers/common';
import { Title } from '../SimpleMapLegend.style';
import type { MeasureFeature, MeasureLabelFeature } from './measure';

export const linearHeatDensityLinesSourceId = 'linear-heat-density-lines';
export const linearHeatDensityLabelsSourceId = 'linear-heat-density-labels';
const defaultColor = '#000091';

const featuresAtom = atom<MeasureFeature[]>([]);
const densiteAtom = atom<LinearHeatDensity | null>(null);

/**
 * Sync features to the map directly (without React state updates).
 * Used during drawing to avoid triggering React re-renders on every frame.
 */
function syncLayersToMap(map: MapLibreMap, features: MeasureFeature[]): void {
  const linesSource = map.getSource(linearHeatDensityLinesSourceId) as GeoJSONSource | undefined;
  const labelsSource = map.getSource(linearHeatDensityLabelsSourceId) as GeoJSONSource | undefined;
  if (!linesSource || !labelsSource) return;

  linesSource.setData({ features, type: 'FeatureCollection' });
  labelsSource.setData({
    features: features.flatMap((feature) =>
      feature.geometry.coordinates.slice(0, -1).map(
        (coordinates, index) =>
          ({
            geometry: {
              coordinates: center(points([coordinates, feature.geometry.coordinates[index + 1]])).geometry.coordinates,
              type: 'Point',
            },
            id: `${feature.id}-${index}`,
            properties: {
              color: feature.properties.color,
              distanceLabel: formatDistance(
                length(lineString([coordinates, feature.geometry.coordinates[index + 1]]), { units: 'meters' })
              ),
            },
            type: 'Feature',
          }) satisfies MeasureLabelFeature
      )
    ),
    type: 'FeatureCollection',
  });
}

const LinearHeatDensityTool: React.FC = () => {
  const { mapLayersLoaded, mapRef, mapDraw, isDrawing, setIsDrawing } = useFCUMap();
  const [features, setFeatures] = useAtom(featuresAtom);
  const featuresRef = useRef(features);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [densite, setDensite] = useAtom(densiteAtom);
  const trpcUtils = trpc.useUtils();
  // Ref to track the feature being drawn (to avoid React state updates during drawing)
  const drawingFeatureRef = useRef<MeasureFeature | null>(null);

  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  const onDrawCreate = async ({ features: drawFeatures }: DrawCreateEvent) => {
    if (!mapDraw) {
      return;
    }
    // always only 1 feature
    const feature = drawFeatures[0] as MeasureFeature;
    mapDraw.deleteAll();
    mapDraw.changeMode('simple_select');
    setIsDrawing(false);

    const completedFeatures = featuresRef.current; // get completed features
    const newFeature: MeasureFeature = {
      ...feature,
      properties: {
        color: defaultColor,
        distance: length(feature, { units: 'meters' }),
      },
    };

    // Add the completed feature to the state
    const updatedFeatures = [...completedFeatures, newFeature];
    setFeatures(updatedFeatures);
    drawingFeatureRef.current = null;

    try {
      setIsLoading(true);
      trackEvent('Carto|Densité thermique linéaire|Tracé terminé');
      trackPostHogEvent('map:tool_use', { action: 'complete', tool_name: 'density' });
      const densite = await trpcUtils.client.data.getDensiteThermiqueLineaire.query({
        coordinates: updatedFeatures.map((f) => f.geometry.coordinates),
      });
      setDensite(densite);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync the drawing feature to the map directly (without React state updates)
  const syncDrawingToMap = useCallback(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();
    const allFeatures = drawingFeatureRef.current ? [...featuresRef.current, drawingFeatureRef.current] : featuresRef.current;
    syncLayersToMap(map, allFeatures);
  }, [mapRef]);

  const onDrawRender = useCallback(() => {
    if (!mapDraw) {
      return;
    }
    const drawMode = mapDraw.getMode();
    if (drawMode !== 'draw_line_string') {
      return;
    }
    const featureBeingDrawn = mapDraw.getAll().features.at(-1) as MeasureFeature | undefined;
    if (!featureBeingDrawn) {
      return;
    }

    // Update the ref (not React state) to avoid re-renders during drawing
    drawingFeatureRef.current = {
      ...featureBeingDrawn,
      properties: {
        color: defaultColor,
        distance: length(featureBeingDrawn, { units: 'meters' }),
      },
    };

    // Sync directly to the map without triggering React re-renders
    syncDrawingToMap();
  }, [mapDraw, syncDrawingToMap]);

  // handle the esc key to quit drawing mode (run after the draw.modechange event)
  useKeyboardEvent(
    'Escape',
    () => {
      if (isDrawing) {
        cancelMeasurement();
      }
    },
    [],
    { event: 'keyup' }
  );

  useEffect(() => {
    if (!mapLayersLoaded) {
      return;
    }
    const map = mapRef.getMap();

    map.on('draw.create', onDrawCreate);
    map.on('draw.render', onDrawRender);
    if (!densite) {
      startMeasurement();
    }

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.render', onDrawRender);

      // clear the feature being drawn
      mapDraw.deleteAll();

      // handle exit via routing
      setIsDrawing((isDrawing) => {
        if (isDrawing) {
          cancelMeasurement();
        }
        return false;
      });
    };
  }, [mapLayersLoaded]);

  function startMeasurement() {
    mapDraw?.changeMode('draw_line_string');
    setIsDrawing(true);
  }
  function cancelMeasurement() {
    mapDraw?.deleteAll();
    drawingFeatureRef.current = null;
    setIsDrawing((isDrawing) => {
      const shouldDrawAgain = featuresRef.current.length === 0;
      if (isDrawing) {
        mapDraw?.changeMode(shouldDrawAgain ? 'draw_line_string' : ('simple_select' as any));
      }
      // Sync the map after clearing the drawing feature
      syncDrawingToMap();
      return shouldDrawAgain;
    });
  }
  const clearDensity = () => {
    if (!mapDraw) {
      return;
    }
    setDensite(null);
    mapDraw.deleteAll();
    mapDraw.changeMode('draw_line_string');
    setIsDrawing(true);
    setFeatures([]);
    drawingFeatureRef.current = null;
    trackEvent('Carto|Densité thermique linéaire|Effacer');
    trackPostHogEvent('map:tool_use', { action: 'reset', tool_name: 'density' });
  };
  function exportDrawing() {
    if (!mapDraw) {
      return;
    }
    downloadObject(
      {
        features,
        type: 'FeatureCollection',
      },
      `FCU_export_tracé_${formatAsISODateMinutes(new Date())}.geojson`,
      'application/geo+json'
    );
    trackEvent('Carto|Densité thermique linéaire|Exporter le tracé');
    trackPostHogEvent('map:tool_use', { action: 'export', tool_name: 'density' });
  }

  const drawingFeaturePointCounts = (mapDraw?.getAll().features[0] as MeasureFeature)?.geometry.coordinates.length ?? 0;
  const showCancelButton = isDrawing && drawingFeaturePointCounts >= 2;
  const showAddButton = features.length > 0 && !isDrawing;

  return (
    <Box display="flex" flexDirection="column" gap="16px">
      <Box>
        <Title>Calculer une densité thermique linéaire</Title>

        <Text size="xs" fontStyle="italic" mb="1w">
          Vous pouvez calculer la densité thermique linéaire sur le tracé de votre choix.
        </Text>
        <Text size="xs" fontStyle="italic">
          Pour définir un tracé, cliquez sur 2 points ou plus sur la carte, puis <strong>double-cliquez</strong> sur le dernier point ou{' '}
          <strong>appuyez sur la touche entrée</strong> pour finaliser le tracé. Vous avez la possibilité d'ajouter des segments à ce tracé.
        </Text>
      </Box>
      <Divider my="1v" />
      {isLoading && (
        <Box display="grid" placeContent="center">
          <Oval height={60} width={60} color="#000091" secondaryColor="#0000ee" />
        </Box>
      )}
      {densite && (
        <Box fontSize="14px" display="flex" flexDirection="column" gap="12px">
          <Box display="flex" justifyContent="space-between">
            <Box>Longueur totale</Box>
            <strong>{formatDistance(densite.longueurTotale)}</strong>
          </Box>
          <Text fontWeight="bold">Sur la base des consommations de gaz&nbsp;:</Text>
          <Text>Consommation de gaz</Text>
          <Box display="flex" justifyContent="space-between" pl="2w">
            <Box>À 10 mètres</Box>
            <strong>{densite.consommationGaz.cumul['10m']}</strong>
          </Box>
          <Box display="flex" justifyContent="space-between" pl="2w">
            <Box>À 50 mètres</Box>
            <strong>{densite.consommationGaz.cumul['50m']}</strong>
          </Box>
          <Text>
            Densité thermique linéaire
            <Tooltip
              title="Densité thermique calculée sur la base des consommations de gaz à l'adresse situées à une distance de 10 ou 50 m du tracé
                  défini"
              iconProps={{
                className: 'fr-ml-1w',
              }}
            />
          </Text>
          <Box display="flex" justifyContent="space-between" pl="2w">
            <Box>À 10 mètres</Box>
            <strong>{densite.consommationGaz.densitéThermiqueLinéaire['10m']}</strong>
          </Box>
          <Box display="flex" justifyContent="space-between" pl="2w">
            <Box>À 50 mètres</Box>
            <strong>{densite.consommationGaz.densitéThermiqueLinéaire['50m']}</strong>
          </Box>

          <Text fontWeight="bold">Sur la base des besoins en chaleur (modélisés par le Cerema)&nbsp;:</Text>
          <Text>Besoins en chaleur</Text>
          <Box display="flex" justifyContent="space-between" pl="2w">
            <Box>À 10 mètres</Box>
            <strong>{densite.besoinsEnChaleur.cumul['10m']}</strong>
          </Box>
          <Box display="flex" justifyContent="space-between" pl="2w">
            <Box>À 50 mètres</Box>
            <strong>{densite.besoinsEnChaleur.cumul['50m']}</strong>
          </Box>
          <Text>
            Densité thermique linéaire
            <Tooltip
              title="Densité thermique calculée sur la base des besoins en chaleur des bâtiments situés à une distance de 10 ou 50 m du tracé
                  défini"
              iconProps={{
                className: 'fr-ml-1w',
              }}
            />
          </Text>
          <Box display="flex" justifyContent="space-between" pl="2w">
            <Box>À 10 mètres</Box>
            <strong>{densite.besoinsEnChaleur.densitéThermiqueLinéaire['10m']}</strong>
          </Box>
          <Box display="flex" justifyContent="space-between" pl="2w">
            <Box>À 50 mètres</Box>
            <strong>{densite.besoinsEnChaleur.densitéThermiqueLinéaire['50m']}</strong>
          </Box>
        </Box>
      )}

      {showCancelButton && (
        <Button priority="secondary" iconId="fr-icon-close-line" onClick={cancelMeasurement}>
          Annuler le {densite ? 'segment' : 'tracé'}
        </Button>
      )}
      {showAddButton && (
        <Button
          priority="secondary"
          iconId="fr-icon-add-line"
          onClick={() => {
            trackEvent('Carto|Densité thermique linéaire|Ajouter un segment');
            trackPostHogEvent('map:tool_use', { action: 'start', tool_name: 'density' });
            startMeasurement();
          }}
          disabled={!mapLayersLoaded || isLoading}
        >
          Ajouter un segment
        </Button>
      )}

      {densite && (
        <>
          <Button
            priority="secondary"
            iconId="fr-icon-delete-bin-line"
            className="btn-full-width"
            onClick={clearDensity}
            disabled={isLoading}
          >
            Effacer
          </Button>
          <Button priority="tertiary" iconId="fr-icon-download-line" className="btn-full-width" onClick={exportDrawing}>
            Exporter le tracé
          </Button>
        </>
      )}
    </Box>
  );
};

export default LinearHeatDensityTool;

/**
 * Synchronise the features with the map
 */
export function useLinearHeatDensityLayers() {
  const { mapLayersLoaded, mapRef } = useFCUMap();
  const [features] = useAtom(featuresAtom);

  useEffect(() => {
    if (!mapLayersLoaded) {
      return;
    }

    (mapRef.getSource(linearHeatDensityLinesSourceId) as GeoJSONSource).setData({
      features,
      type: 'FeatureCollection',
    });

    // build the labels source with points at the center of each segment
    (mapRef.getSource(linearHeatDensityLabelsSourceId) as GeoJSONSource).setData({
      features: features.flatMap((feature) => {
        return feature.geometry.coordinates.slice(0, -1).map(
          (coordinates, index) =>
            ({
              geometry: {
                coordinates: center(points([coordinates, feature.geometry.coordinates[index + 1]])).geometry.coordinates,
                type: 'Point',
              },
              id: `${feature.id}-${index}`,
              properties: {
                color: feature.properties.color,
                distanceLabel: formatDistance(
                  length(lineString([coordinates, feature.geometry.coordinates[index + 1]]), { units: 'meters' })
                ),
              },
              type: 'Feature',
            }) satisfies MeasureLabelFeature
        );
      }),
      type: 'FeatureCollection',
    });
  }, [mapLayersLoaded, features]);
}

export const linearHeatDensityLayers = [
  {
    layers: [
      {
        id: 'linear-heat-density-lines',
        isVisible: (config) => config.densiteThermiqueLineaire,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: {
      data: {
        features: [],
        type: 'FeatureCollection',
      },
      type: 'geojson',
    },
    sourceId: linearHeatDensityLinesSourceId,
  },
  {
    layers: [
      {
        id: 'linear-heat-density-labels',
        isVisible: (config) => config.densiteThermiqueLineaire,
        layout: {
          'symbol-placement': 'point',
          'text-allow-overlap': true,
          'text-anchor': 'center',
          'text-field': ['get', 'distanceLabel'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-offset': [0, 0],
          'text-size': 16,
        },
        paint: {
          'text-color': ['get', 'color'],
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
        type: 'symbol',
        unselectable: true,
      },
    ],
    source: {
      data: {
        features: [],
        type: 'FeatureCollection',
      },
      type: 'geojson',
    },
    sourceId: linearHeatDensityLabelsSourceId,
  },
] as const satisfies readonly MapSourceLayersSpecification[];
