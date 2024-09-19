import Button from '@codegouvfr/react-dsfr/Button';
import { DrawCreateEvent, DrawModeChangeEvent } from '@mapbox/mapbox-gl-draw';
import { Map } from 'maplibre-gl';
import { useEffect, useState } from 'react';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import useFCUMap from '@hooks/useFCUMap';
import { useServices } from 'src/services';
import { GasSummary } from 'src/types/Summary/Gas';

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
  const { mapLoaded, mapRef, mapDraw, setIsDrawing } = useFCUMap();
  const [summary, setSummary] = useState<BuildingsDataExtractSummary | null>(null);

  const onDrawCreate = async ({ features: drawFeatures }: DrawCreateEvent) => {
    if (!mapDraw) {
      return;
    }
    // always only 1 feature
    const feature = drawFeatures[0] as GeoJSON.Feature<GeoJSON.Polygon>;
    const rawSummary = await heatNetworkService.summary(feature.geometry.coordinates[0]);
    const summary: BuildingsDataExtractSummary = {
      batimentsChauffageCollectifFioul: {
        nbProchesRéseau: rawSummary.energy
          .filter((energy) => energy.is_close)
          .filter(({ energie_utilisee }) => energie_utilisee === 'fioul').length,
        nbTotal: rawSummary.energy.filter(({ energie_utilisee }) => energie_utilisee === 'fioul').length,
      },
      batimentsChauffageCollectifGaz: {
        nbProchesRéseau: rawSummary.energy.filter((energy) => energy.is_close).filter(({ energie_utilisee }) => energie_utilisee === 'gaz')
          .length,
        nbTotal: rawSummary.energy.filter(({ energie_utilisee }) => energie_utilisee === 'gaz').length,
      },
      consommationGaz: {
        cumulProchesRéseau: getConso(rawSummary.gas.filter((gas) => gas.is_close)),
        cumulTotal: getConso(rawSummary.gas),
      },
      longueurRéseauxDeChaleur: rawSummary.network.reduce((acc, current) => acc + current.length, 0) / 1000,
    };
    setSummary(summary);
    setIsDrawing(false);
  };

  // handle the esc key to quit drawing mode
  const onDrawModeChange = ({ mode }: DrawModeChangeEvent) => {
    if (!mapDraw) {
      return;
    }
    if (mode === 'simple_select') {
      setIsDrawing(false);
    }
  };

  const clearSummary = () => {
    if (!mapDraw) {
      return;
    }
    setSummary(null);
    mapDraw.deleteAll();
    mapDraw.changeMode('draw_polygon');
    setIsDrawing(true);
  };

  useEffect(() => {
    if (!mapLoaded) {
      return;
    }
    const map = mapRef.getMap();

    configureSourcesAndLayers(map);
    map.on('draw.create', onDrawCreate);
    map.on('draw.modechange', onDrawModeChange);
    mapDraw.changeMode('draw_polygon');
    setIsDrawing(true);

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.modechange', onDrawModeChange);

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
          <Heading as="h6" mb="1w">
            Extraire des données sur les bâtiments
          </Heading>

          <Text size="xs" fontStyle="italic">
            Cliquez sur au moins 3 points de la cartes afin d’extraire les données des bâtiments se trouvant dans la zone
          </Text>
        </Box>

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

        {summary && (
          <Button priority="secondary" iconId="fr-icon-delete-bin-line" className="btn-full-width" onClick={clearSummary}>
            Effacer
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
        'fill-color': '#0000911A',
      },
    });
    map.addLayer({
      source: sourceId,
      id: `buildings-data-extraction-outline-${sourceId}`,
      type: 'line',
      paint: {
        'line-color': '#000091',
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
