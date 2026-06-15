import SEO from '@/components/SEO';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { FcuLogo } from '@/modules/map/client/controls/FcuLogo';
import { IframeLegend } from '@/modules/map/client/legend/IframeLegend';
import { Map } from '@/modules/map/client/Map';

const CeremaMap = () => {
  return (
    <>
      <SEO
        noIndex
        title="Carte des réseaux de chaleur et de froid"
        description="Découvrez la carte de référence des réseaux de chaleur et de froid, identifiez les opportunités de raccordement pour votre bâtiment."
      />
      <div className="h-dvh w-screen">
        <Map
          config={createMapConfiguration({
            reseauxDeChaleur: {
              show: true,
            },
            reseauxEnConstruction: true,
            zonesDeDeveloppementPrioritaire: true,
          })}
          legend="auto"
          legendContent={
            <IframeLegend layers={['reseaux-de-chaleur', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire']} />
          }
        >
          <FcuLogo />
        </Map>
      </div>
    </>
  );
};

export default CeremaMap;
