import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';

const EngieMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          reseauxDeChaleur: {
            show: true,
          },
          filtreGestionnaire: ['engie'],
        })}
        enabledLegendFeatures={['reseauxDeChaleur', 'reseauxDeFroid', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire']}
        withLegend
        withBorder
        legendLogoOpt={{
          src: '/logo-ENGIE.jpg',
          alt: 'logo ENGIE',
        }}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default EngieMap;
