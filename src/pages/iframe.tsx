import { useRouter } from 'next/router';

import IframeMapPage from '@/components/Map/IframeMapPage';
import { getIframePreset } from '@/components/Map/iframe-presets';
import useRouterReady from '@/hooks/useRouterReady';

const IframePage = () => {
  const router = useRouter();
  const isRouterReady = useRouterReady();

  if (!isRouterReady) {
    return null;
  }

  const gestionnaire = Array.isArray(router.query.gestionnaire) ? router.query.gestionnaire[0] : router.query.gestionnaire;
  const preset = getIframePreset(gestionnaire);

  return (
    <IframeMapPage
      defaultMapConfiguration={preset?.defaultMapConfiguration ?? {}}
      defaultEnabledLegendFeatures={preset?.defaultEnabledLegendFeatures ?? []}
      defaultWithLegend={false}
      legendLogoOpt={preset?.legendLogoOpt}
      withBorder
      withFCUAttribution
    />
  );
};

export default IframePage;
