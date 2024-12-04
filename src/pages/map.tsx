import { useRouter } from 'next/router';

import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { legendURLKeyToLegendFeature } from '@/components/Map/map-layers';
import useRouterReady from '@/hooks/useRouterReady';
import { createMapConfiguration } from '@/services/Map/map-configuration';

const MapPage = () => {
  const router = useRouter();
  const isRouterReady = useRouterReady();
  if (!isRouterReady) {
    return null;
  }

  const { legend, displayLegend } = router.query;

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
        withBorder
        enabledLegendFeatures={legendFeatures}
        initialMapConfiguration={initialMapConfiguration}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default MapPage;
