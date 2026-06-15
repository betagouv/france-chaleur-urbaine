import Button from '@codegouvfr/react-dsfr/Button';
import type { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import { useKeyboardEvent } from '@react-hookz/web';
import center from '@turf/center';
import { lineString, points } from '@turf/helpers';
import length from '@turf/length';
import { atom, useAtom } from 'jotai';
import type { GeoJSONSource } from 'maplibre-gl';
import { Fragment, useEffect, useRef } from 'react';

import { trackEvent, trackPostHogEvent } from '@/modules/analytics/client';
import { formatDistance } from '@/modules/geo/client/helpers';

import {
  distancesMeasurementColorPalette,
  distancesMeasurementLabelsSourceId,
  distancesMeasurementLinesSourceId,
} from '../../layers/specs/tools/distancesMeasurement';
import type { MeasureFeature, MeasureLabelFeature } from '../../layers/specs/tools/measure';
import { MeasureFeatureListItem } from './MeasureFeatureListItem';
import { useDrawingTool } from './useDrawingTool';

const featuresAtom = atom<MeasureFeature[]>([]);

/** "Mesurer une distance" tool. Auto-starts in `draw_line_string` mode on mount. */
export function DistancesMeasurementTool() {
  const { map, draw, mapReady, isDrawing, setIsDrawing } = useDrawingTool('mesureDistance');
  const [features, setFeatures] = useAtom(featuresAtom);
  const featuresRef = useRef(features);

  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  // Sync the atom into the MapLibre sources whenever it changes.
  useEffect(() => {
    if (!map || !mapReady) return;
    map.getSource<GeoJSONSource>(distancesMeasurementLinesSourceId)?.setData({
      features,
      type: 'FeatureCollection',
    });
    map.getSource<GeoJSONSource>(distancesMeasurementLabelsSourceId)?.setData({
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
  }, [map, mapReady, features]);

  // Start drawing on mount; clean up on unmount.
  useEffect(() => {
    if (!map || !draw || !mapReady) return;

    const onDrawCreate = ({ features: drawFeatures }: DrawCreateEvent) => {
      const feature = drawFeatures[0] as MeasureFeature;
      draw.deleteAll();
      setIsDrawing(false);

      setFeatures((prev) => [
        ...prev.slice(0, -1),
        {
          ...feature,
          properties: {
            color: prev.at(-1)?.properties.color ?? distancesMeasurementColorPalette[0],
            distance: length(feature, { units: 'meters' }),
          },
        },
      ]);
      trackEvent('Carto|Mesure de distance|Tracé terminé');
      trackPostHogEvent('map:tool_use', { action: 'complete', tool_name: 'distance' });
    };

    const onDrawRender = () => {
      if (draw.getMode() !== 'draw_line_string') return;
      const featureBeingDrawn = draw.getAll().features.at(-1) as MeasureFeature | undefined;
      if (!featureBeingDrawn) return;
      setFeatures((prev) => {
        if (prev.at(-1)?.id !== featureBeingDrawn.id) {
          return [
            ...prev,
            {
              ...featureBeingDrawn,
              properties: {
                color: distancesMeasurementColorPalette[prev.length % distancesMeasurementColorPalette.length],
                distance: length(featureBeingDrawn, { units: 'meters' }),
              },
            },
          ];
        }
        return prev.map((feature, index) =>
          index === prev.length - 1
            ? {
                ...featureBeingDrawn,
                properties: {
                  ...feature.properties,
                  distance: length(featureBeingDrawn, { units: 'meters' }),
                },
              }
            : feature
        );
      });
    };

    map.on('draw.create', onDrawCreate);
    map.on('draw.render', onDrawRender);
    // Auto-start drawing whenever there's no completed measurement to resume —
    // in-progress sketches have <2 coords and shouldn't block the auto-start
    // on re-mount (e.g. coming back to the tool after a Retour).
    const hasCompletedFeature = featuresRef.current.some((f) => f.geometry.coordinates.length > 1);
    if (!hasCompletedFeature) {
      draw.changeMode('draw_line_string');
      setIsDrawing(true);
    }

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.render', onDrawRender);
      draw.deleteAll();
      // Drop any in-progress sketch from the atom so a re-mount sees a clean
      // state (filter is more robust than slice(0, -1) — `onDrawRender` may
      // have pushed several incomplete entries during the same session).
      setFeatures((prev) => prev.filter((f) => f.geometry.coordinates.length > 1));
      setIsDrawing(false);
    };
  }, [map, mapReady, draw, setFeatures, setIsDrawing]);

  // Esc cancels the in-progress sketch.
  useKeyboardEvent(
    'Escape',
    () => {
      if (isDrawing) cancelMeasurement();
    },
    [],
    { event: 'keyup' }
  );

  function updateMeasurementColor(featureId: string, newColor: string) {
    setFeatures((prev) =>
      prev.map((feature) => (feature.id === featureId ? { ...feature, properties: { ...feature.properties, color: newColor } } : feature))
    );
  }
  function startMeasurement() {
    if (!draw) return;
    draw.changeMode('draw_line_string');
    setIsDrawing(true);
  }
  function cancelMeasurement() {
    if (!draw) return;
    draw.deleteAll();
    setIsDrawing((wasDrawing) => {
      const shouldDrawAgain = featuresRef.current.length === 1;
      if (wasDrawing) {
        draw.changeMode(shouldDrawAgain ? 'draw_line_string' : 'simple_select');
        setFeatures(featuresRef.current.slice(0, -1));
      }
      return shouldDrawAgain;
    });
  }
  function deleteMeasurement(featureId: string) {
    setFeatures((prev) => {
      const updated = prev.filter((feature) => feature.id !== featureId);
      if (updated.length === 0) startMeasurement();
      return updated;
    });
    trackEvent('Carto|Mesure de distance|Supprimer un tracé');
    trackPostHogEvent('map:tool_use', { action: 'reset', tool_name: 'distance' });
  }

  const drawingPointCount = (draw?.getAll().features[0] as MeasureFeature | undefined)?.geometry.coordinates.length ?? 0;
  const showCancelButton = isDrawing && drawingPointCount >= 2;
  const showAddButton = features.length > 0 && !isDrawing;
  const displayedFeatures = features.filter((feature) => feature.geometry.coordinates.length > 1);

  return (
    <div className="flex flex-col gap-4 px-3">
      <div className="text-xs italic">
        Pour mesurer une distance, cliquez sur 2 points ou plus sur la carte, puis <strong>double-cliquez</strong> sur le dernier point ou{' '}
        <strong>appuyez sur la touche entrée</strong> pour finaliser le tracé.
      </div>

      {displayedFeatures.length > 0 && <div className="h-px bg-(--border-default-grey)" />}
      {displayedFeatures.map((feature) => (
        <Fragment key={feature.id}>
          <MeasureFeatureListItem
            feature={feature}
            onColorUpdate={(color) => updateMeasurementColor(feature.id, color)}
            onDelete={() => deleteMeasurement(feature.id)}
            disableDeleteButton={isDrawing}
          />
          <div className="h-px bg-(--border-default-grey)" />
        </Fragment>
      ))}

      {showCancelButton && (
        <Button priority="secondary" iconId="fr-icon-close-line" onClick={cancelMeasurement}>
          Annuler le tracé
        </Button>
      )}
      {showAddButton && (
        <Button
          priority="secondary"
          iconId="fr-icon-add-line"
          onClick={() => {
            trackEvent('Carto|Mesure de distance|Ajouter un tracé');
            trackPostHogEvent('map:tool_use', { action: 'start', tool_name: 'distance' });
            startMeasurement();
          }}
          disabled={!mapReady}
        >
          Ajouter un tracé
        </Button>
      )}
    </div>
  );
}
