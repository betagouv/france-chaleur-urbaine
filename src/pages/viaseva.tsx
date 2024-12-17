import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { iframeSimpleMapConfiguration } from '@/components/Map/map-configuration';

const ViasevaMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={iframeSimpleMapConfiguration}
        enabledLegendFeatures={['reseauxDeChaleur', 'reseauxDeFroid', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire']}
        withLegend
        withBorder
        legendLogoOpt={{
          src: '/logo-viaseva.svg',
          alt: 'logo viaseva',
        }}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default ViasevaMap;
