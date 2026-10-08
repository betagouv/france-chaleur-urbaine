import { useEffect, useMemo, useState } from 'react';
import Chart from 'react-google-charts';

import type { HeatNetwork } from '@/modules/reseaux/types';

type GraphLegend = {
  position?: string;
  alignment?: string;
  labeledValueText?: string;
};

const getGraphOptions = (network: HeatNetwork) => [
  ['Catégorie', 'Production'],
  ['UVE', (network.prod_MWh_dechets_internes ?? 0) + (network.prod_MWh_UIOM ?? 0), '#d1570c'],
  ['Chaleur industrielle', network.prod_MWh_chaleur_industiel ?? 0, '#652a96'],
  ['Biomasse', network.prod_MWh_biomasse_solide ?? 0, '#87ca46'],
  ['Géothermie', network.prod_MWh_geothermie ?? 0, '#c4218e'],
  ['Autres ENR&R', network.prod_MWh_autres_ENR ?? 0, '#bcd090'],
  ['Chaufferies électriques', network.prod_MWh_chaudieres_electriques ?? 0, '#e81919'],
  ['Gaz', network.prod_MWh_gaz_naturel ?? 0, '#ffb800'],
  ['Charbon', network.prod_MWh_charbon ?? 0, '#000000'],
  ['Fioul', (network.prod_MWh_fioul_domestique ?? 0) + (network.prod_MWh_fioul_lourd ?? 0), '#0065b8'],
  ['GPL', network.prod_MWh_GPL ?? 0, '#0009b7'],
  ['Autres', network.prod_MWh_autres ?? 0, '#747474'],
  ['Autre chaleur récupérée', network.prod_MWh_autre_chaleur_recuperee ?? 0, '#d6c2e6'],
  ['Pompe à chaleur', network.prod_MWh_PAC ?? 0, '#ec9ba4'],
  ['Biogaz', network.prod_MWh_biogaz ?? 0, '#e6e905'],
  ['Solaire thermique', network.prod_MWh_solaire_thermique ?? 0, '#ffff00'],
];

const EnergiesChart = ({ network, width, height }: { network: HeatNetwork; width?: string; height?: string }) => {
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
