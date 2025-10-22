import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import type { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import { useKeyboardEvent } from '@react-hookz/web';
import turfArea from '@turf/area';
import { atom, useAtom } from 'jotai';
import type { GeoJSONSource } from 'maplibre-gl';
import { useEffect, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import { clientConfig } from '@/client-config';
import useFCUMap from '@/components/Map/MapProvider';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { trackEvent } from '@/modules/analytics/client';
import { validatePolygonGeometry } from '@/modules/geo/client/helpers';
import trpc from '@/modules/trpc/client';
import { useServices } from '@/services';

import { downloadBaseEncoded64File } from '@/utils/browser';
import type { MapSourceLayersSpecification } from '../../layers/common';
import { Title } from '../SimpleMapLegend.style';

export const buildingsDataExtractionPolygonsSourceId = 'buildings-data-extraction-polygons';
const buildingsDataExtractionDrawHotSourceLayerId = 'buildings-data-extraction-first-linestring';

type AreaSummaryFeature = GeoJSON.Feature<GeoJSON.Polygon> & {
  id: string;
  properties: {
    isValid: boolean;
    areaSize: number;
    areaHasSelfIntersections: boolean;
  };
};

type BuildingsDataExtractSummary = {
  batimentsChauffageCollectifFioul: {
    nbProchesRéseau: number;
    nbTotal: number;
  };
  batimentsChauffageCollectifGaz: {
    nbProchesRéseau: number;
    nbTotal: number;
  };
  consommationGaz: {
    cumulProchesRéseau: string;
    cumulTotal: string;
  };
  longueurRéseauxDeChaleur: number;
};

const featuresAtom = atom<AreaSummaryFeature[]>([]);
const summaryAtom = atom<BuildingsDataExtractSummary | null>(null);

const BuildingsDataExtractionTool: React.FC = () => {
  const { heatNetworkService } = useServices();
  const { mapLoaded, mapRef, mapDraw, isDrawing, setIsDrawing } = useFCUMap();
  const [features, setFeatures] = useAtom(featuresAtom);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summary, setSummary] = useAtom(summaryAtom);

  const trpcUtils = trpc.useUtils();

  const areaSize = features[0]?.properties.areaSize ?? 0;
  const areaHasSelfIntersections = features[0]?.properties.areaHasSelfIntersections ?? false;

  const onDrawCreate = async ({ features: drawFeatures }: DrawCreateEvent) => {
    if (!mapDraw) {
      return;
    }
    // always only 1 feature
    const feature = drawFeatures[0] as GeoJSON.Feature<GeoJSON.Polygon>;
    mapDraw.deleteAll();
    setIsDrawing(false);

    const area = feature.geometry.coordinates[0];
    if (turfArea(feature) / 1_000_000 > clientConfig.summaryAreaSizeLimit || !validatePolygonGeometry(area)) {
      return;
    }

    try {
      setIsLoading(true);
      trackEvent('Carto|Extraction données batiments|Zone terminée');
      const rawSummary = await trpcUtils.client.data.getPolygonSummary.query({ coordinates: area });

      const summary: BuildingsDataExtractSummary = {
        batimentsChauffageCollectifFioul: {
          nbProchesRéseau: rawSummary.energy
            .filter((energy) => energy.is_close)
            .filter(({ energie_utilisee }) => energie_utilisee === 'fioul').length,
          nbTotal: rawSummary.energy.filter(({ energie_utilisee }) => energie_utilisee === 'fioul').length,
        },
        batimentsChauffageCollectifGaz: {
          nbProchesRéseau: rawSummary.energy
            .filter((energy) => energy.is_close)
            .filter(({ energie_utilisee }) => energie_utilisee === 'gaz').length,
          nbTotal: rawSummary.energy.filter(({ energie_utilisee }) => energie_utilisee === 'gaz').length,
        },
        consommationGaz: {
          cumulProchesRéseau: getConso(rawSummary.gas.filter((gas) => gas.is_close)),
          cumulTotal: getConso(rawSummary.gas),
        },
        longueurRéseauxDeChaleur: rawSummary.network.reduce((acc, current) => acc + current.length, 0) / 1000,
      };
      setSummary(summary);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrawRender = () => {
    if (!mapDraw) {
      return;
    }
    const drawMode = mapDraw.getMode();
    if (drawMode !== 'draw_polygon') {
      return;
    }
    const featureBeingDrawn = mapDraw.getAll().features.at(-1) as AreaSummaryFeature | undefined;
    if (!featureBeingDrawn) {
      return;
    }

    const areaSize = turfArea(featureBeingDrawn) / 1_000_000; // in km²

    // Validate the polygon for self-intersections
    const isGeometryValid = validatePolygonGeometry(featureBeingDrawn.geometry.coordinates[0]);

    setFeatures([
      {
        ...featureBeingDrawn,
        properties: {
          areaHasSelfIntersections: !isGeometryValid,
          areaSize,
          isValid: areaSize <= clientConfig.summaryAreaSizeLimit && isGeometryValid,
        },
      },
    ]);
  };

  useEffect(() => {
    if (!mapLoaded) {
      return;
    }
    const map = mapRef.getMap();

    map.on('draw.create', onDrawCreate);
    map.on('draw.render', onDrawRender);

    // adapted from gl-draw-line-active.hot
    // in https://github.com/mapbox/mapbox-gl-draw/blob/f4b3f861efa9c69b0c1d64764b855e5d5274186c/src/modes/draw_polygon.js#L113-L131
    // because the polygon with 2 points is not rendered
    map.addLayer(
      {
        filter: ['==', '$type', 'LineString'],
        id: buildingsDataExtractionDrawHotSourceLayerId,
        paint: {
          'line-color': '#000091',
          'line-width': 4,
        },
        source: 'mapbox-gl-draw-hot',
        type: 'line',
      },
      'buildings-data-extraction-outline'
    );
    if (features.length === 0 && !summary) {
      mapDraw.changeMode('draw_polygon');
      setIsDrawing(true);
    }

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.render', onDrawRender);
      map.removeLayer(buildingsDataExtractionDrawHotSourceLayerId);

      // clear the feature being drawn
      mapDraw.deleteAll();

      // handle exit via routing
      setIsDrawing((isDrawing) => {
        if (isDrawing) {
          clearSummary();
        }
        return false;
      });
    };
  }, [mapLoaded]);

  // handle the esc key to quit drawing mode (run after the draw.modechange event)
  useKeyboardEvent(
    'Escape',
    () => {
      if (isDrawing) {
        clearSummary();
      }
    },
    [],
    { event: 'keyup' }
  );

  const clearSummary = () => {
    if (!mapDraw) {
      return;
    }
    setSummary(null);
    mapDraw.deleteAll();
    mapDraw.changeMode('draw_polygon');
    setIsDrawing(true);
    setFeatures([]);
  };

  const exportSummary = async () => {
    trackEvent('Carto|Extraction données batiments|Exporter les données');
    const file = await trpcUtils.client.data.exportPolygonSummary.query({
      coordinates: features[0].geometry.coordinates[0],
      format: 'csv',
    });
    downloadBaseEncoded64File(file.content, file.name, 'application/zip');
  };

  const showClearButton = features[0]?.geometry.coordinates[0]?.length > 2 && !isLoading;

  return (
    <Box display="flex" flexDirection="column" gap="16px">
      <Box>
        <Title>Extraire des données sur les bâtiments</Title>

        <Text size="xs" fontStyle="italic">
          Vous pouvez extraire les adresses et nombre de logements des bâtiments à chauffage collectif gaz ou fioul, ainsi que les
          consommations de gaz à l'adresse, sur la zone de votre choix.
        </Text>
        <Text size="xs" fontStyle="italic" mt="1w">
          Pour définir une zone, cliquez sur au moins 3 points sur la carte. <strong>Double-cliquez</strong> sur le dernier point ou{' '}
          <strong>appuyez sur la touche entrée</strong> pour finaliser la zone.
        </Text>
      </Box>

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
              pas à{' '}
              <a href={`mailto:${clientConfig.contactEmail}`} target="_blank" rel="noopener noreferrer">
                nous contacter
              </a>
            </>
          }
        />
      )}

      {isLoading && (
        <Box display="grid" placeContent="center">
          <Oval height={60} width={60} color="#000091" secondaryColor="#0000ee" />
        </Box>
      )}

      {summary && (
        <Box fontSize="14px" display="flex" flexDirection="column" gap="12px">
          <Box display="flex">
            <img src="/icons/picto-fioul-noir.svg" alt="" />
            <Text ml="1w">Bâtiments à chauffage collectif fioul</Text>
          </Box>
          <Box pl="4w">
            <Box>
              <strong>{summary.batimentsChauffageCollectifFioul.nbTotal}</strong> Total
            </Box>
            <Box>
              <strong>{summary.batimentsChauffageCollectifFioul.nbProchesRéseau}</strong> Proche réseau (&lt;50m)
            </Box>
          </Box>

          <Box display="flex">
            <img src="/icons/picto-gaz-bleu.svg" alt="" />
            <Text ml="1w">Bâtiments à chauffage collectif gaz</Text>
          </Box>
          <Box pl="4w">
            <Box>
              <strong>{summary.batimentsChauffageCollectifGaz.nbTotal}</strong> Total
            </Box>
            <Box>
              <strong>{summary.batimentsChauffageCollectifGaz.nbProchesRéseau}</strong> Proche réseau (&lt;50m)
            </Box>
          </Box>

          <Box display="flex">
            <img src="/icons/picto-gaz-bleu.svg" alt="" />
            <Text ml="1w">Consommations de gaz</Text>
          </Box>
          <Box pl="4w">
            <Box>
              <strong>{summary.consommationGaz.cumulTotal}</strong> Total
            </Box>
            <Box>
              <strong>{summary.consommationGaz.cumulProchesRéseau}</strong> Proche réseau (&lt;50m)
            </Box>
          </Box>

          <Box display="flex">
            <img src="/icons/picto-reseaux-vert.svg" alt="" />
            <Text ml="1w">Réseaux de chaleur</Text>
          </Box>
          <Box pl="4w">
            <Box>
              <strong>{summary.longueurRéseauxDeChaleur.toFixed(2)}</strong> km
            </Box>
          </Box>
        </Box>
      )}

      {showClearButton && (
        <Button
          priority="secondary"
          iconId="fr-icon-delete-bin-line"
          className="btn-full-width"
          onClick={() => {
            trackEvent('Carto|Extraction données batiments|Effacer');
            clearSummary();
          }}
        >
          Effacer
        </Button>
      )}
      {summary && (
        <Button priority="tertiary" iconId="fr-icon-download-line" className="btn-full-width" onClick={exportSummary}>
          Exporter les données
        </Button>
      )}
    </Box>
  );
};

