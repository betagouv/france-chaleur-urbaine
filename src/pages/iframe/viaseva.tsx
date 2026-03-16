import IframeMapPage from '@/components/Map/IframeMapPage';
import { iframePresets } from '@/components/Map/iframe-presets';

const ViasevaMap = () => {
  const preset = iframePresets.viaseva;

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

export default ViasevaMap;
