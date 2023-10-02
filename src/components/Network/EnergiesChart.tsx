import { useMemo } from 'react';
import Chart from 'react-google-charts';
import { Network } from 'src/types/Summary/Network';

const getGraphOptions = (network: Network) => [
  ['Catégorie', 'Production'],
  ['UVE', network.prod_MWh_dechets_internes + network.prod_MWh_UIOM, '#d1570c'],
  ['Chaleur industrielle', network.prod_MWh_chaleur_industiel, '#652a96'],
  ['Biomasse', network.prod_MWh_biomasse_solide, '#87ca46'],
  ['Géothermie', network.prod_MWh_geothermie, '#c4218e'],
  [
    'Autres ENR&R',
    network.prod_MWh_solaire_thermique +
      network.prod_MWh_biogaz +
      network.prod_MWh_PAC_ENR +
      network.prod_MWh_autres_ENR +
      network.prod_MWh_autre_RCU_ENR +
      network.prod_MWh_autre_chaleur_recuperee_ENR,
    '#bcd090',
  ],
  [
    'Chaufferies électriques',
    network.prod_MWh_chaudieres_electriques,
    '#e81919',
  ],
  ['Gaz naturel', network.prod_MWh_gaz_naturel, '#ffb800'],
  ['Charbon', network.prod_MWh_charbon, '#000000'],
  [
    'Fiouls',
    network.prod_MWh_fioul_domestique + network.prod_MWh_fioul_lourd,
    '#0065b8',
  ],
  ['GPL', network.prod_MWh_GPL, '#0009b7'],
  [
    'Autres énergies fossiles',
    network.prod_MWh_autres_nonENR +
      network.prod_MWh_autre_RCU_nonENR +
      network.prod_MWh_PAC_nonENR +
      network.prod_MWh_autre_chaleur_recuperee_nonENR,
    '#747474',
  ],
];

const EnergiesChart = ({
  network,
  width,
  height,
}: {
  network: Network;
  width?: string;
  height?: string;
}) => {
  const graphOptions = useMemo(() => getGraphOptions(network), [network]);

  return (
    <Chart
      width={width || '100%'}
      height={height || '400px'}
      chartType="PieChart"
      chartLanguage="FR-fr"
      loader={<div>Chargement du graphe...</div>}
      data={graphOptions.map((mix, index) =>
        index === 0 ? mix : [mix[0], mix[1]]
      )}
      options={{
        colors: graphOptions.slice(1).map((option) => option[2] as string),
        chartArea: { width: '100%', height: '90%' },
        pieHole: 0.6,
        legend: {
          position: 'labeled',
          alignment: 'center',
          labeledValueText: 'percent',
        },
        pieSliceText: 'none',
      }}
      formatters={[
        {
          type: 'NumberFormat',
          column: 1,
          options: {
            pattern: '# MWh',
          },
        },
      ]}
    />
  );
};

export default EnergiesChart;
