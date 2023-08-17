import Map from '@components/Map/Map';
import mapParam from 'src/services/Map/param';
import { MapPopupType } from 'src/types/MapComponentsInfos';
import { LegendGroupId } from 'src/types/enum/LegendGroupId';

const visibleId = [
  LegendGroupId.heatNetwork,
  LegendGroupId.coldNetwork,
  LegendGroupId.zoneDP,
  LegendGroupId.futurheatNetwork,
];

const ViasevaMap = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        initialLayerDisplay={{
          outline: true,
          futurOutline: false,
          coldOutline: false,
          zoneDP: false,
          demands: false,
          raccordements: false,
          gasUsageGroup: false,
          buildings: false,
          gasUsage: [],
          energy: [],
          gasUsageValues: [1000, Number.MAX_VALUE],
          energyGasValues: [50, Number.MAX_VALUE],
          energyFuelValues: [50, Number.MAX_VALUE],
        }}
        withLegend
        legendData={mapParam.legendData.filter(
          (x) => typeof x !== 'string' && visibleId.includes(x.id)
        )}
        legendLogoOpt={{
          src: '/logo-viaseva.svg',
          alt: 'logo viaseva',
        }}
        popupType={MapPopupType.VIASEVA}
      />
    </div>
  );
};

export default ViasevaMap;
