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
          alt: 'logo viaseva',
          src: '/logo-viaseva.svg',
        }}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default ViasevaMap;
