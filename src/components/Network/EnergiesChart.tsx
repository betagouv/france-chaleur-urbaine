import { useEffect, useMemo, useState } from 'react';
import Chart from 'react-google-charts';

import type { Network } from '@/types/Summary/Network';

type GraphLegend = {
  position?: string;
  alignment?: string;
  labeledValueText?: string;
};

const getGraphOptions = (network: Network) => [
  ['Catégorie', 'Production'],
  ['UVE', network.prod_MWh_dechets_internes + network.prod_MWh_UIOM, '#d1570c'],
  ['Chaleur industrielle', network.prod_MWh_chaleur_industiel, '#652a96'],
  ['Biomasse', network.prod_MWh_biomasse_solide, '#87ca46'],
  ['Géothermie', network.prod_MWh_geothermie, '#c4218e'],
  ['Autres ENR&R', network.prod_MWh_autres_ENR, '#bcd090'],
  ['Chaufferies électriques', network.prod_MWh_chaudieres_electriques, '#e81919'],
  ['Gaz', network.prod_MWh_gaz_naturel, '#ffb800'],
  ['Charbon', network.prod_MWh_charbon, '#000000'],
  ['Fioul', network.prod_MWh_fioul_domestique + network.prod_MWh_fioul_lourd, '#0065b8'],
  ['GPL', network.prod_MWh_GPL, '#0009b7'],
  ['Autres', network.prod_MWh_autres, '#747474'],
  ['Autre chaleur récupérée', network.prod_MWh_autre_chaleur_recuperee, '#d6c2e6'],
  ['Pompe à chaleur', network.prod_MWh_PAC, '#ec9ba4'],
  ['Biogaz', network.prod_MWh_biogaz, '#e6e905'],
  ['Solaire thermique', network.prod_MWh_solaire_thermique, '#ffff00'],
];

const EnergiesChart = ({ network, width, height }: { network: Network; width?: string; height?: string }) => {
  const graphOptions = useMemo(() => getGraphOptions(network), [network]);
  const [legendOptions, setLegendOptions] = useState<GraphLegend>({});
  const [chartAreaWidth, setChartAreaWidth] = useState<string>('100%');

  const updateChartOptions = () => {
    if (window.innerWidth >= 1100) {
      setLegendOptions({
        alignment: 'center',
        labeledValueText: 'percent',
        position: 'labeled',
      });
      setChartAreaWidth('100%');
    } else {
      setLegendOptions({
        alignment: 'center',
      });
      setChartAreaWidth('90%');
    }
  };

  useEffect(() => {
    updateChartOptions();
    window.addEventListener('resize', updateChartOptions);
    return () => {
      window.removeEventListener('resize', updateChartOptions);
    };
  }, []);

  return (
    <Chart
      width={width || '100%'}
      height={height || '400px'}
      chartType="PieChart"
      chartLanguage="FR-fr"
      loader={<div>Chargement du graphe...</div>}
      data={graphOptions.map((mix, index) => (index === 0 ? mix : [mix[0], mix[1]]))}
      options={{
        chartArea: { height: '90%', width: chartAreaWidth },
        colors: graphOptions.slice(1).map((option) => option[2] as string),
        legend: legendOptions,
        pieHole: 0.6,
        pieSliceText: 'none',
      }}
      formatters={[
        {
          column: 1,
          options: {
            pattern: '# MWh',
          },
          type: 'NumberFormat',
        },
      ]}
    />
  );
};

export default EnergiesChart;
