import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl';
import { useQueryState } from 'nuqs';
import React, { useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import Chart from 'react-google-charts';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import useArrayQueryState from '@hooks/useArrayQueryState';
import { deepMergeObjects } from '@utils/core';
import cx from '@utils/cx';

import { ChartPlaceholder, GraphTooltip } from './ComparateurPublicodes.style';
import { modesDeChauffage } from './modes-de-chauffage';
import { Logos } from './Placeholder';
import { type SimulatorEngine } from './useSimulatorEngine';

const precisionDisplay = 10 / 100;
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
  },
  annotations: {
    textStyle: {
      color: 'black',
      fontSize: 16,
      bold: true,
    },
    alwaysOutside: false,
    stem: {
      color: 'transparent',
    },
  },
  isStacked: true,
  vAxis: {
    // cache les modes de chauffage
    textPosition: 'none',
  },
  tooltip: { isHtml: true },
  legend: { position: 'top', maxLines: 3 },
};

// graph coûts
const colorP1Abo = '#FCC63A';
const colorP1Conso = '#FC8162';
const colorP1ECS = '#F2535E';
const colorP1Consofroid = '#0077be';
const colorP1prime = '#51D1DC';
const colorP2 = '#475DA1';
const colorP3 = '#99C221';
const colorP4SansAides = '#7B467C';
const colorP4Aides = '#7B467C';

// graph émissions CO2
const colorScope1 = '#99C221';
const colorScope2 = '#426429';
const colorScope3 = '#4EC8AE';

const getBarStyle = (color: string, { bordered }: { bordered?: boolean } = {}) =>
  `color: ${color}; stroke-color: ${color}; stroke-opacity: 1; stroke-width: 1;${bordered ? 'fill-opacity: 0.1;' : ''}`;

interface TooltipProps {
  title: string;
  color: string;
  amount: number;
  bordered?: boolean;
  valueFormatter: (value: number) => React.ReactNode;
}

const getTooltip = ({ title, amount, color, bordered, valueFormatter }: TooltipProps) =>
  ReactDOMServer.renderToString(
    <GraphTooltip>
      <span style={bordered ? { border: `2px solid ${color}` } : { backgroundColor: color }}></span>
      <span>{title}</span>
      <strong style={{ whiteSpace: 'nowrap' }}>{valueFormatter(amount)}</strong>
    </GraphTooltip>
  );

const getColumn = (title: string) => [title, { role: 'style' }, { type: 'string', role: 'tooltip', p: { html: true } }];

const getRow = ({ title, amount, color, bordered, valueFormatter }: TooltipProps) => [
  amount,
  getBarStyle(color, { bordered }),
  getTooltip({ title, amount, color, bordered, valueFormatter }),
];

const emissionsCO2GraphColumnNames = [
  "Scope 1 : Production directe d'énergie",
  "Scope 2 : Production indirecte d'énergie",
  'Scope 3 : Émissions indirectes',
];
const emissionsCO2GraphColumns = emissionsCO2GraphColumnNames.map(getColumn).flat();

const useFixLegendOpacity = (coutsRef: React.RefObject<HTMLDivElement>) => {
  React.useEffect(() => {
    if (!coutsRef?.current) {
      return;
    }

    const applyChanges = () => {
      const legendBox = coutsRef?.current?.querySelector('g g:last-child rect:last-child');

      if (legendBox) {
        legendBox.setAttribute('fill-opacity', '0.1');

        legendBox.setAttribute('stroke', colorP4Aides);
        legendBox.setAttribute('stroke-width', '1');
      }
    };

    applyChanges();

    // HACK: reapply changes as they may be overriden
    const intervalId = setInterval(() => applyChanges(), 20);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  });
};

const formatPrecisionRange = (value: number) => {
  // as calculations are approximations, give a +-10% range
  const lowerBound = Math.round((value * (1 - precisionDisplay)) / 10) * 10;
  const upperBound = Math.round((value * (1 + precisionDisplay)) / 10) * 10;

  const lowerBoundStr = lowerBound.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const upperBoundStr = upperBound.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  return `${lowerBoundStr} - ${upperBoundStr}`;
};

