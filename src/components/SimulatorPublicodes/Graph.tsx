import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import React from 'react';
import Chart from 'react-google-charts';
import styled from 'styled-components';

import Accordion from '@components/ui/Accordion';
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

const coutGraphOptions: React.ComponentProps<typeof Chart>['options'] = {
  title: 'Décomposition du coût global chauffage & ECS',
  chartArea: { width: '50%' },
  isStacked: true,
  // colors: ['#FF5655', '#0063CB', '#27A658'],
  // legend: { position: 'top' },
  hAxis: {
    title: 'Coût €TTC/logement par an',
    minValue: 0,
    format: '# €',
  },
  vAxis: {
    title: 'Mode de chauffage',
  },
};

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
    emissionsCO2PublicodesKey: 'Réseaux de chaleur x Collectif',
    coutPublicodeKey: 'Réseaux de chaleur',
  },
  {
    label: 'Réseaux de froid',
    emissionsCO2PublicodesKey: 'Réseaux de froid x Collectif',
    coutPublicodeKey: 'Réseaux de froid',
  },
  {
    label: 'Poêle à granulés indiv',
    emissionsCO2PublicodesKey: 'Poêle à granulés indiv x Individuel',
    coutPublicodeKey: 'Poêle à granulés indiv',
  },
  {
    label: 'Chaudière à granulés coll',
    emissionsCO2PublicodesKey: 'Chaudière à granulés coll x Collectif',
    coutPublicodeKey: 'Chaudière à granulés coll',
  },
  {
    label: 'Gaz indiv avec cond',
    emissionsCO2PublicodesKey: 'Gaz indiv avec cond x Individuel',
    coutPublicodeKey: 'Gaz indiv avec cond',
  },
  {
    label: 'Gaz indiv sans cond',
    emissionsCO2PublicodesKey: 'Gaz indiv sans cond x Individuel',
    coutPublicodeKey: 'Gaz indiv sans cond',
  },
  {
    label: 'Gaz coll avec cond',
    emissionsCO2PublicodesKey: 'Gaz coll avec cond x Collectif',
    coutPublicodeKey: 'Gaz coll avec cond',
  },
  {
    label: 'Gaz coll sans cond',
    emissionsCO2PublicodesKey: 'Gaz coll sans cond x Collectif',
    coutPublicodeKey: 'Gaz coll sans cond',
  },
  {
    label: 'Fioul indiv',
    emissionsCO2PublicodesKey: 'Fioul indiv x Individuel',
    coutPublicodeKey: 'Fioul indiv',
  },
  {
    label: 'Fioul coll',
    emissionsCO2PublicodesKey: 'Fioul coll x Collectif',
    coutPublicodeKey: 'Fioul coll',
  },
  {
    label: 'PAC air-air indiv',
    emissionsCO2PublicodesKey: 'PAC air-air x Individuel',
    coutPublicodeKey: 'PAC air-air indiv',
  },
  {
    label: 'PAC air-air coll / tertiaire',
    emissionsCO2PublicodesKey: 'PAC air-air x Collectif',
    coutPublicodeKey: 'PAC eau-eau indiv',
  },
  {
    label: 'PAC eau-eau indiv',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Individuel',
    coutPublicodeKey: 'PAC air-eau indiv',
  },
  {
    label: 'PAC eau-eau coll / tertiaire',
    emissionsCO2PublicodesKey: 'PAC eau-eau x Collectif',
    coutPublicodeKey: 'PAC air-air coll',
  },
  {
    label: 'PAC air-eau indiv',
    emissionsCO2PublicodesKey: 'PAC air-eau x Individuel',
    coutPublicodeKey: 'PAC eau-eau coll',
  },
  {
    label: 'PAC air-eau coll / tertiaire',
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

  const coutGraphData = [
    ['Mode de chauffage', 'P1 abo', 'P1 conso', "P1'", 'P1 ECS', 'P2', 'P3', 'P4 moins aides', 'aides'],
    ...typesInstallation
      .filter((typeInstallation) => !has(typeInstallation.coutPublicodeKey))
      .map((typeInstallation) => [
        typeInstallation.label,
        engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût du combustible abonnement`),
        engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût du combustible consommation`),
        engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût électricité auxiliaire`),
        engine.getFieldAsNumber(`Calcul Eco . ${typeInstallation.coutPublicodeKey} . Coût combustible pour ballon ECS à accumulation`),
        engine.getFieldAsNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${typeInstallation.coutPublicodeKey} . petit entretien P2`),
        engine.getFieldAsNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${typeInstallation.coutPublicodeKey} . gros entretien P3`),
        // TODO manque les différents types d'installation avec élec ou solaire
        engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P4 moins aides`),
        engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . aides`),
      ]),
  ];
  const emissionsCO2GraphData = [
    [
      'Mode de chauffage',
      "Scope 1 : Production directe d'énergie",
      "Scope 2 : Production indirecte d'énergie",
      'Scope 3 : Émissions indirectes',
    ],
    ...typesInstallation
      .filter((typeInstallation) => !has(typeInstallation.coutPublicodeKey))
      .map((typeInstallation) => [
        typeInstallation.label,
        engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 1`),
        engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 2`),
        engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 3`),
      ]),
  ];

  return (
    <div className={cx(className)} {...props}>
      <Accordion
        label={
          <FilterLabel>
            <Icon name="ri-filter-2-fill" className="fr-mr-2" />
            <span>Comparaison</span>
            <strong className="fr-badge fr-mr-2">{typesInstallation.length - removedCompared.length}</strong>
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

      <Chart
        legendToggle
        height="600px"
        width="100%"
        chartType="BarChart"
        chartLanguage="FR-fr"
        loader={
          <ChartPlaceholder>
            Chargement du graphe...
            <br />
            <strong>{coutGraphOptions.title}</strong>
          </ChartPlaceholder>
        }
        data={coutGraphData}
        options={coutGraphOptions}
      />
      <Chart
        height="600px"
        width="100%"
        chartType="BarChart"
        chartLanguage="FR-fr"
        loader={
          <ChartPlaceholder>
            Chargement du graphe...
            <br />
            <strong>{emissionsCO2GraphOptions.title}</strong>
          </ChartPlaceholder>
        }
        data={emissionsCO2GraphData}
        options={emissionsCO2GraphOptions}
      />
    </div>
  );
};

export default Graph;
