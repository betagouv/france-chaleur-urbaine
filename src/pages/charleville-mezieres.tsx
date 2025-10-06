import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';

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
          alt: 'logo Charleville Mezieres',
          src: '/logo-CM.svg',
        }}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default CharlevilleMezieresMap;