export default BuildingsDataExtractionTool;

const getConso = (consos: { conso_nb: number }[]) => {
  const sum = consos.reduce((acc, current) => acc + current.conso_nb, 0);
  if (sum > 1000) {
    return `${(sum / 1000).toFixed(2)} GWh`;
  }

  return `${sum.toFixed(2)} MWh`;
};

/**
 * Synchronise the features with the map
 */
export function useBuildingsDataExtractionLayers() {
  const { mapLayersLoaded, mapRef } = useFCUMap();
  const [features] = useAtom(featuresAtom);

  useEffect(() => {
    if (!mapLayersLoaded) {
      return;
    }

    (mapRef.getSource(buildingsDataExtractionPolygonsSourceId) as GeoJSONSource).setData({
      features,
      type: 'FeatureCollection',
    });
  }, [mapLayersLoaded, features]);
}

export const buildingsDataExtractionLayers = [
  {
    layers: [
      {
        id: 'buildings-data-extraction-fill',
        isVisible: (config) => config.extractionDonneesBatiment,
        paint: {
          'fill-color': ['case', ['get', 'isValid'], '#0000911A', '#f538381A'],
        },
        type: 'fill',
        unselectable: true,
      },
      {
        id: 'buildings-data-extraction-outline',
        isVisible: (config) => config.extractionDonneesBatiment,
        paint: {
          'line-color': ['case', ['get', 'isValid'], '#000091', '#f53838'],
          'line-width': 4,
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
    sourceId: buildingsDataExtractionPolygonsSourceId,
  },
] as const satisfies readonly MapSourceLayersSpecification[];
