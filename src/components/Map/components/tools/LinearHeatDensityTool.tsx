import Button from '@codegouvfr/react-dsfr/Button';
import { type DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import { useKeyboardEvent } from '@react-hookz/web';
import center from '@turf/center';
import { lineString, points } from '@turf/helpers';
import length from '@turf/length';
import { atom, useAtom } from 'jotai';
import { type GeoJSONSource } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import useFCUMap from '@/components/Map/MapProvider';
import Box from '@/components/ui/Box';
import Divider from '@/components/ui/Divider';
import Text from '@/components/ui/Text';
import Tooltip from '@/components/ui/Tooltip';
import { type PointDeConsommation } from '@/pages/api/linear-heat-density';
import { useServices } from '@/services';
import { trackEvent } from '@/services/analytics';
import { downloadObject } from '@/utils/browser';
import { formatAsISODate } from '@/utils/date';
import { formatDistance } from '@/utils/geo';

import { type MeasureFeature, type MeasureLabelFeature } from './measure';
import { type MapSourceLayersSpecification } from '../layers/common';
import { Title } from '../SimpleMapLegend.style';

export const linearHeatDensityLinesSourceId = 'linear-heat-density-lines';
export const linearHeatDensityLabelsSourceId = 'linear-heat-density-labels';
const defaultColor = '#000091';

type LinearHeatDensity = {
  longueurTotale: number;
  consommationGaz: {
    cumul: {
      '10m': string;
      '50m': string;
    };
    densitéThermiqueLinéaire: {
      '10m': string;
      '50m': string;
    };
  };
  besoinsEnChaleur: {
    cumul: {
      '10m': string;
      '50m': string;
    };
    densitéThermiqueLinéaire: {
      '10m': string;
      '50m': string;
    };
  };
};

const featuresAtom = atom<MeasureFeature[]>([]);
const densiteAtom = atom<LinearHeatDensity | null>(null);

const LinearHeatDensityTool: React.FC = () => {
  const { heatNetworkService } = useServices();
  const { mapLayersLoaded, mapRef, mapDraw, isDrawing, setIsDrawing } = useFCUMap();
  const [features, setFeatures] = useAtom(featuresAtom);
  const featuresRef = useRef(features);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [densite, setDensite] = useAtom(densiteAtom);

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
    setIsDrawing(false);

    const features = featuresRef.current; // get latest features as the ref keeps the up-to-date value
    // update the last feature keeping its color
    setFeatures([
      ...features.slice(0, -1),
      {
        ...feature,
        properties: {
          ...features.at(-1)!.properties,
          distance: length(feature, { units: 'meters' }),
        },
      },
    ]);

    try {
      setIsLoading(true);
      trackEvent('Carto|Densité thermique linéaire|Tracé terminé');
      const rawDensite = await heatNetworkService.getLinearHeatDensity(features.map((feature) => feature.geometry.coordinates));
      const densite: LinearHeatDensity = {
        longueurTotale: Math.round(rawDensite.longueurTotale * 1000),
        consommationGaz: {
          cumul: {
            '10m': getConso(rawDensite.consommationGaz['10m']),
            '50m': getConso(rawDensite.consommationGaz['50m']),
          },
          densitéThermiqueLinéaire: {
            '10m': getDensite(rawDensite.longueurTotale, rawDensite.consommationGaz['10m']),
            '50m': getDensite(rawDensite.longueurTotale, rawDensite.consommationGaz['50m']),
          },
        },
        besoinsEnChaleur: {
          cumul: {
            '10m': getConso(rawDensite.besoinsEnChaleur['10m']),
            '50m': getConso(rawDensite.besoinsEnChaleur['50m']),
          },
          densitéThermiqueLinéaire: {
            '10m': getDensite(rawDensite.longueurTotale, rawDensite.besoinsEnChaleur['10m']),
            '50m': getDensite(rawDensite.longueurTotale, rawDensite.besoinsEnChaleur['50m']),
          },
        },
      };
      setDensite(densite);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrawRender = () => {
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
    setFeatures((features) => {
      // check if the feature being draw has been copied into the features state
      if (features.at(-1)?.id !== featureBeingDrawn.id) {
        return [
          ...features,
          {
            ...featureBeingDrawn,
            properties: {
              color: defaultColor,
              distance: length(featureBeingDrawn, { units: 'meters' }),
            },
          },
        ];
      }
      return [
        // update the geometry and the distance, keeping the previous color
        ...features.slice(0, -1),
        {
          ...featureBeingDrawn,
          properties: {
            color: features.at(-1)!.properties.color,
            distance: length(featureBeingDrawn, { units: 'meters' }),
          },
        },
      ];
    });
  };

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
    setIsDrawing((isDrawing) => {
      const shouldDrawAgain = featuresRef.current.length === 1;
      if (isDrawing) {
        mapDraw?.changeMode(shouldDrawAgain ? 'draw_line_string' : ('simple_select' as any));
        // remove the last feature (sketch)
        setFeatures(featuresRef.current.slice(0, -1));
      }
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
    trackEvent('Carto|Densité thermique linéaire|Effacer');
  };
  function exportDrawing() {
    if (!mapDraw) {
      return;
    }
    downloadObject(
      {
        type: 'FeatureCollection',
        features,
      },
      `FCU_export_tracé_${formatAsISODate(new Date())}.geojson`,
      'application/geo+json'
    );
    trackEvent('Carto|Densité thermique linéaire|Exporter le tracé');
  }

  const drawingFeaturePointCounts = (mapDraw?.getAll().features[0] as MeasureFeature)?.geometry.coordinates.length ?? 0;
  const showCancelButton = isDrawing && drawingFeaturePointCounts >= 2;
  const showAddButton = features.length > 0 && !isDrawing;

  return (
    <>
      <Box display="flex" flexDirection="column" gap="16px">
        <Box>
          <Title>Calculer une densité thermique linéaire</Title>

          <Text size="xs" fontStyle="italic" mb="1w">
            Vous pouvez calculer la densité thermique linéaire sur le tracé de votre choix.
          </Text>
          <Text size="xs" fontStyle="italic">
            Pour définir un tracé, cliquez sur 2 points ou plus sur la carte, puis <strong>double-cliquez</strong> sur le dernier point ou{' '}
            <strong>appuyez sur la touche entrée</strong> pour finaliser le tracé. Vous avez la possibilité d'ajouter des segments à ce
            tracé.
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
    </>
  );
};

export default LinearHeatDensityTool;

const getConso = (consos: PointDeConsommation[]) => {
  const sum = consos.reduce((acc, current) => acc + current.conso_nb, 0);
  if (sum > 1000) {
    return `${(sum / 1000).toFixed(2)} GWh`;
  }

  return `${sum.toFixed(2)} MWh`;
};

const getDensite = (size: number, densite: PointDeConsommation[]) => {
  if (densite.length === 0) {
    return '0 MWh/m';
  }
  const value = densite.reduce((acc, value) => acc + value.conso_nb, 0) / (size * 1000);
  if (value > 1000) {
    return `${(value / 1000).toFixed(2)} GWh/m`;
  }

  return `${value.toFixed(2)} MWh/m`;
};

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
      type: 'FeatureCollection',
      features: features,
    });

    // build the labels source with points at the center of each segment
    (mapRef.getSource(linearHeatDensityLabelsSourceId) as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: features.flatMap((feature) => {
        return feature.geometry.coordinates.slice(0, -1).map(
          (coordinates, index) =>
            ({
              id: `${feature.id}-${index}`,
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: center(points([coordinates, feature.geometry.coordinates[index + 1]])).geometry.coordinates,
              },
              properties: {
                color: feature.properties.color,
                distanceLabel: formatDistance(
                  length(lineString([coordinates, feature.geometry.coordinates[index + 1]]), { units: 'meters' })
                ),
              },
            }) satisfies MeasureLabelFeature
        );
      }),
    });
  }, [mapLayersLoaded, features]);
}

export const linearHeatDensityLayers = [
  {
    sourceId: linearHeatDensityLinesSourceId,
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
    layers: [
      {
        id: 'linear-heat-density-lines',
        type: 'line',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
        },
        isVisible: (config) => config.densiteThermiqueLineaire,
        unselectable: true,
      },
    ],
  },
  {
    sourceId: linearHeatDensityLabelsSourceId,
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
    layers: [
      {
        id: 'linear-heat-density-labels',
        type: 'symbol',
        layout: {
          'symbol-placement': 'point',
          'text-field': ['get', 'distanceLabel'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 16,
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-offset': [0, 0],
        },
        paint: {
          'text-color': ['get', 'color'],
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
        isVisible: (config) => config.densiteThermiqueLineaire,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
