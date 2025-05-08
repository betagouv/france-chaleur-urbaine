import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';

const CeremaMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          reseauxDeChaleur: {
            show: true,
          },
          reseauxEnConstruction: true,
          zonesDeDeveloppementPrioritaire: true,
        })}
        withLegend
        withBorder
        legendLogoOpt={{
          src: '/logo-CEREMA.jpg',
          alt: 'logo CEREMA',
        }}
        withFCUAttribution
        withComptePro={false}
      />
    </IframeWrapper>
  );
};

export default CeremaMap;
