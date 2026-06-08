import { iframeSimpleMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { FcuLogo } from '@/modules/map/client/controls/FcuLogo';
import { IframeLegend } from '@/modules/map/client/legend/IframeLegend';
import { Map } from '@/modules/map/client/Map';

const ViasevaMap = () => {
  return (
    <div className="h-dvh w-screen">
      <Map
        config={iframeSimpleMapConfiguration}
        legend="auto"
        legendContent={
          <IframeLegend
            layers={['reseaux-de-chaleur', 'reseaux-de-froid', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire']}
          />
        }
      >
        <FcuLogo />
      </Map>
    </div>
  );
};

export default ViasevaMap;
