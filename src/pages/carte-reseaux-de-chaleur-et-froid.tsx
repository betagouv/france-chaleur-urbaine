import IframeWrapper from '@/components/IframeWrapper';
import { Map } from '@/components/Map/Map.lazy';
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
            alt: 'logo CEREMA',
            src: '/logo-CEREMA.jpg',
          }}
          withFCUAttribution
          withComptePro={false}
        />
      </IframeWrapper>
    </>
  );
};

export default CeremaMap;
