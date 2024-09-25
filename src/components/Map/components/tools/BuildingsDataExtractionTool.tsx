import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import { useKeyboardEvent } from '@react-hookz/web';
import turfArea from '@turf/area';
import { Map } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import Box from '@components/ui/Box';
import Text from '@components/ui/Text';
import useFCUMap from '@hooks/useFCUMap';
import { validatePolygonGeometry } from '@utils/geo';
import { clientConfig } from 'src/client-config';
import { useServices } from 'src/services';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { GasSummary } from 'src/types/Summary/Gas';

import { Title } from '../SimpleMapLegend.style';

export type AreaSummaryFeature = GeoJSON.Feature<GeoJSON.Polygon> & {
  id: string;
  properties: {
    isValid: string;
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

const BuildingsDataExtractionTool: React.FC = () => {
  const { heatNetworkService } = useServices();
  const { mapLoaded, mapRef, mapDraw, isDrawing, setIsDrawing } = useFCUMap();
  const [area, setArea] = useState<GeoJSON.Position[] | null>(null);
  const [areaSize, setAreaSize] = useState<number>(0);
  const areaSizeRef = useRef(areaSize);
  const [areaHasSelfIntersections, setAreaHasSelfIntersections] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<BuildingsDataExtractSummary | null>(null);

  useEffect(() => {
    areaSizeRef.current = areaSize;
  }, [areaSize]);

  const onDrawCreate = async ({ features: drawFeatures }: DrawCreateEvent) => {
    if (!mapDraw) {
      return;
    }
    setIsDrawing(false);
    // always only 1 feature
    const feature = drawFeatures[0] as GeoJSON.Feature<GeoJSON.Polygon>;
    const area = feature.geometry.coordinates[0];
    // get latest area size as the ref keeps the up-to-date value
    if (areaSizeRef.current > clientConfig.summaryAreaSizeLimit || !validatePolygonGeometry(area)) {
      return;
    }

    try {
      setIsLoading(true);
      setArea(area);
      const rawSummary = await heatNetworkService.summary(area);
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
    const featureBeingDrawn = mapDraw.getAll().features.at(-1) as AreaSummaryFeature;
    if (!featureBeingDrawn) {
      return;
    }

    const areaSize = turfArea(featureBeingDrawn) / 1_000_000;
    setAreaSize(areaSize); // in km²

    // Validate the polygon for self-intersections
    const isGeometryValid = validatePolygonGeometry(featureBeingDrawn.geometry.coordinates[0]);
    setAreaHasSelfIntersections(!isGeometryValid);

    const isPolygonValid = areaSize <= clientConfig.summaryAreaSizeLimit && isGeometryValid;
    mapDraw.setFeatureProperty(featureBeingDrawn.id as string, 'isValid', isPolygonValid);
  };

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
    setArea(null);
  };

  const exportSummary = async () => {
    if (!area) {
      return;
    }
    await heatNetworkService.downloadSummary(area, EXPORT_FORMAT.CSV);
  };

  useEffect(() => {
    if (!mapLoaded) {
      return;
    }
    const map = mapRef.getMap();

    configureSourcesAndLayers(map);
    map.on('draw.create', onDrawCreate);
    map.on('draw.render', onDrawRender);
    mapDraw.changeMode('draw_polygon');
    setIsDrawing(true);

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.render', onDrawRender);

      // clear the feature being drawn
      mapDraw.deleteAll();
      setIsDrawing(false);

      // clear existing features
      clearSourcesAndLayers(map);
    };
  }, [mapLoaded]);

  return (
    <>
      <Box display="flex" flexDirection="column" gap="16px">
        <Box>
          <Title>Extraire des données sur les bâtiments</Title>

          <Text size="xs" fontStyle="italic">
            Vous pouvez extraire les adresses et nombre de logements des bâtiments à chauffage collectif gaz ou fioul, ainsi que les
            consommations de gaz à l'adresse, sur la zone de votre choix.
            <br />
            Pour définir une zone, cliquez sur au moins 3 points sur la carte. Double-cliquez sur le dernier point ou appuyez sur la touche
            entrée pour finaliser la zone.
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
                {clientConfig.summaryAreaSizeLimit} km²). Si vous avez besoin de statistiques sur une zone élargie ou plus précise,
                n'hésitez pas à{' '}
                <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr" target="_blank" rel="noopener noreferrer">
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

        {areaSize > 0 && !isLoading && (
          <Button priority="secondary" iconId="fr-icon-delete-bin-line" className="btn-full-width" onClick={clearSummary}>
            Effacer
          </Button>
        )}
        {summary && (
          <Button priority="secondary" iconId="fr-icon-download-line" className="btn-full-width" onClick={exportSummary}>
            Exporter les données
          </Button>
        )}
      </Box>
    </>
  );
};

export default BuildingsDataExtractionTool;

const getConso = (consos: GasSummary[]) => {
  const sum = consos.reduce((acc, current) => acc + current.conso_nb, 0);
  if (sum > 1000) {
    return `${(sum / 1000).toFixed(2)} GWh`;
  }

  return `${sum.toFixed(2)} MWh`;
};

function configureSourcesAndLayers(map: Map) {
  ['mapbox-gl-draw-hot', 'mapbox-gl-draw-cold'].forEach((sourceId) => {
    map.addLayer({
      source: sourceId,
      id: `buildings-data-extraction-fill-${sourceId}`,
      type: 'fill',
      paint: {
        'fill-color': ['case', ['get', 'user_isValid'], '#0000911A', '#f538381A'],
      },
    });
    map.addLayer({
      source: sourceId,
      id: `buildings-data-extraction-outline-${sourceId}`,
      type: 'line',
      paint: {
        'line-color': ['case', ['get', 'user_isValid'], '#000091', '#f53838'],
        'line-width': 4,
      },
    });
  });
}

function clearSourcesAndLayers(map: Map) {
  ['mapbox-gl-draw-hot', 'mapbox-gl-draw-cold'].forEach((sourceId) => {
    map.removeLayer(`buildings-data-extraction-fill-${sourceId}`);
    map.removeLayer(`buildings-data-extraction-outline-${sourceId}`);
    map.removeLayer(`buildings-data-extraction-label-${sourceId}`);
  });
}
