import React from 'react';
import Chart from 'react-google-charts';

import cx from '@utils/cx';

import { type SimulatorEngine } from './useSimulatorEngine';
type GraphProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

// const coutGraphOptions: ComponentProps<typeof Chart>['options'] = {
//   title: 'Décomposition du coût global chauffage & ECS',
//   chartArea: { width: '50%' },
//   isStacked: true,
//   colors: ['#FF5655', '#0063CB', '#27A658'],
//   legend: { position: 'top' },
//   hAxis: {
//     title: 'Coût €TCC/logement par an',
//     minValue: 0,
//     format: '# €',
//   },
//   vAxis: {
//     title: 'Mode de chauffage',
//   },
// };

const emissionsCO2GraphOptions: React.ComponentProps<typeof Chart>['options'] = {
  title: 'Émissions annuelles de CO2',
  chartArea: { width: '50%' },
  isStacked: true,
  colors: ['#2a7777', '#e30613', '#898989'],
  // legend: { position: 'top' },
  hAxis: {
    title: 'Emissions (kgCO2 équ.)',
    minValue: 0,
    // format: '# kgCO2 équ.',
  },
  vAxis: {
    title: 'Mode de chauffage',
  },
};

const typesInstallation = [
  {
    label: 'Réseaux de chaleur',
    publicodesKey: 'Réseaux de chaleur x Collectif',
  },
  {
    label: 'Réseaux de froid',
    publicodesKey: 'Réseaux de froid x Collectif',
  },
  {
    label: 'Poêle à granulés indiv',
    publicodesKey: 'Poêle à granulés indiv x Individuel',
  },
  {
    label: 'Chaudière à granulés coll',
    publicodesKey: 'Chaudière à granulés coll x Collectif',
  },
  {
    label: 'Gaz indiv avec cond',
    publicodesKey: 'Gaz indiv avec cond x Individuel',
  },
  {
    label: 'Gaz indiv sans cond',
    publicodesKey: 'Gaz indiv sans cond x Individuel',
  },
  {
    label: 'Gaz coll avec cond',
    publicodesKey: 'Gaz coll avec cond x Collectif',
  },
  {
    label: 'Gaz coll sans cond',
    publicodesKey: 'Gaz coll sans cond x Collectif',
  },
  {
    label: 'Fioul indiv',
    publicodesKey: 'Fioul indiv x Individuel',
  },
  {
    label: 'Fioul coll',
    publicodesKey: 'Fioul coll x Collectif',
  },
  {
    label: 'PAC air-air indiv',
    publicodesKey: 'PAC air-air x Individuel',
  },
  {
    label: 'PAC air-air coll / tertiaire',
    publicodesKey: 'PAC air-air x Collectif',
  },
  {
    label: 'PAC eau-eau indiv',
    publicodesKey: 'PAC eau-eau x Individuel',
  },
  {
    label: 'PAC eau-eau coll / tertiaire',
    publicodesKey: 'PAC eau-eau x Collectif',
  },
  {
    label: 'PAC air-eau indiv',
    publicodesKey: 'PAC air-eau x Individuel',
  },
  {
    label: 'PAC air-eau coll / tertiaire',
    publicodesKey: 'PAC air-eau x Collectif',
  },
  {
    label: 'Radiateur électrique',
    publicodesKey: 'Radiateur électrique x Individuel',
  },
] as const;

const Graph: React.FC<GraphProps> = ({ engine, className, ...props }) => {
  const emissionsCO2GraphData = [
    [
      'Mode de chauffage',
      'Scope 1 : Besoin de chauffage',
      'Scope 2 : Auxiliaires et combustible électrique',
      'Scope 3 : Émissions indirectes',
    ],
    ...typesInstallation.map((typeInstallation) => [
      typeInstallation.label,
      engine.getFieldAsNumber(`env . Installation x ${typeInstallation.publicodesKey} . besoins de chauffage`) +
        engine.getFieldAsNumber(`env . Installation x ${typeInstallation.publicodesKey} . besoins d'ECS`),
      engine.getFieldAsNumber(`env . Installation x ${typeInstallation.publicodesKey} . auxiliaires et combustible électrique`) +
        engine.getFieldAsNumber(`env . Installation x ${typeInstallation.publicodesKey} . ECS solaire thermique`) +
        engine.getFieldAsNumber(`env . Installation x ${typeInstallation.publicodesKey} . ECS avec ballon électrique`),
      engine.getFieldAsNumber(`env . Installation x ${typeInstallation.publicodesKey} . Scope 3`),
    ]),
  ];

  return (
    <div className={cx(className)} {...props}>
      <Chart
        height="600px"
        width="100%"
        chartType="BarChart"
        chartLanguage="FR-fr"
        loader={<div>Chargement du graphe...</div>}
        data={emissionsCO2GraphData}
        options={emissionsCO2GraphOptions}
      />
    </div>
  );
};

export default Graph;