const formatEmissionsCO2 = (value: number) => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kgCO2e`;

const Graph: React.FC<GraphProps> = ({ proMode, engine, className, ...props }) => {
  const { has: hasModeDeChauffage, items: selectedModesDeChauffage } = useArrayQueryState('modes-de-chauffage');
  const coutsRef = useRef<HTMLDivElement>(null);
  useFixLegendOpacity(coutsRef);

  const coutGraphColumnNames = proMode
    ? ['P1 abo', 'P1 conso', 'P1 ECS', "P1'", 'P1 conso froid', 'P2', 'P3', 'P4 moins aides', 'aides']
    : ['Abonnement', 'Consommation', 'Maintenance', 'Investissement', 'Aides'];

  const coutGraphColumns = coutGraphColumnNames.map(getColumn).flat();

  const coutGraphColors = proMode
    ? [colorP1Abo, colorP1Conso, colorP1ECS, colorP1prime, colorP1Consofroid, colorP2, colorP3, colorP4SansAides, colorP4Aides]
    : [colorP1Abo, colorP1Conso, colorP1prime, colorP4SansAides, colorP4Aides];

  const [graphType, setGraphType] = useQueryState('graph', { defaultValue: 'couts' });
  const inclusClimatisation = engine.getField('Inclure la climatisation');

  const filterDisplayableModesDeChauffage = (typeInstallation: (typeof modesDeChauffage)[number]) => {
    if (!hasModeDeChauffage(typeInstallation.label)) {
      return false;
    }

    if (!inclusClimatisation && typeInstallation.seulementFroid) {
      return false;
    }
    return true;
  };

  const getLabel = (typeInstallation: (typeof modesDeChauffage)[number]) => {
    return typeInstallation.reversible && inclusClimatisation ? `${typeInstallation.label} (chauffage + froid)` : typeInstallation.label;
  };

  let maxCoutValue = 3000;
  const coutGraphData = [
    ['Mode de chauffage', { role: 'annotation' }, ...coutGraphColumns, { role: 'annotation' }],
    ...modesDeChauffage.filter(filterDisplayableModesDeChauffage).flatMap((typeInstallation) => {
      const amountP1Abo = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1abo`);
      const amountP1Conso = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1conso`);
      const amountP1ECS = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1ECS`);
      const amountP1prime = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1prime`);
      const amountP1Consofroid = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1Consofroid`);
      const amountP2 = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P2`);
      const amountP3 = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P3`);
      const amountP4SansAides = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P4 moins aides`);
      const amountAides = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . aides`);

      const amounts = proMode
        ? [
            ...getRow({ title: 'P1 abo', amount: amountP1Abo, color: colorP1Abo, valueFormatter: formatPrecisionRange }),
            ...getRow({ title: 'P1 conso', amount: amountP1Conso, color: colorP1Conso, valueFormatter: formatPrecisionRange }),
            ...getRow({ title: 'P1 ECS', amount: amountP1ECS, color: colorP1ECS, valueFormatter: formatPrecisionRange }),
            ...getRow({ title: "P1'", amount: amountP1prime, color: colorP1prime, valueFormatter: formatPrecisionRange }),
            ...getRow({ title: "P1'", amount: amountP1Consofroid, color: colorP1Consofroid, valueFormatter: formatPrecisionRange }),
            ...getRow({ title: 'P2', amount: amountP2, color: colorP2, valueFormatter: formatPrecisionRange }),
            ...getRow({ title: 'P3', amount: amountP3, color: colorP3, valueFormatter: formatPrecisionRange }),
            ...getRow({
              title: 'P4 moins aides',
              amount: amountP4SansAides,
              color: colorP4SansAides,
              valueFormatter: formatPrecisionRange,
            }),
            ...getRow({ title: 'aides', amount: amountAides, color: colorP4Aides, bordered: true, valueFormatter: formatPrecisionRange }),
          ]
        : [
            ...getRow({ title: 'Abonnement', amount: amountP1Abo, color: colorP1Abo, valueFormatter: formatPrecisionRange }),
            ...getRow({
              title: 'Consommation',
              amount: amountP1Conso + amountP1ECS,
              color: colorP1Conso,
              valueFormatter: formatPrecisionRange,
            }),
            ...getRow({
              title: 'Maintenance',
              amount: amountP1prime + amountP2 + amountP3,
              color: colorP1prime,
              valueFormatter: formatPrecisionRange,
            }),
            ...getRow({
              title: 'Investissement',
              amount: amountP4SansAides,
              color: colorP4SansAides,
              valueFormatter: formatPrecisionRange,
            }),
            ...getRow({ title: 'Aides', amount: amountAides, color: colorP4Aides, bordered: true, valueFormatter: formatPrecisionRange }),
          ];

      const totalAmountWithAides = (amounts.filter((amount) => !Number.isNaN(+amount)) as number[]).reduce(
        (acc, amount) => acc + amount,
        0
      );
      const totalAmount = totalAmountWithAides - amountAides;
      const precisionRange = formatPrecisionRange(totalAmount);
      maxCoutValue = Math.max(maxCoutValue, totalAmount);
      return [
        [' ', getLabel(typeInstallation), ...amounts.map((amount) => (Number.isNaN(+amount) ? '' : 0)), ''],
        [getLabel(typeInstallation), '', ...amounts, precisionRange],
      ];
    }),
  ];

  const coutGraphOptions: React.ComponentProps<typeof Chart>['options'] = deepMergeObjects(commonGraphOptions, {
    chartArea: {
      right: 130, // to display the total price without being cut (4 digits + unit)
    },
    hAxis: {
      title: 'Coût €TTC/logement par an',
      minValue: 0,
      maxValue: maxCoutValue,
    },
    colors: coutGraphColors,
  });

  let maxEmissionsCO2Value = 5000;

  const emissionsCO2GraphData = [
    ['Mode de chauffage', { role: 'annotation' }, ...emissionsCO2GraphColumns, { type: 'string', role: 'annotation' }],
    ...modesDeChauffage.filter(filterDisplayableModesDeChauffage).flatMap((typeInstallation) => {
      const amounts = [
        ...getRow({
          title: "Scope 1 : Production directe d'énergie",
          amount: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 1`),
          color: colorScope1,
          valueFormatter: formatEmissionsCO2,
        }),
        ...getRow({
          title: "Scope 2 : Production indirecte d'énergie",
          amount: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 2`),
          color: colorScope2,
          valueFormatter: formatEmissionsCO2,
        }),
        ...getRow({
          title: 'Scope 3 : Émissions indirectes',
          amount: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 3`),
          color: colorScope3,
          valueFormatter: formatEmissionsCO2,
        }),
      ];

      const totalAmount = (amounts.filter((amount) => !Number.isNaN(+amount)) as number[]).reduce((acc, amount) => acc + amount, 0);
      maxEmissionsCO2Value = Math.max(maxEmissionsCO2Value, totalAmount);

      return [
        ['', `${getLabel(typeInstallation)}`, ...amounts.map((amount) => (Number.isNaN(+amount) ? '' : 0)), ''],
        [getLabel(typeInstallation), '', ...amounts, formatEmissionsCO2(totalAmount)],
      ];
    }),
  ];

  const emissionsCO2GraphOptions: React.ComponentProps<typeof Chart>['options'] = deepMergeObjects(commonGraphOptions, {
    chartArea: {
      right: 130, // to display the total price without being cut (4 digits + unit)
    },
    colors: [colorScope1, colorScope2, colorScope3],
    hAxis: {
      title: 'Émissions (kgCO2e)',
      minValue: 0,
      maxValue: maxEmissionsCO2Value,
    },
  });

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
        <div ref={coutsRef}>
          <Heading as="h6">Coût global annuel chauffage{inclusClimatisation && ' et froid'}</Heading>
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
        </div>
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
      <Logos size="sm" justifyContent="end" />
    </div>
  );
};

export default Graph;
