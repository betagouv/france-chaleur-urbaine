import { useTrackPageView } from '@/modules/conversion-tracking/client/useTrackPageView';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { FcuLogo } from '@/modules/map/client/controls/FcuLogo';
import { IframeLegend } from '@/modules/map/client/legend/IframeLegend';
import { Map } from '@/modules/map/client/Map';

const CollectivityMap = () => {
  useTrackPageView();

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
        search="eligibility"
        legendContent={<IframeLegend layers={['reseaux-de-chaleur', 'perimetres-de-developpement-prioritaire']} />}
      >
        <FcuLogo />
      </Map>
    </div>
  );
};

export default CollectivityMap;
