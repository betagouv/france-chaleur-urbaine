import Map from '@components/Map/Map';
import { useRouter } from 'next/router';
import mapParam from 'src/services/Map/param';
import { LegendGroupId } from 'src/types/enum/LegendGroupId';

const legendMapping: Record<LegendGroupId, string> = {
  [LegendGroupId.zoneDP]: 'pdp',
  [LegendGroupId.gasUsageGroup]: 'conso_gaz',
  [LegendGroupId.energy]: 'gaz',
  [LegendGroupId.energy]: 'fioul',
  [LegendGroupId.demands]: 'demandes',
  [LegendGroupId.raccordements]: 'raccordements',
  [LegendGroupId.buildings]: 'bat',
  [LegendGroupId.heatNetwork]: '',
  [LegendGroupId.gasUsage]: 'conso_gaz',
};
const MapPage = () => {
  const router = useRouter();

  const { legend, drawing, display, displayLegend } = router.query;

  const displayArray = display ? decodeURI(display as string) : undefined;
  const displayLegendArray = displayLegend
    ? decodeURI(displayLegend as string)
    : undefined;

  if (!router.isReady) {
    return null;
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        key={JSON.stringify(router.query)}
        withLegend={legend === 'true'}
        withDrawing={drawing === 'true'}
        legendData={
          displayLegendArray
            ? mapParam.legendData
                .filter(
                  (legend) =>
                    typeof legend === 'string' ||
                    legend.id === LegendGroupId.heatNetwork ||
                    displayLegendArray.includes(legendMapping[legend.id])
                )
                .filter(
                  (legend, i, legends) =>
                    legend !== 'separator' || legends[i - 1] !== 'separator'
                )
            : mapParam.legendData
        }
        initialLayerDisplay={
          displayArray
            ? {
                outline: true,
                zoneDP: displayArray.includes('pdp'),
                demands: displayArray.includes('demandes'),
                raccordements: displayArray.includes('raccordements'),
                gasUsageGroup: displayArray.includes('conso_gaz'),
                buildings: displayArray.includes('dpe'),
                gasUsage: displayArray.includes('conso_gaz')
                  ? ['R', 'T', 'I']
                  : [],
                energy: displayArray.includes('batiment')
                  ? ['gas', 'fuelOil']
                  : [],
                gasUsageValues: [1000, Number.MAX_VALUE],
                energyGasValues: [50, Number.MAX_VALUE],
                energyFuelValues: [50, Number.MAX_VALUE],
              }
            : {
                outline: true,
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
              }
        }
      />
    </div>
  );
};

export default MapPage;
