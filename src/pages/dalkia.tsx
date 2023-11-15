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

const DalkiaMap = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        initialLayerDisplay={param.simpleLayerDisplay}
        withLegend
        withBorder
        withHideLegendSwitch
        legendData={mapParam.legendData.filter(
          (x) => typeof x !== 'string' && visibleId.includes(x.id)
        )}
        legendLogoOpt={{
          src: '/logo-DALKIA.png',
          alt: 'logo Dalkia',
        }}
        popupType={MapPopupType.DALKIA}
        filter={[
          'any',
          [
            'in',
            'dalkia',
            ['downcase', ['coalesce', ['get', 'gestionnaire'], '']],
          ],
          [
            'in',
            'dalkia',
            ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']],
          ],
        ]}
      />
    </div>
  );
};

export default DalkiaMap;
