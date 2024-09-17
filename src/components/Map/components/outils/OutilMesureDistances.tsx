import Button from '@codegouvfr/react-dsfr/Button';
import { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import center from '@turf/center';
import { lineString, points } from '@turf/helpers';
import length from '@turf/length';
import { GeoJSONSource, Map } from 'maplibre-gl';
import { useEffect, useState } from 'react';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import useFCUMap from '@hooks/useFCUMap';
import { formatDistance } from '@utils/geo';

import { MesureFeature } from './mesure';
import MesureFeatureListItem from './MesureFeatureListItem';

const linesSourceId = 'mesures-distances';
const labelsSourceId = 'mesures-distances-labels';
const defaultFeatureColor = '#000001'; // not full black allows the picker to select other hues directly

const OutilMesureDistances: React.FC = () => {
  const { mapLoaded, mapRef, mapDraw } = useFCUMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [features, setFeatures] = useState<MesureFeature[]>([]);

  const onDrawCreate = ({ features: drawFeatures }: DrawCreateEvent) => {
    if (!mapDraw) {
      return;
    }
    // always only 1 feature
    const feature = drawFeatures[0] as MesureFeature;
    mapDraw.delete(feature.id);
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
    if (drawMode === 'draw_line_string') {
      const featureBeingDrawn = mapDraw.getAll().features.at(-1) as MesureFeature | undefined;
      if (featureBeingDrawn) {
        setFeatures((features) => {
          // check if the feature being draw has been copied into the features state
          if (features.at(-1)?.id !== featureBeingDrawn.id) {
            return [
              ...features,
              {
                ...featureBeingDrawn,
                properties: {
                  color: defaultFeatureColor,
                  distance: length(featureBeingDrawn, { units: 'meters' }),
                },
              },
            ];
          } else {
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
          }
        });
      }
    }
  };

  useEffect(() => {
    if (!mapLoaded) {
      return;
    }
    const map = mapRef.getMap();

    configureSourceAndLayers(map);
    map.on('draw.create', onDrawCreate);
    map.on('draw.render', onDrawRender);

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.render', onDrawRender);

      // clear the feature being drawn
      mapDraw.deleteAll();

      // clear existing features
      clearSourceAndLayers(map);
    };
  }, [mapLoaded]);

  // synchronise the features with the map
  useEffect(() => {
    if (!mapLoaded) {
      return;
    }

    (mapRef.getMap().getSource(linesSourceId) as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: features,
    });

    // build the labels source with points at the center of each segment and another at the end point
    (mapRef.getMap().getSource(labelsSourceId) as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: features.flatMap((feature) => {
        return [
          ...feature.geometry.coordinates.slice(0, -1).map(
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
              }) satisfies GeoJSON.Feature
          ),
          {
            id: `${feature.id}-total`,
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: feature.geometry.coordinates.at(-1) as GeoJSON.Position,
            },
            properties: {
              color: feature.properties.color,
              distanceLabel: `Total : ${formatDistance(feature.properties.distance)}`,
            },
          },
        ] satisfies GeoJSON.Feature[];
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
      <Button onClick={() => alert('TOTO')} priority="secondary" size="small" iconId="fr-icon-arrow-left-line" className="fr-mb-2w">
        Retour
      </Button>

      <Box display="flex" flexDirection="column" gap="16px">
        <Box>
          <Heading as="h6" mb="1w">
            Calculer une distance
          </Heading>

          <Text size="xs" fontStyle="italic">
            Cliquez sur au moins 2 points de la cartes afin d’en connaitre la distance à vol d’oiseau.
          </Text>
        </Box>

        {features.map((feature) => (
          <MesureFeatureListItem
            feature={feature}
            key={feature.id}
            onColorUpdate={(color) => updateMeasurementColor(feature.id, color)}
            onDelete={() => deleteMeasurement(feature.id)}
            disableDeleteButton={isDrawing}
          />
        ))}

        {isDrawing ? (
          <Button priority="secondary" iconId="fr-icon-close-line" onClick={cancelMeasurement}>
            Annuler le tracé
          </Button>
        ) : (
          <Button priority="secondary" iconId="fr-icon-add-line" onClick={startMeasurement} disabled={!mapLoaded}>
            Démarrer un tracé
          </Button>
        )}
      </Box>
    </>
  );
};

export default OutilMesureDistances;

function configureSourceAndLayers(map: Map) {
  map.addSource(linesSourceId, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  });

  map.addLayer({
    source: linesSourceId,
    id: 'mesures-distances-lines',
    type: 'line',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 2,
      'line-dasharray': [4, 4],
    },
  });

  map.addSource(labelsSourceId, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  });

  map.addLayer({
    source: labelsSourceId,
    id: 'mesures-distances-labels',
    type: 'symbol',
    layout: {
      'symbol-placement': 'point',
      'text-field': ['get', 'distanceLabel'],
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-size': 16,
      'text-anchor': 'center',
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': ['get', 'color'],
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
    },
  });
}

function clearSourceAndLayers(map: Map) {
  map.removeLayer('mesures-distances-lines');
  map.removeLayer('mesures-distances-labels');
  map.removeSource(linesSourceId);
  map.removeSource(labelsSourceId);
}
