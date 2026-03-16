import IframeMapPage from '@/components/Map/IframeMapPage';
import { iframePresets } from '@/components/Map/iframe-presets';

const EngieMap = () => {
  const preset = iframePresets.engie;

  return (
    <IframeMapPage
      defaultMapConfiguration={preset.defaultMapConfiguration}
      defaultEnabledLegendFeatures={preset.defaultEnabledLegendFeatures}
      withBorder
      legendLogoOpt={preset.legendLogoOpt}
      withFCUAttribution
    />
  );
};

export default EngieMap;
