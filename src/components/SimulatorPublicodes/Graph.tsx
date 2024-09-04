import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl';
import { useQueryState } from 'nuqs';
import React from 'react';
import Chart from 'react-google-charts';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import useArrayQueryState from '@hooks/useArrayQueryState';
import cx from '@utils/cx';

import { modesDeChauffage } from './modes-de-chauffage';
import { ChartPlaceholder } from './SimulatorPublicodes.style';
import { type SimulatorEngine } from './useSimulatorEngine';

type GraphProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
  proMode?: boolean;
};

const estimatedRowHeightPx = 56;
const estimatedBaseGraphHeightPx = 150;

const commonGraphOptions: React.ComponentProps<typeof Chart>['options'] = {
  chartArea: {
    width: '100%',
    top: 80, // espace pour afficher la légende
    bottom: 60, // espace pour afficher les abscisses
    right: 20, // to display the total price without being cut
  },
  annotations: {
    textStyle: {
      color: 'black',
      fontSize: 16,
      bold: true,
    },
    alwaysOutside: false,
  },
  isStacked: true,
  vAxis: {
    // cache les modes de chauffage
    textPosition: 'none',
  },
  legend: { position: 'top', maxLines: 3 },
};

const colorP1Abo = '#A558A0';
const colorP1Conso = '#465F9D';
const colorP1ECS = '#465FBD';
const colorP1prime = '#C08C65';
const colorP2 = '#DA8C65';
const colorP3 = '#EA8C65';
const colorP4SansAides = '#D1B781';
const colorP4Aides = '#D5B781';

const emissionsCO2GraphOptions: React.ComponentProps<typeof Chart>['options'] = {
  ...commonGraphOptions,
  colors: ['#2a7777', '#e30613', '#898989'],
  hAxis: {
    title: 'Émissions (kgCO2 équ.)',
    minValue: 0,
    // format: '# kgCO2 équ.',
  },
};

const getBarStyle = (color: string) => `color: ${color}; stroke-color: ${color}; stroke-opacity: 1; stroke-width: 1;`;

