import Map from '@components/Map/Map';
import param from 'src/services/Map/param';
import mapParam from 'src/services/Map/param';
import { MapPopupType } from 'src/types/MapComponentsInfos';
import { LegendGroupId } from 'src/types/enum/LegendGroupId';

const visibleId = [
  LegendGroupId.heatNetwork,
  LegendGroupId.coldNetwork,
  LegendGroupId.zoneDP,
  LegendGroupId.futurheatNetwork,
];

const IdexMap = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        initialLayerDisplay={param.iframeSimpleLayerDisplay}
        withLegend
        withBorder
        withHideLegendSwitch
        legendData={mapParam.legendData.filter(
          (x) => typeof x !== 'string' && visibleId.includes(x.id)
        )}
        legendLogoOpt={{
          src: '/logo-IDEX.jpg',
          alt: 'logo Idex',
        }}
        popupType={MapPopupType.IDEX}
        //Filter : gestionnaire for futurNetwork and Gestionnaire for coldNetwork and network
        filter={[
          'any',
          [
            'in',
            'idex',
            ['downcase', ['coalesce', ['get', 'gestionnaire'], '']],
          ],
          [
            'in',
            'idex',
            ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']],
          ],
          [
            'in',
            'mixener',
            ['downcase', ['coalesce', ['get', 'gestionnaire'], '']],
          ],
          [
            'in',
            'mixener',
            ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']],
          ],
        ]}
        withFCUAttribution
      />
    </div>
  );
};

export default IdexMap;
