import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { FcuLogo } from '@/modules/map/client/controls/FcuLogo';
import { IframeLegend } from '@/modules/map/client/legend/IframeLegend';
import { Map } from '@/modules/map/client/Map';

const CharlevilleMezieresMap = () => {
  return (
    <div className="h-dvh w-screen">
      <Map
        config={createMapConfiguration({
          reseauxDeChaleur: {
            show: true,
          },
          reseauxEnConstruction: true,
        })}
        initialView={{ center: [4.717692, 49.767402], zoom: 12 }}
        legend="auto"
        search="eligibility"
        legendContent={<IframeLegend layers={['reseaux-de-chaleur', 'reseaux-en-construction']} />}
      >
        <FcuLogo />
      </Map>
    </div>
  );
};

export default CharlevilleMezieresMap;
