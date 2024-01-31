import Map from '@components/Map/Map';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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
  [LegendGroupId.heatNetwork]: 'reseau_chaleur',
  [LegendGroupId.futurheatNetwork]: 'futur_reseau',
  [LegendGroupId.coldNetwork]: 'reseau_froid',
  [LegendGroupId.gasUsage]: 'conso_gaz',
};
const MapPage = () => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setIsReady(true);
    }
  }, [router]);

  if (!isReady) {
    return null;
  }

  const { legend, drawing, display, displayLegend } = router.query;

  let displayArray = display ? decodeURI(display as string) : undefined;
  const displayLegendArray = displayLegend
    ? decodeURI(displayLegend as string)
    : undefined;

  const legendData = displayLegendArray
    ? mapParam.legendData
        .filter(
          (legend) =>
            legend !== 'contributeButton' &&
            legend !== 'statsByArea' &&
            legend !== 'proModeLegend' &&
            (typeof legend === 'string' ||
              displayLegendArray.includes(legendMapping[legend.id]))
        )
        .filter(
          (legend, i, legends) =>
            legend !== 'separator' || legends[i - 1] !== 'separator'
        )
    : mapParam.legendData.filter((x) => x !== 'proModeLegend');

  if (legendData.length === 3) {
    // Only one selected (+ sources + separator)
    displayArray = displayLegend as string;
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        withLegend={legend === 'true'}
        withHideLegendSwitch={legend === 'true'}
        withDrawing={drawing === 'true'}
        withBorder
        legendData={legendData}
        initialLayerDisplay={
          displayArray
            ? {
                outline: displayArray.includes(legendMapping['heat-network']),
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
            : param.iframeSimpleLayerDisplay
        }
        withFCUAttribution
      />
    </div>
  );
};

export default MapPage;
