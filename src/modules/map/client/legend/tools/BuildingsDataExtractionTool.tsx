import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import type { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import { useKeyboardEvent, useThrottledCallback } from '@react-hookz/web';
import turfArea from '@turf/area';
import { atom, useAtom } from 'jotai';
import type { GeoJSONSource } from 'maplibre-gl';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import { clientConfig } from '@/client-config';
import { trackEvent, trackPostHogEvent } from '@/modules/analytics/client';
import { validatePolygonGeometry } from '@/modules/geo/client/helpers';
import trpc from '@/modules/trpc/client';
import { downloadBaseEncoded64File } from '@/utils/browser';

import {
  type AreaSummaryFeature,
  buildingsDataExtractionDrawHotLayerId,
  buildingsDataExtractionPolygonsSourceId,
} from '../../layers/specs/tools/buildingsDataExtraction';
import { useDrawingTool } from './useDrawingTool';

type BuildingsDataExtractSummary = {
  batimentsChauffageCollectifFioul: { nbProchesRéseau: number; nbTotal: number };
  batimentsChauffageCollectifGaz: { nbProchesRéseau: number; nbTotal: number };
  consommationGaz: { cumulProchesRéseau: string; cumulTotal: string };
  longueurRéseauxDeChaleur: number;
};

const featuresAtom = atom<AreaSummaryFeature[]>([]);
const summaryAtom = atom<BuildingsDataExtractSummary | null>(null);

/** "Extraire des données sur les bâtiments" tool. Polygon → tRPC stats summary. */
export function BuildingsDataExtractionTool() {
  const { map, draw, mapReady, isDrawing, setIsDrawing } = useDrawingTool('extractionDonneesBatiment');
  const [features, setFeatures] = useAtom(featuresAtom);
  const [summary, setSummary] = useAtom(summaryAtom);
  const [isLoading, setIsLoading] = useState(false);
  const drawingFeatureRef = useRef<AreaSummaryFeature | null>(null);

  const trpcUtils = trpc.useUtils();

  const areaSize = features[0]?.properties.areaSize ?? 0;
  const areaHasSelfIntersections = features[0]?.properties.areaHasSelfIntersections ?? false;

  const syncDrawingToMap = useCallback(() => {
    if (!map || !mapReady) return;
    const source = map.getSource(buildingsDataExtractionPolygonsSourceId) as GeoJSONSource | undefined;
    source?.setData({
      features: drawingFeatureRef.current ? [drawingFeatureRef.current] : [],
      type: 'FeatureCollection',
    });
  }, [map, mapReady]);

  const updateFeaturesThrottled = useThrottledCallback(
    (feature: AreaSummaryFeature) => {
      setFeatures([feature]);
    },
    [setFeatures],
    200
  );

  useEffect(() => {
    if (!map || !draw || !mapReady) return;

    const onDrawCreate = async ({ features: drawFeatures }: DrawCreateEvent) => {
      const feature = drawFeatures[0] as GeoJSON.Feature<GeoJSON.Polygon>;
      draw.deleteAll();
      setIsDrawing(false);
      drawingFeatureRef.current = null;

      const area = feature.geometry.coordinates[0];
      if (turfArea(feature) / 1_000_000 > clientConfig.summaryAreaSizeLimit || !validatePolygonGeometry(area)) return;

      try {
        setIsLoading(true);
        trackEvent('Carto|Extraction données batiments|Zone terminée');
        trackPostHogEvent('map:tool_use', { action: 'complete', tool_name: 'extraction' });
        const rawSummary = await trpcUtils.client.data.getPolygonSummary.query({ coordinates: area });

        setSummary({
          batimentsChauffageCollectifFioul: {
            nbProchesRéseau: rawSummary.energy.filter((entry) => entry.is_close).filter((entry) => entry.energie_utilisee === 'fioul')
              .length,
            nbTotal: rawSummary.energy.filter((entry) => entry.energie_utilisee === 'fioul').length,
          },
          batimentsChauffageCollectifGaz: {
            nbProchesRéseau: rawSummary.energy.filter((entry) => entry.is_close).filter((entry) => entry.energie_utilisee === 'gaz').length,
            nbTotal: rawSummary.energy.filter((entry) => entry.energie_utilisee === 'gaz').length,
          },
          consommationGaz: {
            cumulProchesRéseau: formatConso(rawSummary.gas.filter((gas) => gas.is_close)),
            cumulTotal: formatConso(rawSummary.gas),
          },
          longueurRéseauxDeChaleur: rawSummary.network.reduce((acc, current) => acc + current.length, 0) / 1000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    const onDrawRender = () => {
      if (draw.getMode() !== 'draw_polygon') return;
      const featureBeingDrawn = draw.getAll().features.at(-1) as AreaSummaryFeature | undefined;
      if (!featureBeingDrawn) return;

      const areaSize = turfArea(featureBeingDrawn) / 1_000_000;
      const isGeometryValid = validatePolygonGeometry(featureBeingDrawn.geometry.coordinates[0]);

      const updated: AreaSummaryFeature = {
        ...featureBeingDrawn,
        properties: {
          areaHasSelfIntersections: !isGeometryValid,
          areaSize,
          isValid: areaSize <= clientConfig.summaryAreaSizeLimit && isGeometryValid,
        },
      };

      drawingFeatureRef.current = updated;
      syncDrawingToMap();
      updateFeaturesThrottled(updated);
    };

    map.on('draw.create', onDrawCreate);
    map.on('draw.render', onDrawRender);

    // Helper layer for the 2-vertex polygon (still a LineString in MapboxDraw at that stage).
    map.addLayer(
      {
        filter: ['==', '$type', 'LineString'],
        id: buildingsDataExtractionDrawHotLayerId,
        paint: { 'line-color': '#000091', 'line-width': 4 },
        source: 'mapbox-gl-draw-hot',
        type: 'line',
      },
      'buildings-data-extraction-outline'
    );

    // No completed polygon to resume (incomplete polygons have <4 coords incl.
    // closing point) and no summary already computed → start drawing.
    const hasCompletedPolygon = features.some((f) => f.geometry.coordinates[0]?.length > 3);
    if (!hasCompletedPolygon && !summary) {
      draw.changeMode('draw_polygon');
      setIsDrawing(true);
    }

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.render', onDrawRender);
      if (map.getLayer(buildingsDataExtractionDrawHotLayerId)) {
        map.removeLayer(buildingsDataExtractionDrawHotLayerId);
      }
      draw.deleteAll();
      drawingFeatureRef.current = null;
      // Drop any incomplete polygon left by the throttled writer — otherwise
      // a re-mount sees `features.length > 0` and skips the auto-start.
      setFeatures((prev) => prev.filter((f) => f.geometry.coordinates[0]?.length > 3));
      setIsDrawing(false);
    };
  }, [map, mapReady, draw, setIsDrawing, setFeatures]);

  // Persisted polygon: sync the completed-feature atom to the source.
  useEffect(() => {
    if (!map || !mapReady) return;
    (map.getSource(buildingsDataExtractionPolygonsSourceId) as GeoJSONSource | undefined)?.setData({
      features,
      type: 'FeatureCollection',
    });
  }, [map, mapReady, features]);

  useKeyboardEvent(
    'Escape',
    () => {
      if (isDrawing) clearSummary();
    },
    [],
    { event: 'keyup' }
  );

  function clearSummary() {
    if (!draw) return;
    setSummary(null);
    draw.deleteAll();
    draw.changeMode('draw_polygon');
    setIsDrawing(true);
    setFeatures([]);
    drawingFeatureRef.current = null;
    syncDrawingToMap();
  }

  const exportSummary = async () => {
    trackEvent('Carto|Extraction données batiments|Exporter les données');
    trackPostHogEvent('map:tool_use', { action: 'export', tool_name: 'extraction' });
    const file = await trpcUtils.client.data.exportPolygonSummary.query({
      coordinates: features[0].geometry.coordinates[0],
      format: 'csv',
    });
    downloadBaseEncoded64File(file.content, file.name, 'application/zip');
  };

  const showClearButton = features[0]?.geometry.coordinates[0]?.length > 2 && !isLoading;

  return (
    <div className="flex flex-col gap-4 px-3 text-sm">
      <div className="flex flex-col gap-2">
        <div className="text-xs italic">
          Vous pouvez extraire les adresses et nombre de logements des bâtiments à chauffage collectif gaz ou fioul, ainsi que les
          consommations de gaz à l'adresse, sur la zone de votre choix.
        </div>
        <div className="text-xs italic">
          Pour définir une zone, cliquez sur au moins 3 points sur la carte. <strong>Double-cliquez</strong> sur le dernier point ou{' '}
          <strong>appuyez sur la touche entrée</strong> pour finaliser la zone.
        </div>
      </div>

      {areaHasSelfIntersections && (
        <Alert
          severity="error"
          small
          description="La zone que vous avez dessinée n'est pas valide car elle présente des intersections (les segments se croisent). Veuillez ajuster la zone pour éviter que les segments ne se croisent."
        />
      )}

      {areaSize > clientConfig.summaryAreaSizeLimit && (
        <Alert
          severity="error"
          small
          description={
            <>
              La zone définie est trop grande ({areaSize.toFixed(2)} km²), veuillez réduire la taille de recherche (maximum{' '}
              {clientConfig.summaryAreaSizeLimit} km²). Si vous avez besoin de statistiques sur une zone élargie ou plus précise, n'hésitez
              pas à <Link href="/contact">nous contacter</Link>.
            </>
          }
        />
      )}

      {isLoading && (
        <div className="grid place-content-center">
          <Oval height={60} width={60} color="#000091" secondaryColor="#0000ee" />
        </div>
      )}

      {summary && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <img src="/icons/picto-fioul-noir.svg" alt="" />
            <span>Bâtiments à chauffage collectif fioul</span>
          </div>
          <div className="pl-8 flex flex-col gap-1">
            <div>
              <strong>{summary.batimentsChauffageCollectifFioul.nbTotal}</strong> Total
            </div>
            <div>
              <strong>{summary.batimentsChauffageCollectifFioul.nbProchesRéseau}</strong> Proche réseau (&lt;50m)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <img src="/icons/picto-gaz-bleu.svg" alt="" />
            <span>Bâtiments à chauffage collectif gaz</span>
          </div>
          <div className="pl-8 flex flex-col gap-1">
            <div>
              <strong>{summary.batimentsChauffageCollectifGaz.nbTotal}</strong> Total
            </div>
            <div>
              <strong>{summary.batimentsChauffageCollectifGaz.nbProchesRéseau}</strong> Proche réseau (&lt;50m)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <img src="/icons/picto-gaz-bleu.svg" alt="" />
            <span>Consommations de gaz</span>
          </div>
          <div className="pl-8 flex flex-col gap-1">
            <div>
              <strong>{summary.consommationGaz.cumulTotal}</strong> Total
            </div>
            <div>
              <strong>{summary.consommationGaz.cumulProchesRéseau}</strong> Proche réseau (&lt;50m)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <img src="/icons/picto-reseaux-vert.svg" alt="" />
            <span>Réseaux de chaleur</span>
          </div>
          <div className="pl-8">
            <strong>{summary.longueurRéseauxDeChaleur.toFixed(2)}</strong> km
          </div>
        </div>
      )}

      {showClearButton && (
        <Button
          priority="secondary"
          iconId="fr-icon-delete-bin-line"
          onClick={() => {
            trackEvent('Carto|Extraction données batiments|Effacer');
            trackPostHogEvent('map:tool_use', { action: 'reset', tool_name: 'extraction' });
            clearSummary();
          }}
        >
          Effacer
        </Button>
      )}
      {summary && (
        <Button priority="tertiary" iconId="fr-icon-download-line" onClick={exportSummary}>
          Exporter les données
        </Button>
      )}
    </div>
  );
}

function formatConso(consos: { conso_nb: number }[]) {
  const sum = consos.reduce((acc, current) => acc + current.conso_nb, 0);
  if (sum > 1000) return `${(sum / 1000).toFixed(2)} GWh`;
  return `${sum.toFixed(2)} MWh`;
}
