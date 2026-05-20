import Button from '@codegouvfr/react-dsfr/Button';
import type { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import { useKeyboardEvent } from '@react-hookz/web';
import center from '@turf/center';
import { lineString, points } from '@turf/helpers';
import length from '@turf/length';
import { atom, useAtom } from 'jotai';
import type { GeoJSONSource } from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import Tooltip from '@/components/ui/Tooltip';
import { trackEvent, trackPostHogEvent } from '@/modules/analytics/client';
import type { LinearHeatDensity } from '@/modules/data/constants';
import { formatDistance } from '@/modules/geo/client/helpers';
import trpc from '@/modules/trpc/client';
import { downloadObject } from '@/utils/browser';
import { formatAsISODateMinutes } from '@/utils/date';

import {
  linearHeatDensityDefaultColor,
  linearHeatDensityLabelsSourceId,
  linearHeatDensityLinesSourceId,
} from '../../layers/specs/tools/linearHeatDensity';
import type { MeasureFeature, MeasureLabelFeature } from '../../layers/specs/tools/measure';
import { useDrawingTool } from './useDrawingTool';

const featuresAtom = atom<MeasureFeature[]>([]);
const densiteAtom = atom<LinearHeatDensity | null>(null);

/** "Calculer une densité thermique linéaire" tool. Multi-segments; density is recomputed on each completion. */
export function LinearHeatDensityTool() {
  const { map, draw, mapReady, isDrawing, setIsDrawing } = useDrawingTool('densiteThermiqueLineaire');
  const [features, setFeatures] = useAtom(featuresAtom);
  const featuresRef = useRef(features);
  const [isLoading, setIsLoading] = useState(false);
  const [densite, setDensite] = useAtom(densiteAtom);
  const trpcUtils = trpc.useUtils();
  const drawingFeatureRef = useRef<MeasureFeature | null>(null);

  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  // Sync the atom + in-progress sketch into the MapLibre sources.
  const syncMap = useCallback(() => {
    if (!map || !mapReady) return;
    const allFeatures = drawingFeatureRef.current ? [...featuresRef.current, drawingFeatureRef.current] : featuresRef.current;
    (map.getSource(linearHeatDensityLinesSourceId) as GeoJSONSource | undefined)?.setData({
      features: allFeatures,
      type: 'FeatureCollection',
    });
    (map.getSource(linearHeatDensityLabelsSourceId) as GeoJSONSource | undefined)?.setData({
      features: allFeatures.flatMap((feature) =>
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
  }, [map, mapReady]);

  // Resync whenever the completed-features atom changes.
  useEffect(() => {
    syncMap();
  }, [features, syncMap]);

  // Mount/unmount drawing flow.
  useEffect(() => {
    if (!map || !draw || !mapReady) return;

    const onDrawCreate = async ({ features: drawFeatures }: DrawCreateEvent) => {
      const feature = drawFeatures[0] as MeasureFeature;
      draw.deleteAll();
      draw.changeMode('simple_select');
      setIsDrawing(false);
      drawingFeatureRef.current = null;

      const newFeature: MeasureFeature = {
        ...feature,
        properties: {
          color: linearHeatDensityDefaultColor,
          distance: length(feature, { units: 'meters' }),
        },
      };
      const updated = [...featuresRef.current, newFeature];
      setFeatures(updated);

      try {
        setIsLoading(true);
        trackEvent('Carto|Densité thermique linéaire|Tracé terminé');
        trackPostHogEvent('map:tool_use', { action: 'complete', tool_name: 'density' });
        const next = await trpcUtils.client.data.getDensiteThermiqueLineaire.query({
          coordinates: updated.map((feature) => feature.geometry.coordinates),
        });
        setDensite(next);
      } finally {
        setIsLoading(false);
      }
    };

    const onDrawRender = () => {
      if (draw.getMode() !== 'draw_line_string') return;
      const featureBeingDrawn = draw.getAll().features.at(-1) as MeasureFeature | undefined;
      if (!featureBeingDrawn) return;
      drawingFeatureRef.current = {
        ...featureBeingDrawn,
        properties: {
          color: linearHeatDensityDefaultColor,
          distance: length(featureBeingDrawn, { units: 'meters' }),
        },
      };
      syncMap();
    };

    map.on('draw.create', onDrawCreate);
    map.on('draw.render', onDrawRender);
    if (!densite) startMeasurement();

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.render', onDrawRender);
      draw.deleteAll();
      drawingFeatureRef.current = null;
      setIsDrawing(false);
      syncMap();
    };
  }, [map, mapReady, draw]);

  useKeyboardEvent(
    'Escape',
    () => {
      if (isDrawing) cancelMeasurement();
    },
    [],
    { event: 'keyup' }
  );

  function startMeasurement() {
    if (!draw) return;
    draw.changeMode('draw_line_string');
    setIsDrawing(true);
  }
  function cancelMeasurement() {
    if (!draw) return;
    draw.deleteAll();
    drawingFeatureRef.current = null;
    setIsDrawing((wasDrawing) => {
      const shouldDrawAgain = featuresRef.current.length === 0;
      if (wasDrawing) {
        draw.changeMode(shouldDrawAgain ? 'draw_line_string' : 'simple_select');
      }
      syncMap();
      return shouldDrawAgain;
    });
  }
  function clearDensity() {
    if (!draw) return;
    setDensite(null);
    draw.deleteAll();
    draw.changeMode('draw_line_string');
    setIsDrawing(true);
    setFeatures([]);
    drawingFeatureRef.current = null;
    trackEvent('Carto|Densité thermique linéaire|Effacer');
    trackPostHogEvent('map:tool_use', { action: 'reset', tool_name: 'density' });
  }
  function exportDrawing() {
    downloadObject(
      { features, type: 'FeatureCollection' },
      `FCU_export_tracé_${formatAsISODateMinutes(new Date())}.geojson`,
      'application/geo+json'
    );
    trackEvent('Carto|Densité thermique linéaire|Exporter le tracé');
    trackPostHogEvent('map:tool_use', { action: 'export', tool_name: 'density' });
  }

  const drawingPointCount = (draw?.getAll().features[0] as MeasureFeature | undefined)?.geometry.coordinates.length ?? 0;
  const showCancelButton = isDrawing && drawingPointCount >= 2;
  const showAddButton = features.length > 0 && !isDrawing;

  return (
    <div className="flex flex-col gap-4 px-3 text-sm">
      <div className="flex flex-col gap-2">
        <p className="text-xs italic text-(--text-mention-grey) mb-0">
          Vous pouvez calculer la densité thermique linéaire sur le tracé de votre choix.
        </p>
        <p className="text-xs italic text-(--text-mention-grey) mb-0">
          Pour définir un tracé, cliquez sur 2 points ou plus sur la carte, puis <strong>double-cliquez</strong> sur le dernier point ou{' '}
          <strong>appuyez sur la touche entrée</strong> pour finaliser. Vous pouvez ajouter d'autres segments.
        </p>
      </div>
      <div className="h-px bg-(--border-default-grey)" />

      {isLoading && (
        <div className="grid place-content-center">
          <Oval height={60} width={60} color="#000091" secondaryColor="#0000ee" />
        </div>
      )}

      {densite && (
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span>Longueur totale</span>
            <strong>{formatDistance(densite.longueurTotale)}</strong>
          </div>
          <div className="font-bold">Sur la base des consommations de gaz&nbsp;:</div>
          <div>Consommation de gaz</div>
          <div className="flex justify-between pl-4">
            <span>À 10 mètres</span>
            <strong>{densite.consommationGaz.cumul['10m']}</strong>
          </div>
          <div className="flex justify-between pl-4">
            <span>À 50 mètres</span>
            <strong>{densite.consommationGaz.cumul['50m']}</strong>
          </div>
          <div className="flex items-center">
            Densité thermique linéaire
            <Tooltip
              title="Densité thermique calculée sur la base des consommations de gaz à l'adresse situées à 10 ou 50 m du tracé."
              iconProps={{ className: 'ml-2' }}
            />
          </div>
          <div className="flex justify-between pl-4">
            <span>À 10 mètres</span>
            <strong>{densite.consommationGaz.densitéThermiqueLinéaire['10m']}</strong>
          </div>
          <div className="flex justify-between pl-4">
            <span>À 50 mètres</span>
            <strong>{densite.consommationGaz.densitéThermiqueLinéaire['50m']}</strong>
          </div>

          <div className="font-bold">Sur la base des besoins en chaleur (modélisés par le Cerema)&nbsp;:</div>
          <div>Besoins en chaleur</div>
          <div className="flex justify-between pl-4">
            <span>À 10 mètres</span>
            <strong>{densite.besoinsEnChaleur.cumul['10m']}</strong>
          </div>
          <div className="flex justify-between pl-4">
            <span>À 50 mètres</span>
            <strong>{densite.besoinsEnChaleur.cumul['50m']}</strong>
          </div>
          <div className="flex items-center">
            Densité thermique linéaire
            <Tooltip
              title="Densité thermique calculée sur la base des besoins en chaleur des bâtiments à 10 ou 50 m du tracé."
              iconProps={{ className: 'ml-2' }}
            />
          </div>
          <div className="flex justify-between pl-4">
            <span>À 10 mètres</span>
            <strong>{densite.besoinsEnChaleur.densitéThermiqueLinéaire['10m']}</strong>
          </div>
          <div className="flex justify-between pl-4">
            <span>À 50 mètres</span>
            <strong>{densite.besoinsEnChaleur.densitéThermiqueLinéaire['50m']}</strong>
          </div>
        </div>
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
          disabled={!mapReady || isLoading}
        >
          Ajouter un segment
        </Button>
      )}

      {densite && (
        <>
          <Button priority="secondary" iconId="fr-icon-delete-bin-line" onClick={clearDensity} disabled={isLoading}>
            Effacer
          </Button>
          <Button priority="tertiary" iconId="fr-icon-download-line" onClick={exportDrawing}>
            Exporter le tracé
          </Button>
        </>
      )}
    </div>
  );
}
