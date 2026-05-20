import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { FcuLogo } from '@/modules/map/client/controls/FcuLogo';
import { IframeLegend } from '@/modules/map/client/legend/IframeLegend';
import { Map } from '@/modules/map/client/Map';

const DalkiaMap = () => {
  return (
    <div className="h-dvh w-screen">
      <Map
        config={createMapConfiguration({
          filtreGestionnaire: ['dalkia'],
          reseauxDeChaleur: {
            show: true,
          },
        })}
        legend="auto"
        legendContent={
          <IframeLegend
            layers={['reseaux-de-chaleur', 'reseaux-de-froid', 'reseaux-en-construction', 'zones-de-developpement-prioritaire']}
          />
        }
      >
        <FcuLogo />
      </Map>
    </div>
  );
};

export default DalkiaMap;
