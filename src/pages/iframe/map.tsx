import { useRouter } from 'next/router';

import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import { legendURLKeyToLegendFeature } from '@/components/Map/map-layers';
import useRouterReady from '@/hooks/useRouterReady';

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
