import Button from '@codegouvfr/react-dsfr/Button';
import { DrawCreateEvent, DrawModeChangeEvent } from '@mapbox/mapbox-gl-draw';
import center from '@turf/center';
import { lineString, points } from '@turf/helpers';
import length from '@turf/length';
import { atom, useAtom } from 'jotai';
import { GeoJSONSource } from 'maplibre-gl';
import { Fragment, useEffect } from 'react';

import { MapSourceLayersSpecification } from '@components/Map/map-layers';
import Box from '@components/ui/Box';
import Divider from '@components/ui/Divider';
import Text from '@components/ui/Text';
import useFCUMap from '@hooks/useFCUMap';
import { formatDistance } from '@utils/geo';

import { MeasureFeature, MeasureLabelFeature } from './measure';
import MesureFeatureListItem from './MeasureFeatureListItem';
import { Title } from '../SimpleMapLegend.style';

export const distancesMeasurementLinesSourceId = 'distance-measurements-lines';
export const distancesMeasurementLabelsSourceId = 'distance-measurements-labels';
const featureColorPalette = ['#000091', '#8e44ad', '#2980b9', '#27ae60', '#c0392b', '#d35400', '#7f8c8d', '#34495e', '#16a085', '#e67e22'];

const featuresAtom = atom<MeasureFeature[]>([]);

const DistancesMeasurementTool: React.FC = () => {
  const { mapLoaded, mapRef, mapDraw, isDrawing, setIsDrawing } = useFCUMap();
  const [features, setFeatures] = useAtom(featuresAtom);

  const onDrawCreate = ({ features: drawFeatures }: DrawCreateEvent) => {
    if (!mapDraw) {
      return;
    }
    // always only 1 feature
    const feature = drawFeatures[0] as MeasureFeature;
    mapDraw.deleteAll();
    setIsDrawing(false);

    // update the last feature keeping its color
    setFeatures((features) => {
      return [
        ...features.slice(0, -1),
        {
          ...feature,
          properties: {
            ...features.at(-1)!.properties,
            distance: length(feature, { units: 'meters' }),
          },
        },
      ];
    });
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
              color: featureColorPalette[features.length % featureColorPalette.length],
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
      setIsDrawing(false);
    }
  };

  useEffect(() => {
    if (!mapLoaded) {
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
    };
  }, [mapLoaded]);

  // synchronise the features with the map
  useEffect(() => {
    if (!mapLoaded) {
      return;
    }

    (mapRef.getSource(distancesMeasurementLinesSourceId) as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: features,
    });

    // build the labels source with points at the center of each segment
    (mapRef.getSource(distancesMeasurementLabelsSourceId) as GeoJSONSource).setData({
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
  }, [mapLoaded, features]);

  function updateMeasurementColor(featureId: string, newColor: string) {
    setFeatures((features) => {
      const featureIndex = features.findIndex((feature) => feature.id === featureId);
      if (featureIndex === -1) {
        console.error(`feature not found ${featureId}`);
        return features;
      }
      const feature = features[featureIndex];
      return features.toSpliced(featureIndex, 1, {
        ...feature,
        properties: {
          ...feature.properties,
          color: newColor,
        },
      });
    });
  }
  function startMeasurement() {
    mapDraw?.changeMode('draw_line_string');
    setIsDrawing(true);
  }
  function cancelMeasurement() {
    mapDraw?.deleteAll();
    mapDraw?.changeMode('simple_select');
    setIsDrawing(false);
    // remove the last feature (sketch)
    setFeatures(features.slice(0, -1));
  }
  function deleteMeasurement(featureId: string) {
    setFeatures(features.filter((feature) => feature.id !== featureId));
  }

  return (
    <>
      <Box display="flex" flexDirection="column" gap="16px">
        <Box>
          <Title>Calculer une distance</Title>

          <Text size="xs" fontStyle="italic">
            Cliquez sur au moins 2 points de la carte afin d’en connaitre la distance à vol d’oiseau.
          </Text>
        </Box>

        {features.length > 0 && <Divider my="1v" />}
        {features.map((feature) => (
          <Fragment key={feature.id}>
            <MesureFeatureListItem
              feature={feature}
              onColorUpdate={(color) => updateMeasurementColor(feature.id, color)}
              onDelete={() => deleteMeasurement(feature.id)}
              disableDeleteButton={isDrawing}
            />
            <Divider my="1v" />
          </Fragment>
        ))}

        {isDrawing ? (
          <Button priority="secondary" iconId="fr-icon-close-line" onClick={cancelMeasurement}>
            Annuler le tracé
          </Button>
        ) : (
          <Button priority="secondary" iconId="fr-icon-add-line" onClick={startMeasurement} disabled={!mapLoaded}>
            Ajouter un tracé
          </Button>
        )}
      </Box>
    </>
  );
};

export default DistancesMeasurementTool;

export const distancesMeasurementLayers: MapSourceLayersSpecification[] = [
  {
    sourceId: distancesMeasurementLinesSourceId,
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
    layers: [
      {
        source: distancesMeasurementLinesSourceId,
        id: 'distance-measurements-lines',
        type: 'line',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
        },
      },
    ],
  },
  {
    sourceId: distancesMeasurementLabelsSourceId,
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
    layers: [
      {
        source: distancesMeasurementLabelsSourceId,
        id: 'distance-measurements-labels',
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
