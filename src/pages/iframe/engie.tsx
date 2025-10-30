import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';

const EngieMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          filtreGestionnaire: ['engie'],
          reseauxDeChaleur: {
            show: true,
          },
        })}
        enabledLegendFeatures={['reseauxDeChaleur', 'reseauxDeFroid', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire']}
        withLegend
        withBorder
        legendLogoOpt={{
          alt: 'logo ENGIE',
          src: '/logo-ENGIE.jpg',
        }}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default EngieMap;
