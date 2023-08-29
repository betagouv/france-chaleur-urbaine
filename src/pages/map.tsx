import Map from '@components/Map/Map';
import { useRouter } from 'next/router';
import param from 'src/services/Map/param';
import mapParam from 'src/services/Map/param';
import { LegendGroupId } from 'src/types/enum/LegendGroupId';

const legendMapping: Record<LegendGroupId, string> = {
  [LegendGroupId.zoneDP]: 'pdp',
  [LegendGroupId.gasUsageGroup]: 'conso_gaz',
  [LegendGroupId.energy]: 'gaz',
  [LegendGroupId.demands]: 'demandes',
  [LegendGroupId.raccordements]: 'raccordements',
  [LegendGroupId.buildings]: 'dpe',
  [LegendGroupId.heatNetwork]: '',
  [LegendGroupId.futurheatNetwork]: 'futur_reseau',
  [LegendGroupId.coldNetwork]: 'reseau_froid',
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
                    legend !== 'contributeButton' &&
                    (typeof legend === 'string' ||
                      legend.id === LegendGroupId.heatNetwork ||
                      displayLegendArray.includes(legendMapping[legend.id]))
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
                futurOutline: displayArray.includes(
                  legendMapping['futur-heat-network']
                ),
                coldOutline: displayArray.includes(
                  legendMapping['cold-network']
                ),
                zoneDP: displayArray.includes(legendMapping.zoneDP),
                demands: displayArray.includes(legendMapping.demands),
                raccordements: displayArray.includes(
                  legendMapping.raccordements
                ),
                gasUsageGroup: displayArray.includes(legendMapping.gasUsage),
                buildings: displayArray.includes(legendMapping.buildings),
                gasUsage: displayArray.includes(legendMapping.gasUsage)
                  ? ['R', 'T', 'I']
                  : [],
                energy: displayArray.includes(legendMapping.energy)
                  ? ['gas', 'fuelOil']
                  : [],
                gasUsageValues: [1000, Number.MAX_VALUE],
                energyGasValues: [50, Number.MAX_VALUE],
                energyFuelValues: [50, Number.MAX_VALUE],
              }
            : param.simpleLayerDisplay
        }
      />
    </div>
  );
};

export default MapPage;
