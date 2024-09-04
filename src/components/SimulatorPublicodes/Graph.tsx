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
};

const estimatedRowHeightPx = 56;
const estimatedBaseGraphHeightPx = 150;

const commonGraphOptions: React.ComponentProps<typeof Chart>['options'] = {
  chartArea: {
    width: '100%',
    top: 80, // espace pour afficher la légende
    bottom: 60, // espace pour afficher les abscisses
  },
  isStacked: true,
  vAxis: {
    // cache les modes de chauffage
    textPosition: 'none',
  },
  legend: { position: 'top', maxLines: 3 },
};

const coutGraphOptions: React.ComponentProps<typeof Chart>['options'] = {
  ...commonGraphOptions,
  // colors: ['#FF5655', '#0063CB', '#27A658'],
  hAxis: {
    title: 'Coût €TTC/logement par an',
    minValue: 0,
    format: '# €',
  },
};

const emissionsCO2GraphOptions: React.ComponentProps<typeof Chart>['options'] = {
  ...commonGraphOptions,
  colors: ['#2a7777', '#e30613', '#898989'],
  hAxis: {
    title: 'Émissions (kgCO2 équ.)',
    minValue: 0,
    // format: '# kgCO2 équ.',
  },
};

const Graph: React.FC<GraphProps> = ({ engine, className, ...props }) => {
  const { has: hasModeDeChauffage, items: selectedModesDeChauffage } = useArrayQueryState('modes-de-chauffage');

  const [graphType, setGraphType] = useQueryState('graph', { defaultValue: 'couts' });

  const coutGraphData = [
    ['Mode de chauffage', { role: 'annotation' }, 'P1 abo', 'P1 conso', "P1'", 'P1 ECS', 'P2', 'P3', 'P4 moins aides', 'aides'],
    ...modesDeChauffage
      .filter((typeInstallation) => hasModeDeChauffage(typeInstallation.label))
      .flatMap((typeInstallation) => {
        const amounts = [
          engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût du combustible abonnement`),
          engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût du combustible consommation`),
          engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût électricité auxiliaire`),
          engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût combustible pour ballon ECS à accumulation`),
          engine.getFieldAsNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${typeInstallation.coutPublicodeKey} . petit entretien P2`),
          engine.getFieldAsNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${typeInstallation.coutPublicodeKey} . gros entretien P3`),
          // TODO manque les différents types d'installation avec élec ou solaire
          engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P4 moins aides`),
          engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . aides`),
        ];

        const totalAmount = amounts
          .reduce((acc, amount) => acc + amount, 0)
          .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

        return [
          ['', `${typeInstallation.label} (${totalAmount})`, 0, 0, 0, 0, 0, 0, 0, 0],
          [typeInstallation.label, '', ...amounts],
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
