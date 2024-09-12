import { useRouter } from 'next/router';

import IframeWrapper from '@components/IframeWrapper';
import { type MapLegendFeature } from '@components/Map/components/MapLegendReseaux';
import Map from '@components/Map/Map';
import useRouterReady from '@hooks/useRouterReady';
import { createMapConfiguration } from 'src/services/Map/map-configuration';

export const selectableLayers = [
  {
    label: 'Les réseaux de chaleur existants',
    key: 'reseau_chaleur',
  },
  {
    label: 'Les réseaux de chaleur en construction',
    key: 'futur_reseau',
  },
  {
    label: 'Les périmètres de développement prioritaire',
    key: 'pdp',
  },
  {
    label: 'Les réseaux de froid',
    key: 'reseau_froid',
  },
] as const;

export type LegendURLKey = (typeof selectableLayers)[number]['key'];

const legendURLKeyToLegendFeature: Record<LegendURLKey | string, MapLegendFeature> = {
  reseau_chaleur: 'reseauxDeChaleur',
  futur_reseau: 'reseauxEnConstruction',
  reseau_froid: 'reseauxDeFroid',
  pdp: 'zonesDeDeveloppementPrioritaire',
  raccordements: 'batimentsRaccordes',
};

const MapPage = () => {
  const router = useRouter();
  const isRouterReady = useRouterReady();
  if (!isRouterReady) {
    return null;
  }

  const { legend, drawing, displayLegend } = router.query;

  const legendFeatures = displayLegend
    ? decodeURI(displayLegend as string)
        .split(',')
        .map((f) => legendURLKeyToLegendFeature[f])
        .filter((v) => !!v)
    : [];

  // uniquement pour ces 2 couches, on les affiche directement si affichées dans la légende
  const initialMapConfiguration = createMapConfiguration({
    reseauxDeChaleur: {
      show: legendFeatures.includes('reseauxDeChaleur'),
    },
    reseauxEnConstruction: legendFeatures.includes('reseauxEnConstruction'),
  });

  return (
    <IframeWrapper>
      <Map
        withLegend={legend === 'true'}
        withHideLegendSwitch={legend === 'true'}
        withDrawing={drawing === 'true'}
        withBorder
        enabledLegendFeatures={legendFeatures}
        initialMapConfiguration={initialMapConfiguration}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default MapPage;
