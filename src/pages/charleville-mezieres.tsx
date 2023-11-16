import Map from '@components/Map/Map';
import mapParam from 'src/services/Map/param';
import { LegendGroupId } from 'src/types/enum/LegendGroupId';

const visibleId = [LegendGroupId.heatNetwork, LegendGroupId.futurheatNetwork];

const CharlevilleMezieresMap = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        initialLayerDisplay={{
          outline: true,
          futurOutline: true,
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
        withBorder
        withHideLegendSwitch
        center={[4.717692, 49.767402]}
        initialZoom={12}
        legendData={mapParam.legendData.filter(
          (x) => typeof x !== 'string' && visibleId.includes(x.id)
        )}
        legendLogoOpt={{
          src: '/logo-CM.svg',
          alt: 'logo Charleville Mezieres',
        }}
      />
    </div>
  );
};

export default CharlevilleMezieresMap;
