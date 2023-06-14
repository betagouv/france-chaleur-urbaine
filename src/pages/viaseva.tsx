import Map from '@components/Map/Map';
import mapParam from 'src/services/Map/param';
import { LegendGroupId } from 'src/types/enum/LegendGroupId';

const ViasevaMap = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        initialLayerDisplay={{
          outline: true,
          futurOutline: false,
          coldOutline: true,
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
          (x) =>
            typeof x !== 'string' &&
            (x.id === LegendGroupId.heatNetwork ||
              x.id === LegendGroupId.coldNetwork)
        )}
        legendLogoOpt={{
          src: '/logo-viaseva.svg',
          alt: 'logo viaseva',
          height: '61px',
        }}
      />
    </div>
  );
};

export default ViasevaMap;
