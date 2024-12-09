import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/services/Map/map-configuration';

const CharlevilleMezieresMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          reseauxDeChaleur: {
            show: true,
          },
          reseauxEnConstruction: true,
        })}
        enabledLegendFeatures={['reseauxDeChaleur', 'reseauxEnConstruction']}
        withLegend
        withBorder
        initialCenter={[4.717692, 49.767402]}
        initialZoom={12}
        legendTitle="Réseaux de chaleur"
        legendLogoOpt={{
          src: '/logo-CM.svg',
          alt: 'logo Charleville Mezieres',
        }}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default CharlevilleMezieresMap;
