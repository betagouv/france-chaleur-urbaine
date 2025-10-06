import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';

const DalkiaMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          filtreGestionnaire: ['dalkia'],
          reseauxDeChaleur: {
            show: true,
          },
        })}
        enabledLegendFeatures={['reseauxDeChaleur', 'reseauxDeFroid', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire']}
        withLegend
        withBorder
        legendLogoOpt={{
          alt: 'logo Dalkia',
          src: '/logo-DALKIA.png',
        }}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default DalkiaMap;
