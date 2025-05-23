import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SEO from '@/components/SEO';

const CeremaMap = () => {
  return (
    <>
      <SEO
        noIndex
        title="Carte des réseaux de chaleur et de froid"
        description="Découvrez la carte de référence des réseaux de chaleur et de froid, identifiez les opportunités de raccordement pour votre bâtiment."
      />
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
    </>
  );
};

export default CeremaMap;
