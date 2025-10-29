import IframeWrapper from '@/components/IframeWrapper';
import { Map } from '@/components/Map/Map.lazy';
import { createMapConfiguration } from '@/components/Map/map-configuration';

const IdexMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          filtreGestionnaire: ['idex', 'mixéner'],
          reseauxDeChaleur: {
            show: true,
          },
        })}
        enabledLegendFeatures={['reseauxDeChaleur', 'reseauxDeFroid', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire']}
        withLegend
        withBorder
        legendLogoOpt={{
          alt: 'logo Idex',
          src: '/logo-IDEX.jpg',
        }}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default IdexMap;
