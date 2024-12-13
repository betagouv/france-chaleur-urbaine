import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';

const IdexMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          reseauxDeChaleur: {
            show: true,
          },
          filtreGestionnaire: ['idex', 'mixéner'],
        })}
        enabledLegendFeatures={['reseauxDeChaleur', 'reseauxDeFroid', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire']}
        withLegend
        withBorder
        legendLogoOpt={{
          src: '/logo-IDEX.jpg',
          alt: 'logo Idex',
        }}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default IdexMap;
