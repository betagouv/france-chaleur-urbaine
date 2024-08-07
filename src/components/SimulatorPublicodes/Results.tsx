import React, { ComponentProps, useMemo } from 'react';
import Chart from 'react-google-charts';

import { type SimulatorEngine } from './useSimulatorEngine';

type SimulatorResultsProps = React.HTMLAttributes<HTMLDivElement> & {
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

const emissionsCO2GraphOptions: ComponentProps<typeof Chart>['options'] = {
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
  'Réseaux de chaleur x Collectif',
  'Réseaux de froid x Collectif',
  'Poêle à granulés indiv x Individuel',
  'Chaudière à granulés coll x Collectif',
  'Gaz indiv avec cond x Individuel',
  'Gaz indiv sans cond x Individuel',
  'Gaz coll avec cond x Collectif',
  'Gaz coll sans cond x Collectif',
  'Fioul indiv x Individuel',
  'Fioul coll x Collectif',
  'PAC air-air x Individuel',
  'PAC air-air x Collectif',
  'PAC eau-eau x Individuel',
  'PAC eau-eau x Collectif',
  'PAC air-eau x Individuel',
  'PAC air-eau x Collectif',
  'Radiateur électrique x Individuel',
] as const;

const SimulatorResults: React.FC<SimulatorResultsProps> = ({ children, className, engine, ...props }) => {
  const displayResult = (key: Parameters<typeof engine.getField>[0]) => {
    const rule = engine.getRule(key);

    return (
      <div>
        {key}
        <strong>
          : {engine.getStringField(key)}
          {rule.rawNode.unité ? ` ${rule.rawNode.unité}` : ''}
        </strong>
      </div>
    );
  };

  const emissionsCO2GraphData = useMemo(
    () => [
      [
        'Mode de chauffage',
        'Scope 1 : Besoin de chauffage',
        'Scope 2 : Auxiliaires et combustible électrique',
        'Scope 3 : Émissions indirectes',
      ],
      ...typesInstallation.map((typeInstallation) => [
        typeInstallation,
        engine.getNumberField(`env . Installation x ${typeInstallation} . besoins de chauffage`) +
          engine.getNumberField(`env . Installation x ${typeInstallation} . besoins d'ECS`),
        engine.getNumberField(`env . Installation x ${typeInstallation} . auxiliaires et combustible électrique`) +
          engine.getNumberField(`env . Installation x ${typeInstallation} . ECS solaire thermique`) +
          engine.getNumberField(`env . Installation x ${typeInstallation} . ECS avec ballon électrique`),
        engine.getNumberField(`env . Installation x ${typeInstallation} . Scope 3`),
      ]),
    ],
    []
  );

  return (
    <div className={className} {...props}>
      Ici, on retrouve les résultats
      <h2 className="fr-mt-2w fr-mb-0">Paramètres généraux</h2>
      {displayResult('mode affichage')}
      {displayResult('type de bâtiment')}
      <h3 className="fr-mt-2w fr-mb-0">Département</h3>
      {displayResult('département')}
      {displayResult('code département')}
      {displayResult('degré jours unifié spécifique chaud')}
      {displayResult('degré jours unifié spécifique froid')}
      {displayResult('zone climatique')}
      {displayResult('température de référence chaud')}
      {displayResult('augmenter la température de chauffe')}
      <h2>Autre</h2>
      <Chart
        height="400px"
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

export default SimulatorResults;
