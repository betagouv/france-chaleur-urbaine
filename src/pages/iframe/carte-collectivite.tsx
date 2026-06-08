import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { FcuLogo } from '@/modules/map/client/controls/FcuLogo';
import { IframeLegend } from '@/modules/map/client/legend/IframeLegend';
import { Map } from '@/modules/map/client/Map';

const CollectivityMap = () => {
  return (
    <div className="h-dvh w-screen">
      <Map
        config={createMapConfiguration({
          reseauxDeChaleur: {
            show: true,
          },
          zonesDeDeveloppementPrioritaire: true,
        })}
        legend="auto"
        legendContent={
          <IframeLegend layers={['reseaux-de-chaleur', 'perimetres-de-developpement-prioritaire']} title="Réseaux de chaleur" />
        }
      >
        <FcuLogo />
      </Map>
    </div>
  );
};

export default CollectivityMap;
