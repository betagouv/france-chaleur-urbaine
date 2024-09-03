import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl';
import { useQueryState } from 'nuqs';
import React from 'react';
import Chart from 'react-google-charts';
import styled from 'styled-components';

import Accordion from '@components/ui/Accordion';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Icon from '@components/ui/Icon';
import useArrayQueryState from '@hooks/useArrayQueryState';
import cx from '@utils/cx';

import { ChartPlaceholder } from './SimulatorPublicodes.style';
import { type SimulatorEngine } from './useSimulatorEngine';

type GraphProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const commonGraphOptions: React.ComponentProps<typeof Chart>['options'] = {
  chartArea: { width: '100%', top: 0, bottom: 100 },
  isStacked: true,
  // allows pan and zoom
  explorer: {
    keepInBounds: true,
  },
  vAxis: {
    // cache les modes de chauffage
    textPosition: 'none',
  },
  legend: { position: 'bottom' },
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

const typesInstallation = [
  {
    label: 'Réseaux de chaleur',
    emissionsCO2PublicodesKey: 'Réseaux de chaleur x Collectif',
    coutPublicodeKey: 'Réseaux de chaleur',
  },
  {
    label: 'Réseaux de froid',
    emissionsCO2PublicodesKey: 'Réseaux de froid x Collectif',
    coutPublicodeKey: 'Réseaux de froid',
  },
  {
    label: 'Poêle à granulés individuel',
    emissionsCO2PublicodesKey: 'Poêle à granulés indiv x Individuel',
    coutPublicodeKey: 'Poêle à granulés indiv',
  },
  {
    label: 'Chaudière à granulés collectif',
    emissionsCO2PublicodesKey: 'Chaudière à granulés coll x Collectif',
    coutPublicodeKey: 'Chaudière à granulés coll',
  },
  {
    label: 'Gaz individuel avec condensateur',
    emissionsCO2PublicodesKey: 'Gaz indiv avec cond x Individuel',
    coutPublicodeKey: 'Gaz indiv avec cond',
  },
  {
    label: 'Gaz individuel sans condensateur',
    emissionsCO2PublicodesKey: 'Gaz indiv sans cond x Individuel',
    coutPublicodeKey: 'Gaz indiv sans cond',
  },
  {
    label: 'Gaz collectif avec condensateur',
    emissionsCO2PublicodesKey: 'Gaz coll avec cond x Collectif',
    coutPublicodeKey: 'Gaz coll avec cond',
  },
  {
    label: 'Gaz collectif sans condensateur',
    emissionsCO2PublicodesKey: 'Gaz coll sans cond x Collectif',
    coutPublicodeKey: 'Gaz coll sans cond',
  },
  {
    label: 'Fioul individuel',
    emissionsCO2PublicodesKey: 'Fioul indiv x Individuel',
    coutPublicodeKey: 'Fioul indiv',
  },
  {
    label: 'Fioul collectif',
    emissionsCO2PublicodesKey: 'Fioul coll x Collectif',
    coutPublicodeKey: 'Fioul coll',
  },
  {
    label: 'PAC air-air individuel',
    emissionsCO2PublicodesKey: 'PAC air-air x Individuel',
    coutPublicodeKey: 'PAC air-air indiv',
  },
  {
    label: 'PAC air-air collectif / tertiaire',
    emissionsCO2PublicodesKey: 'PAC air-air x Collectif',
    coutPublicodeKey: 'PAC eau-eau indiv',
  },
  {
    label: 'PAC eau-eau individuel',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Individuel',
    coutPublicodeKey: 'PAC air-eau indiv',
  },
  {
    label: 'PAC eau-eau collectif / tertiaire',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Collectif',
    coutPublicodeKey: 'PAC air-air coll',
  },
  {
    label: 'PAC air-eau individuel',
    emissionsCO2PublicodesKey: 'PAC air-eau x Individuel',
    coutPublicodeKey: 'PAC eau-eau coll',
  },
  {
    label: 'PAC air-eau collectif / tertiaire',
    emissionsCO2PublicodesKey: 'PAC air-eau x Collectif',
    coutPublicodeKey: 'PAC air-eau coll',
  },
  {
    label: 'Radiateur électrique',
    emissionsCO2PublicodesKey: 'Radiateur électrique x Individuel',
    coutPublicodeKey: 'Radiateur électrique',
  },
] as const;

const Graph: React.FC<GraphProps> = ({ engine, className, ...props }) => {
  const { has, toggle, items: removedCompared } = useArrayQueryState('remove-compared');
  const [graphType, setGraphType] = useQueryState('graph', { defaultValue: 'couts' });

  const coutGraphData = [
    ['Mode de chauffage', { role: 'annotation' }, 'P1 abo', 'P1 conso', "P1'", 'P1 ECS', 'P2', 'P3', 'P4 moins aides', 'aides'],
    ...typesInstallation
      .filter((typeInstallation) => !has(typeInstallation.coutPublicodeKey))
      .flatMap((typeInstallation) => [
        ['', typeInstallation.label, 0, 0, 0, 0, 0, 0, 0, 0],
        [
          typeInstallation.label,
          '',
          engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût du combustible abonnement`),
          engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût du combustible consommation`),
          engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût électricité auxiliaire`),
          engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût combustible pour ballon ECS à accumulation`),
          engine.getFieldAsNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${typeInstallation.coutPublicodeKey} . petit entretien P2`),
          engine.getFieldAsNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${typeInstallation.coutPublicodeKey} . gros entretien P3`),
          // TODO manque les différents types d'installation avec élec ou solaire
          engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P4 moins aides`),
          engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . aides`),
        ],
      ]),
  ];
  const emissionsCO2GraphData = [
    [
      'Mode de chauffage',
      { role: 'annotation' },
      "Scope 1 : Production directe d'énergie",
      "Scope 2 : Production indirecte d'énergie",
      'Scope 3 : Émissions indirectes',
    ],
    ...typesInstallation
      .filter((typeInstallation) => !has(typeInstallation.coutPublicodeKey))
      .flatMap((typeInstallation) => [
        ['', typeInstallation.label, 0, 0, 0],
        [
          typeInstallation.label,
          '',
          engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 1`),
          engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 2`),
          engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 3`),
        ],
      ]),
  ];

  const comparisonCount = typesInstallation.length - removedCompared.length;
  const chartHeight = comparisonCount * 60 + 100;

  return (
    <div className={cx(className)} {...props}>
      <Accordion
        className="fr-mb-2w"
        label={
          <FilterLabel>
            <Icon name="ri-filter-2-fill" className="fr-mr-2" />
            <span>Comparaison</span>
            <strong className="fr-badge fr-mr-2">{comparisonCount}</strong>
          </FilterLabel>
        }
      >
        <Checkbox
          orientation="horizontal"
          options={typesInstallation.map((typeInstallation) => ({
            label: typeInstallation.label,
            nativeInputProps: {
              onClick: () => toggle(typeInstallation.coutPublicodeKey),
              checked: !has(typeInstallation.coutPublicodeKey),
            },
          }))}
          small
        />
      </Accordion>
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
            legendToggle
            chartType="BarChart"
            height="100%"
            chartLanguage="FR-fr"
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
