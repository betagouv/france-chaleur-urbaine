import Button from '@codegouvfr/react-dsfr/Button';
import { DrawCreateEvent, DrawModeChangeEvent } from '@mapbox/mapbox-gl-draw';
import { Tooltip } from '@mui/material';
import center from '@turf/center';
import { lineString, points } from '@turf/helpers';
import length from '@turf/length';
import { atom, useAtom } from 'jotai';
import { GeoJSONSource } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import { MapSourceLayersSpecification } from '@components/Map/map-layers';
import Box from '@components/ui/Box';
import Divider from '@components/ui/Divider';
import Icon from '@components/ui/Icon';
import Text from '@components/ui/Text';
import useFCUMap from '@hooks/useFCUMap';
import { downloadObject } from '@utils/browser';
import { formatAsISODate } from '@utils/date';
import { formatDistance } from '@utils/geo';
import { useServices } from 'src/services';
import { GasSummary } from 'src/types/Summary/Gas';

import { MeasureFeature, MeasureLabelFeature } from './measure';
import { Title } from '../SimpleMapLegend.style';

export const linearHeatDensityLinesSourceId = 'linear-heat-density-lines';
export const linearHeatDensityLabelsSourceId = 'linear-heat-density-labels';
const defaultColor = '#000091';

type LinearHeatDensity = {
  distanceTotale: number;
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
  // TODO à venir avec la nouvelle couche
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

/**
 * This flag allows us to know if the user pressed the escape key.
 * In that case, only the callback onDrawModeChange is called, otherwise onDrawCreate is called juste before.
 * We use it to detect if we must clear the draw.
 */
let mayHaveClearedTheDrawWithEscape = true;

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
    mayHaveClearedTheDrawWithEscape = false;

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
      const rawDensite = await heatNetworkService.densite(features.map((feature) => feature.geometry.coordinates));
      const densite: LinearHeatDensity = {
        distanceTotale: Math.round(rawDensite.size * 1000),
        consommationGaz: {
          cumul: {
            '10m': getConso(rawDensite.data[10]),
            '50m': getConso(rawDensite.data[50]),
          },
          densitéThermiqueLinéaire: {
            '10m': getDensite(rawDensite.size, rawDensite.data[10]),
            '50m': getDensite(rawDensite.size, rawDensite.data[50]),
          },
        },
        // TODO à venir avec la nouvelle couche
        besoinsEnChaleur: {
          cumul: {
            '10m': '',
            '50m': '',
          },
          densitéThermiqueLinéaire: {
            '10m': '',
            '50m': '',
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

  // handle the esc key to quit drawing mode
  const onDrawModeChange = ({ mode }: DrawModeChangeEvent) => {
    if (!mapDraw) {
      return;
    }
    if (mode === 'simple_select') {
      mapDraw.deleteAll();
      if (mayHaveClearedTheDrawWithEscape) {
        cancelMeasurement();
      }
      setIsDrawing(false);
      mayHaveClearedTheDrawWithEscape = true;
    }
  };

  useEffect(() => {
    if (!mapLayersLoaded) {
      return;
    }
    const map = mapRef.getMap();

    map.on('draw.create', onDrawCreate);
    map.on('draw.render', onDrawRender);
    map.on('draw.modechange', onDrawModeChange);

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.render', onDrawRender);
      map.off('draw.modechange', onDrawModeChange);

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
    mayHaveClearedTheDrawWithEscape = true;
  }
  function cancelMeasurement() {
    mapDraw?.deleteAll();
    mapDraw?.changeMode('simple_select');
    setIsDrawing((isDrawing) => {
      // remove the last feature (sketch)
      if (isDrawing) {
        setFeatures((features) => features.slice(0, -1));
      }
      return false;
    });
  }
  const clearDensity = () => {
    if (!mapDraw) {
      return;
    }
    setDensite(null);
    mapDraw.deleteAll();
    mapDraw.changeMode('simple_select');
    setIsDrawing(false);
    setFeatures([]);
  };
  function exportDrawing() {
    if (!mapDraw) {
      return;
    }
    downloadObject(features, `FCU_export_tracé_${formatAsISODate(new Date())}.geojson`, 'application/geo+json');
  }

  return (
    <>
      <Box display="flex" flexDirection="column" gap="16px">
        <Box>
          <Title>Calculer une densité thermique linéaire</Title>

          <Text size="xs" fontStyle="italic">
            Définissez un tracé en cliquant sur deux points ou plus.
          </Text>
        </Box>
        <Divider />

        {isLoading && (
          <Box display="grid" placeContent="center">
            <Oval height={60} width={60} color="#000091" secondaryColor="#0000ee" />
          </Box>
        )}

        {densite && (
          <Box fontSize="14px" display="flex" flexDirection="column" gap="12px">
            <Box display="flex" justifyContent="space-between">
              <Box>Distance totale</Box>
              <strong>{formatDistance(densite.distanceTotale)}</strong>
            </Box>
            <Text fontWeight="bold">Sur la base des consommations de gaz :</Text>
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
              >
                <Icon size="sm" name="ri-information-fill" ml="1w" />
              </Tooltip>
            </Text>
            <Box display="flex" justifyContent="space-between" pl="2w">
              <Box>À 10 mètres</Box>
              <strong>{densite.consommationGaz.densitéThermiqueLinéaire['10m']}</strong>
            </Box>
            <Box display="flex" justifyContent="space-between" pl="2w">
              <Box>À 50 mètres</Box>
              <strong>{densite.consommationGaz.densitéThermiqueLinéaire['50m']}</strong>
            </Box>
          </Box>
        )}

        {isDrawing ? (
          <Button priority="secondary" iconId="fr-icon-close-line" onClick={cancelMeasurement}>
            Annuler le {densite ? 'segment' : 'tracé'}
          </Button>
        ) : (
          <Button priority="secondary" iconId="fr-icon-add-line" onClick={startMeasurement} disabled={!mapLayersLoaded || isLoading}>
            Ajouter un {isLoading || densite ? 'segment' : 'tracé'}
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
            <Button priority="secondary" iconId="fr-icon-download-line" className="btn-full-width" onClick={exportDrawing}>
              Exporter le tracé
            </Button>
          </>
        )}
      </Box>
    </>
  );
};

export default LinearHeatDensityTool;

const getConso = (consos: GasSummary[]) => {
  const sum = consos.reduce((acc, current) => acc + current.conso_nb, 0);
  if (sum > 1000) {
    return `${(sum / 1000).toFixed(2)} GWh`;
  }

  return `${sum.toFixed(2)} MWh`;
};

const getDensite = (size: number, densite: GasSummary[]) => {
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

export const linearHeatDensityLayers: MapSourceLayersSpecification[] = [
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
        source: linearHeatDensityLinesSourceId,
        id: 'linear-heat-density-lines',
        type: 'line',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
        },
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
        source: linearHeatDensityLabelsSourceId,
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
      },
    ],
  },
];