const Graph: React.FC<GraphProps> = ({ proMode, engine, className, ...props }) => {
  const { has: hasModeDeChauffage, items: selectedModesDeChauffage } = useArrayQueryState('modes-de-chauffage');

  const columns = proMode
    ? [
        'P1 abo',
        { role: 'style' },
        'P1 conso',
        { role: 'style' },
        'P1 ECS',
        { role: 'style' },
        "P1'",
        { role: 'style' },
        'P2',
        { role: 'style' },
        'P3',
        { role: 'style' },
        'P4 moins aides',
        { role: 'style' },
        'aides',
        { role: 'style' },
      ]
    : [
        'Abonnement',
        { role: 'style' },
        'Consommation',
        { role: 'style' },
        'Maintenance',
        { role: 'style' },
        'Investissement',
        { role: 'style' },
        'Aides',
        { role: 'style' },
      ];

  const colors = proMode
    ? [colorP1Abo, colorP1Conso, colorP1ECS, colorP1prime, colorP2, colorP3, colorP4SansAides, colorP4Aides]
    : [colorP1Abo, colorP1Conso, colorP1prime, colorP4SansAides, colorP4Aides];

  const coutGraphOptions: React.ComponentProps<typeof Chart>['options'] = {
    ...commonGraphOptions,
    hAxis: {
      title: 'Coût €TTC/logement par an',
      minValue: 0,
      format: '# €',
    },
    colors,
  };
  const [graphType, setGraphType] = useQueryState('graph', { defaultValue: 'couts' });

  const coutGraphData = [
    ['Mode de chauffage', { role: 'annotation' }, ...columns, { role: 'annotation' }],
    ...modesDeChauffage
      .filter((typeInstallation) => hasModeDeChauffage(typeInstallation.label))
      .flatMap((typeInstallation) => {
        const amountP1Abo = engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût du combustible abonnement`);
        const amountP1Conso = engine.getFieldAsNumber(
          `Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût du combustible consommation`
        );
        const amountP1ECS = engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût électricité auxiliaire`);
        const amountP1prime = engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût électricité auxiliaire`);
        const amountP2 = engine.getFieldAsNumber(
          `Calcul Eco . P2 P3 Coût de l'entretien . ${typeInstallation.coutPublicodeKey} . petit entretien P2`
        );
        // TODO manque les différents types d'installation avec élec ou solaire
        const amountP3 = engine.getFieldAsNumber(
          `Calcul Eco . P2 P3 Coût de l'entretien . ${typeInstallation.coutPublicodeKey} . gros entretien P3`
        );
        const amountP4SansAides = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P4 moins aides`);
        const amountAides = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . aides`);

        const amounts = proMode
          ? [
              amountP1Abo,
              getBarStyle(colorP1Abo),
              amountP1Conso,
              getBarStyle(colorP1Conso),
              amountP1ECS,
              getBarStyle(colorP1ECS),
              amountP1prime,
              getBarStyle(colorP1prime),
              amountP2,
              getBarStyle(colorP2),
              amountP3,
              // TODO manque les différents types d'installation avec élec ou solaire
              getBarStyle(colorP3),
              amountP4SansAides,
              getBarStyle(colorP4SansAides),
              amountAides,
              `${getBarStyle(colorP4Aides)};fill-opacity: 0.1;`,
            ]
          : [
              amountP1Abo,
              getBarStyle(colorP1Abo),
              amountP1Conso + amountP1ECS,
              getBarStyle(colorP1Conso),
              amountP1prime + amountP2 + amountP3,
              getBarStyle(colorP3),
              amountP4SansAides,
              getBarStyle(colorP4SansAides),
              amountAides,
              `${getBarStyle(colorP4Aides)};fill-opacity: 0.1;`,
            ];

        const totalAmount = (amounts.filter((amount) => !Number.isNaN(+amount)) as number[])
          .reduce((acc, amount) => acc + amount, 0)
          .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

        return [
          [' ', typeInstallation.label, ...amounts.map((amount) => (Number.isNaN(+amount) ? '' : 0)), ''],
          [typeInstallation.label, '', ...amounts, totalAmount],
        ];
      }),
  ];

  const emissionsCO2GraphData = [
    [
      'Mode de chauffage',
      { role: 'annotation' },
      "Scope 1 : Production directe d'énergie",
      "Scope 2 : Production indirecte d'énergie",
      'Scope 3 : Émissions indirectes',
    ],
    ...modesDeChauffage
      .filter((typeInstallation) => hasModeDeChauffage(typeInstallation.label))
      .flatMap((typeInstallation) => {
        const amounts = [
          engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 1`),
          engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 2`),
          engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 3`),
        ];

        const totalAmount = amounts
          .reduce((acc, amount) => acc + amount, 0)
          .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

        return [
          ['', `${typeInstallation.label} (${totalAmount})`, 0, 0, 0],
          [typeInstallation.label, '', ...amounts],
        ];
      }),
  ];

  const chartHeight = selectedModesDeChauffage.length * estimatedRowHeightPx + estimatedBaseGraphHeightPx;

  return (
    <div className={cx(className)} {...props}>
      <Box textAlign="right" mb="1w">
        <SegmentedControl
          hideLegend
          segments={[
            {
              label: 'Coûts du chauffage',
              nativeInputProps: {
                checked: graphType === 'couts',
                onChange: () => setGraphType('couts'),
              },
            },
            {
              label: 'Émissions de CO2',
              nativeInputProps: {
                checked: graphType === 'emissions',
                onChange: () => setGraphType('emissions'),
              },
            },
          ]}
        />
      </Box>

      {graphType === 'couts' && (
        <>
          <Heading as="h6">Coût global annuel chauffage</Heading>
          <Chart
            chartType="BarChart"
            height="100%"
            chartLanguage="FR-fr"
            // désactive le clic sur la légende qui masque les barres + le style sélection
            chartEvents={[
              {
                eventName: 'select',
                callback: ({ chartWrapper }) => {
                  (chartWrapper.getChart() as any).setSelection();
                },
              },
            ]}
            loader={<ChartPlaceholder>Chargement du graphe...</ChartPlaceholder>}
            data={coutGraphData}
            options={{
              ...coutGraphOptions,
              height: chartHeight, // dynamic height https://github.com/rakannimer/react-google-charts/issues/385
            }}
          />
        </>
      )}
      {graphType === 'emissions' && (
        <>
          <Heading as="h6">Émissions annuelles de CO2</Heading>
          <Chart
            chartType="BarChart"
            height="100%"
            chartLanguage="FR-fr"
            // désactive le clic sur la légende qui masque les barres + le style sélection
            chartEvents={[
              {
                eventName: 'select',
                callback: ({ chartWrapper }) => {
                  (chartWrapper.getChart() as any).setSelection();
                },
              },
            ]}
            loader={<ChartPlaceholder>Chargement du graphe...</ChartPlaceholder>}
            data={emissionsCO2GraphData}
            options={{
              ...emissionsCO2GraphOptions,
              height: chartHeight, // dynamic height https://github.com/rakannimer/react-google-charts/issues/385
            }}
          />
        </>
      )}
    </div>
  );
};

export default Graph;
