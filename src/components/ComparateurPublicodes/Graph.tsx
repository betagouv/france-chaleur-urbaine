import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl';
import dynamic from 'next/dynamic';
import { parseAsBoolean, useQueryState } from 'nuqs';
import React, { Fragment, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import Chart from 'react-google-charts';

import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Notice from '@/components/ui/Notice';
import useArrayQueryState from '@/hooks/useArrayQueryState';
import useScreenshot from '@/hooks/useScreenshot';
import { deepMergeObjects } from '@/utils/core';
import cx from '@/utils/cx';
import type { exportAsXLSX } from '@/utils/export';

import { ChartPlaceholder, GraphTooltip } from './ComparateurPublicodes.style';
import { modesDeChauffage } from './mappings';
import { DataYearDisclaimer, DisclaimerButton, Logos } from './Placeholder';
import type { SimulatorEngine } from './useSimulatorEngine';

const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });
const COST_PRECISION = 10;
const CO2_PRECISION = 5;
const costPrecisionPercentage = COST_PRECISION / 100;
const co2PrecisionPercentage = CO2_PRECISION / 100;

type GraphProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
  advancedMode?: boolean;
  captureImageName?: string;
  export?: Parameters<typeof exportAsXLSX>[1];
  reseauDeChaleur: {
    label?: string;
    hide: boolean;
    hasPriceData: boolean;
  };
};

const estimatedRowHeightPx = 24;
const estimatedLegendAndUnitsHeightPx = 140;

const commonGraphOptions: React.ComponentProps<typeof Chart>['options'] = {
  annotations: {
    alwaysOutside: false,
    stem: {
      color: 'transparent',
    },
    textStyle: {
      bold: true,
      color: 'black',
      fontSize: 16,
    },
  },
  chartArea: {
    bottom: 60, // espace pour afficher les abscisses
    top: 80, // espace pour afficher la légende
    width: '100%',
  },
  isStacked: true,
  legend: { maxLines: 3, position: 'top' },
  tooltip: { isHtml: true },
  vAxis: {
    // cache les modes de chauffage
    textPosition: 'none',
  },
};

const dataYear = 2024;

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
  title: React.ReactNode;
  color: string;
  amount: number;
  bordered?: boolean;
  valueFormatter: (value: number) => React.ReactNode;
}

const getTooltip = ({ title, amount, color, bordered, valueFormatter }: TooltipProps) =>
  ReactDOMServer.renderToString(
    <GraphTooltip>
      <span style={bordered ? { border: `2px solid ${color}` } : { backgroundColor: color }} />
      <div style={{ fontSize: '0.875rem', lineHeight: '1.25rem', margin: '2px 0', maxWidth: '300px' }}>{title}</div>
      <strong style={{ whiteSpace: 'nowrap' }}>{valueFormatter(amount)}</strong>
    </GraphTooltip>
  );

const getColumn = (title: string) => [title, { role: 'style' }, { p: { html: true }, role: 'tooltip', type: 'string' }];

const getRow = ({ title, amount, color, bordered, valueFormatter }: TooltipProps) => [
  amount,
  getBarStyle(color, { bordered }),
  getTooltip({ amount, bordered, color, title, valueFormatter }),
];

const popupTexts = {
  scope1:
    "Émissions liées aux combustibles utilisés pour la production d'énergie, et réalisées directement sur le lieu de la consommation (scope 1)",
  scope2: "Émissions liées à l'utilisation d'énergie non produite sur le site de consommation (scope 2)",
  scope3: "Émissions liées à la fabrication des équipements, et non directement à la production d'énergie (scope 3)",
};

const emissionsCO2GraphColumnNames = [
  `Émissions directes - ${popupTexts.scope1}`,
  `Émissions indirectes (production d'énergie) - ${popupTexts.scope2}`,
  `Émissions indirectes (matériel) - ${popupTexts.scope3}`,
];
const emissionsCO2GraphColumns = emissionsCO2GraphColumnNames.flatMap(getColumn);

const useFixLegendOpacity = (coutsRef?: React.RefObject<HTMLDivElement | null>) => {
  React.useEffect(() => {
    if (!coutsRef?.current) {
      return;
    }

    const applyChanges = () => {
      const legendBox = coutsRef?.current?.querySelector('g g:last-child > rect:last-child');

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

const roundUpToNearestThreshold =
  (thresholds: [number, number][]) =>
  (value: number): number => {
    for (const [threshold, divisor] of thresholds) {
      if (value > threshold) {
        return Math.ceil(value / divisor) * divisor;
      }
    }
    return Math.ceil(value / thresholds[thresholds.length - 1][1]) * thresholds[thresholds.length - 1][1];
  };

const roundScale = roundUpToNearestThreshold([
  [1000000, 1000000], // For large values (> 1,000,000), round up to the nearest 1,000,000
  [100000, 100000], // For large values (> 100,000), round up to the nearest 100,000
  [10000, 10000], // For medium values (> 10,000), round up to the nearest 10,000
  [0, 1000], // For smaller values, round up to the nearest 1,000
]);

const getGridRepeatPercentage = (value: number) => {
  let gridPercentage = 50;
  if (value % 500 === 0 && value <= 3000) gridPercentage = 100 / (value / 500);
  if (value % 1000 === 0 && value <= 10000) gridPercentage = 100 / (value / 1000);
  if (value % 10000 === 0 && value > 10000) gridPercentage = 100 / (value / 10000);
  if (value % 100000 === 0 && value > 100000) gridPercentage = 100 / (value / 100000);
  if (value % 1000000 === 0 && value > 1000000) gridPercentage = 100 / (value / 1000000);
  return gridPercentage;
};

export const getCostPrecisionRange = (value: number) => {
  const lowerBound = Math.round((value * (1 - costPrecisionPercentage)) / 10) * 10;
  const upperBound = Math.round((value * (1 + costPrecisionPercentage)) / 10) * 10;

  const lowerBoundString = lowerBound.toLocaleString('fr-FR', { currency: 'EUR', maximumFractionDigits: 0, style: 'currency' });
  const upperBoundString = upperBound.toLocaleString('fr-FR', { currency: 'EUR', maximumFractionDigits: 0, style: 'currency' });
  return { lowerBound, lowerBoundString, upperBound, upperBoundString };
};

const formatCostPrecisionRange = (value: number) => {
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(value);
  return `${lowerBoundString} - ${upperBoundString}`;
};

const getEmissionsCO2PrecisionRange = (value: number) => {
  const lowerBound = Math.round((value * (1 - co2PrecisionPercentage)) / 10) * 10;
  const upperBound = Math.round((value * (1 + co2PrecisionPercentage)) / 10) * 10;

  const lowerBoundString = formatEmissionsCO2(lowerBound, ''); // no suffix as it takes too much space
  const upperBoundString = formatEmissionsCO2(upperBound, '');
  return { lowerBound, lowerBoundString, upperBound, upperBoundString };
};

const formatEmissionsCO2 = (value: number, suffix = 'tCO2e') => {
  const roundedValue = (Math.round(value / 10) * 10) / 1000;
  const maximumFractionDigits = 2;

  return [`${roundedValue.toLocaleString('fr-FR', { maximumFractionDigits })}`, suffix].filter(Boolean).join(' ');
};
const formatCost = (value: number, suffix = true) =>
  `${(Math.round(value / 10) * 10).toLocaleString('fr-FR', { ...(!suffix ? {} : { currency: 'EUR', style: 'currency' }), maximumFractionDigits: 0 })}`;

const Graph: React.FC<GraphProps> = ({
  advancedMode,
  engine,
  className,
  captureImageName,
  reseauDeChaleur,
  export: exportSheets,
  ...props
}) => {
  const { has: hasModeDeChauffage } = useArrayQueryState('modes-de-chauffage');
  const coutsRef = useRef<HTMLDivElement>(null);
  useFixLegendOpacity(coutsRef);
  const ref = useRef(null);
  const { captureNodeAndDownload, capturing } = useScreenshot();

  const tooltipAides =
    'Aides perçues par l’usager (CEE et MPR). Les aides du Fonds chaleur sont incluses dans le R2 et non perceptibles directement par l’usager.';

  const coutGraphColumnNames = advancedMode
    ? ['P1 abonnement', 'P1 consommation', 'P1 ECS', "P1'", 'P1 consommation froid', 'P2', 'P3', 'P4 moins aides', 'Aides']
    : ['Abonnement', 'Consommation', 'Maintenance', 'Investissement', 'Aides'];

  const coutGraphColumns = coutGraphColumnNames.flatMap(getColumn);

  const coutGraphColors = advancedMode
    ? [colorP1Abo, colorP1Conso, colorP1ECS, colorP1prime, colorP1Consofroid, colorP2, colorP3, colorP4SansAides, colorP4Aides]
    : [colorP1Abo, colorP1Conso, colorP1prime, colorP4SansAides, colorP4Aides];

  const [graphType, setGraphType] = useQueryState('graph', { defaultValue: 'couts-emissions' });
  const [perBuilding, setPerBuilding] = useQueryState('perBuilding', parseAsBoolean.withDefault(false));
  const inclusClimatisation = engine.getField('Inclure la climatisation');
  const inclusECS = engine.getField('Production eau chaude sanitaire');
  const typeDeProductionDeFroid = engine.getField('type de production de froid');
  const typeDeBatiment = engine.getField('type de bâtiment');

  const getLabel = (typeInstallation: (typeof modesDeChauffage)[number], type: 'price' | 'co2' | 'both') => {
    let suffix = '';
    if (inclusClimatisation) {
      suffix = typeInstallation.reversible ? ' (chauffage + froid)' : ` + ${typeDeProductionDeFroid}`;
    }
    if (typeInstallation.label === 'Réseau de chaleur') {
      return `Réseau de chaleur (${reseauDeChaleur.label && !(type === 'price' && !reseauDeChaleur.hasPriceData) ? reseauDeChaleur.label : 'Valeur moyenne'})`;
    }

    return `${typeInstallation.label}${suffix}`;
  };

  const modesDeChauffageFiltres = modesDeChauffage
    .filter(
      (modeDeChauffage) =>
        (advancedMode
          ? hasModeDeChauffage(modeDeChauffage.label)
          : modeDeChauffage.grandPublicMode && !(reseauDeChaleur?.hide && modeDeChauffage.label === 'Réseau de chaleur')) &&
        (typeDeBatiment === 'tertiaire' ? modeDeChauffage.tertiaire : true)
    )
    .sort((a, b) => {
      if (advancedMode) {
        return 0;
      }
      // Define explicit order mapping
      const ordre = ['Réseaux de chaleur', 'Gaz', 'Fioul', 'Granulés', 'PAC', 'Radiateur électrique'];
      const idxA = ordre.indexOf(a.categorie);
      const idxB = ordre.indexOf(b.categorie);

      // Items in the ordre array come first, then others follow original order
      if (idxA !== -1 && idxB !== -1) {
        return idxA - idxB;
      }
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      // Neither found: default to original order
      return 0;
    });

  const totalCoutsEtEmissions: [string, number, number][] = [];

  let graphSectionTitle = '';

  let maxCoutValue = 3000;
  const coutGraphData = [
    ['Mode de chauffage', { role: 'annotation' }, ...coutGraphColumns, { role: 'annotation' }],
    ...modesDeChauffageFiltres.flatMap((typeInstallation, index) => {
      const amountP1Abo = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1abo`);
      const amountP1Conso = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1conso`);
      const amountP1ECS = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1ECS`);
      const amountP1prime = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1prime`);
      const amountP1Consofroid = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P1Consofroid`);
      const amountP2 = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P2`);
      const amountP3 = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P3`);
      const amountP4SansAides = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . P4 moins aides`);
      const amountAides = engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . aides`);

      const valueFormatter = advancedMode ? formatCostPrecisionRange : () => '';

      const amounts = advancedMode
        ? [
            ...getRow({
              amount: amountP1Abo,
              color: colorP1Abo,
              title: `P1 abonnement${typeInstallation.label === 'Réseau de chaleur' ? ' (R2 du réseau de chaleur)' : ''}`,
              valueFormatter,
            }),
            ...getRow({
              amount: amountP1Conso,
              color: colorP1Conso,
              title: `P1 consommation${typeInstallation.label === 'Réseau de chaleur' ? ' (R1 du réseau de chaleur)' : ''}`,
              valueFormatter,
            }),
            ...getRow({ amount: amountP1ECS, color: colorP1ECS, title: 'P1 ECS', valueFormatter }),
            ...getRow({ amount: amountP1prime, color: colorP1prime, title: "P1'", valueFormatter }),
            ...getRow({
              amount: amountP1Consofroid,
              color: colorP1Consofroid,
              title: 'P1 consommation froid',
              valueFormatter,
            }),
            ...getRow({ amount: amountP2, color: colorP2, title: 'P2', valueFormatter }),
            ...getRow({ amount: amountP3, color: colorP3, title: 'P3', valueFormatter }),
            ...getRow({
              amount: amountP4SansAides,
              color: colorP4SansAides,
              title: 'P4 moins aides',
              valueFormatter,
            }),
            ...getRow({
              amount: amountAides,
              bordered: true,
              color: colorP4Aides,
              title: tooltipAides,
              valueFormatter,
            }),
          ]
        : [
            ...getRow({
              amount: amountP1Abo,
              color: colorP1Abo,
              title: `Abonnement${typeInstallation.label === 'Réseau de chaleur' ? ' (R2 du réseau de chaleur)' : ''}`,
              valueFormatter,
            }),
            ...getRow({
              amount: amountP1Conso + amountP1ECS,
              color: colorP1Conso,
              title: `Consommation${typeInstallation.label === 'Réseau de chaleur' ? ' (R1 du réseau de chaleur)' : ''}`,
              valueFormatter,
            }),
            ...getRow({
              amount: amountP1prime + amountP2 + amountP3,
              color: colorP1prime,
              title: 'Maintenance',
              valueFormatter,
            }),
            ...getRow({
              amount: amountP4SansAides,
              color: colorP4SansAides,
              title: 'Investissement',
              valueFormatter,
            }),
            ...getRow({
              amount: amountAides,
              bordered: true,
              color: colorP4Aides,
              title: tooltipAides,
              valueFormatter,
            }),
          ];

      const totalAmountWithAides = (amounts.filter((amount) => !Number.isNaN(+amount)) as number[]).reduce(
        (acc, amount) => acc + amount,
        0
      );
      const totalAmount = totalAmountWithAides - amountAides;
      const precisionRange = valueFormatter(totalAmount);
      maxCoutValue = Math.max(maxCoutValue, totalAmount);
      totalCoutsEtEmissions[index] = [getLabel(typeInstallation, 'both'), totalAmount, -1];

      const graphSectionType: string = typeInstallation.type.includes('collectif') ? 'Chauffage collectif' : 'Chauffage individuel';
      let showSectionTitle = false;
      if (graphSectionTitle !== (graphSectionType as string)) {
        showSectionTitle = true;
        graphSectionTitle = graphSectionType;
      }

      return [
        ...(showSectionTitle
          ? [
              ...(index !== 0 ? [[' ', '', ...amounts.map((amount) => (Number.isNaN(+amount) ? '' : 0)), '']] : []), // Additional line to add some space
              [' ', showSectionTitle ? `-- ${graphSectionTitle}` : '', ...amounts.map((amount) => (Number.isNaN(+amount) ? '' : 0)), ''],
            ]
          : []),
        [' ', `${getLabel(typeInstallation, 'price')}`, ...amounts.map((amount) => (Number.isNaN(+amount) ? '' : 0)), ''],
        [`${getLabel(typeInstallation, 'price')}`, '', ...amounts, precisionRange],
      ];
    }),
  ];

  const coutGraphOptions: React.ComponentProps<typeof Chart>['options'] = deepMergeObjects(commonGraphOptions, {
    chartArea: {
      right: 130, // to display the total price without being cut (4 digits + unit)
    },
    colors: coutGraphColors,
    hAxis: {
      maxValue: maxCoutValue,
      minValue: 0,
      title: 'Coût €TTC',
    },
    stacked: false,
    vAxis: {
      textPosition: 'right',
    },
  });

  const nbAppartements = perBuilding ? engine.getFieldAsNumber(`nombre de logements dans l'immeuble concerné`) : 1;

  let maxEmissionsCO2Value = 5000 * nbAppartements;

  graphSectionTitle = '';
  const emissionsCO2GraphData = [
    ['Mode de chauffage', { role: 'annotation' }, ...emissionsCO2GraphColumns, { role: 'annotation', type: 'string' }],
    ...modesDeChauffageFiltres.flatMap((typeInstallation, index) => {
      const amounts = [
        ...getRow({
          amount: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 1`) * nbAppartements,
          color: colorScope1,
          title:
            "Émissions liées aux combustibles utilisés pour la production d'énergie, et réalisées directement sur le lieu de la consommation (scope 1)",
          valueFormatter: formatEmissionsCO2,
        }),
        ...getRow({
          amount: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 2`) * nbAppartements,
          color: colorScope2,
          title: "Émissions liées à l'utilisation d'énergie non produite sur le site de consommation (scope 2)",
          valueFormatter: formatEmissionsCO2,
        }),
        ...getRow({
          amount: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 3`) * nbAppartements,
          color: colorScope3,
          title: "Émissions liées à la fabrication des équipements, et non directement à la production d'énergie (scope 3)",
          valueFormatter: formatEmissionsCO2,
        }),
      ];

      const totalAmount = (amounts.filter((amount) => !Number.isNaN(+amount)) as number[]).reduce((acc, amount) => acc + amount, 0);
      maxEmissionsCO2Value = Math.max(maxEmissionsCO2Value, totalAmount);
      totalCoutsEtEmissions[index][2] = totalAmount;
      const graphSectionType: string = typeInstallation.type.includes('collectif') ? 'Chauffage collectif' : 'Chauffage individuel';
      let showSectionTitle = false;
      if (graphSectionTitle !== (graphSectionType as string)) {
        showSectionTitle = true;
        graphSectionTitle = graphSectionType;
      }

      return [
        ...(showSectionTitle
          ? [
              ...(index !== 0 ? [[' ', '', ...amounts.map((amount) => (Number.isNaN(+amount) ? '' : 0)), '']] : []), // Additional line to add some space
              [' ', showSectionTitle ? `-- ${graphSectionTitle}` : '', ...amounts.map((amount) => (Number.isNaN(+amount) ? '' : 0)), ''],
            ]
          : []),
        ['', `${getLabel(typeInstallation, 'co2')}`, ...amounts.map((amount) => (Number.isNaN(+amount) ? '' : 0)), ''],
        [getLabel(typeInstallation, 'co2'), '', ...amounts, formatEmissionsCO2(totalAmount)],
      ];
    }),
  ];

  const emissionsCO2GraphOptions: React.ComponentProps<typeof Chart>['options'] = deepMergeObjects(commonGraphOptions, {
    chartArea: {
      right: 130, // to display the total price without being cut (4 digits + unit)
    },
    colors: [colorScope1, colorScope2, colorScope3],
    hAxis: {
      maxValue: maxEmissionsCO2Value,
      minValue: 0,
      title: 'Émissions (kgCO2e)',
    },
  });

  const maxExistingEmissionsCO2Value =
    totalCoutsEtEmissions.reduce((acc, [, , co2]) => Math.max(acc, co2), 0) * (1 + co2PrecisionPercentage);
  const maxExistingCostValue = totalCoutsEtEmissions.reduce((acc, [, cost]) => Math.max(acc, cost), 0) * (1 + costPrecisionPercentage);

  const scaleEmissionsCO2maxValue = roundScale(maxExistingEmissionsCO2Value);
  const scaleCostMaxValue = roundScale(maxExistingCostValue);

  const titleItems = ['chauffage', inclusClimatisation && 'froid', inclusECS && 'ECS'].filter(Boolean);
  const titleItemsString =
    titleItems.length > 1 ? `${titleItems.slice(0, -1).join(', ')} et ${titleItems[titleItems.length - 1]}` : titleItems[0] || '';

  graphSectionTitle = '';

  const segments: React.ComponentProps<typeof SegmentedControl>['segments'] = [
    {
      label: 'Coût et émissions de CO2',
      nativeInputProps: {
        checked: graphType === 'couts-emissions',
        onChange: () => setGraphType('couts-emissions'),
      },
    },
    {
      label: 'Détails des coûts',
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
  ];

  return (
    <>
      {advancedMode && (
        <Box textAlign="right" my="4w">
          <SegmentedControl hideLegend segments={segments} />
        </Box>
      )}
      <div ref={ref} className={cx(className)} {...props}>
        {graphType === 'couts-emissions' && (
          <div>
            <Heading as="h6">
              Coût global et émissions de CO2 annuels
              {typeDeBatiment === 'tertiaire' ? '' : ` (par ${perBuilding ? 'bâtiment' : 'logement'})`} - {titleItemsString} ({dataYear})
            </Heading>
            <DisclaimerButton className="mb-5!" />
            <div className="relative mt-2 pb-8">
              <div className="absolute inset-0 -z-10 flex h-full w-full *:flex-1">
                <div
                  className="ml-12 mr-3"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to right,#CCC 0,#CCC 1px,transparent 1px,transparent ${getGridRepeatPercentage(scaleEmissionsCO2maxValue)}%)`,
                    // Goal here is to give a grid that is relevent for a user
                    // when % is infinite (16.666666% for example), grid might appear inaccurate and we rather display only one understandable line instead
                    borderRight: '1px solid #CCC',
                  }}
                />
                <div
                  className="ml-3 mr-12"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to right,#CCC 0,#CCC 1px,transparent 1px,transparent  ${getGridRepeatPercentage(scaleCostMaxValue)}%)`,
                    borderRight: '1px solid #CCC',
                  }}
                />
              </div>
              {totalCoutsEtEmissions.map(([name, cost, co2], i) => {
                const {
                  lowerBound: co2LowerBound,
                  upperBound: co2UpperBound,
                  lowerBoundString: co2LowerBoundString,
                  upperBoundString: co2UpperBoundString,
                } = getEmissionsCO2PrecisionRange(co2);
                const co2LowerPercent = Math.max(0, Math.round((co2LowerBound / scaleEmissionsCO2maxValue) * 100));
                const co2UpperPercent = Math.min(100, Math.round((co2UpperBound / scaleEmissionsCO2maxValue) * 100));
                const co2Width = co2UpperPercent - co2LowerPercent;

                const {
                  lowerBound: costLowerBound,
                  upperBound: costUpperBound,
                  lowerBoundString,
                  upperBoundString,
                } = getCostPrecisionRange(cost);
                const costLowerPercent = Math.max(0, Math.round((costLowerBound / scaleCostMaxValue) * 100));
                const costUpperPercent = Math.min(100, Math.round((costUpperBound / scaleCostMaxValue) * 100));
                const costWidth = costUpperPercent - costLowerPercent;

                const graphSectionType: string = advancedMode
                  ? name.includes(' individuel')
                    ? 'Chauffage individuel'
                    : 'Chauffage collectif'
                  : modesDeChauffageFiltres.find((modeDeChauffage) => modeDeChauffage.label === name)?.categorie || '';

                const isReseauDeChaleur = name.includes('Réseau de chaleur');

                let showSectionTitle = false;
                if (graphSectionTitle !== (graphSectionType as string)) {
                  showSectionTitle = true;
                  graphSectionTitle = graphSectionType;
                }

                const isReseauDeChaleurMoyenForCost =
                  reseauDeChaleur.label && name.includes('Réseau de chaleur') && !reseauDeChaleur.hasPriceData;

                const taints = {
                  common: {
                    co2: [
                      'bg-fcu-orange-light/10 text-fcu-orange-light',
                      'border-l-fcu-orange-light',
                      'bg-fcu-orange-light',
                      'bg-fcu-orange-light/30 text-fcu-orange-light',
                      'border-r-fcu-orange-light',
                    ],
                    cost: [
                      'bg-fcu-purple/30 text-fcu-purple',
                      'border-l-fcu-purple-light',
                      'bg-fcu-purple',
                      'bg-fcu-purple/30 text-fcu-purple',
                      'border-r-fcu-purple',
                    ],
                  },
                  rdc: {
                    co2: [
                      'bg-fcu-green-light/20 text-fcu-green-light',
                      'border-l-fcu-green-light',
                      'bg-fcu-green-light',
                      'bg-fcu-green-light/30 text-fcu-green-light',
                      'border-r-fcu-green-light',
                    ],
                    cost: [
                      'bg-fcu-green/30 text-fcu-green',
                      'border-l-fcu-green-light',
                      'bg-fcu-green',
                      'bg-fcu-green/30 text-fcu-green',
                      'border-r-fcu-green',
                    ],
                  },
                };
                const taint = isReseauDeChaleur ? 'rdc' : 'common';

                const taintClasses = taints[taint] || [];

                return (
                  <Fragment key={name}>
                    {showSectionTitle && (
                      <div className={cx('relative mb-1 text-center text-xl font-bold bg-white', i > 0 ? 'mt-8' : '')}>
                        {graphSectionTitle}
                      </div>
                    )}
                    <div key={name} className="relative mb-1 mt-2 flex items-center justify-center text-base font-bold">
                      <span className="bg-white flex items-center gap-2 justify-center w-full">{name}</span>
                    </div>
                    <div className="group stretch flex items-center">
                      <div className="h-[22px] pl-12 pr-3 flex flex-1 border-r border-solid border-white">
                        <div
                          className={cx(
                            'relative whitespace-nowrap py-0.5 tracking-tight text-left font-extrabold sm:text-xs md:text-sm flex items-center justify-end',
                            taintClasses.co2[0]
                          )}
                          style={{ flex: 100 - co2UpperPercent }}
                        >
                          <span className="pr-0.5 absolute right-[12px]">{advancedMode ? co2UpperBoundString : ''}</span>
                          {advancedMode && (
                            <div
                              className={cx(
                                'border-solid border-l-12 border-y-transparent border-y-[5px] my-1 border-r-0',
                                taintClasses.co2[1]
                              )}
                            />
                          )}
                        </div>
                        <div className={cx('relative ', taintClasses.co2[2])} style={{ flex: co2Width }} />
                        <div
                          className={cx(
                            'relative whitespace-nowrap tracking-tight py-0.5 text-right font-extrabold sm:text-xs md:text-sm flex items-center justify-start',
                            taintClasses.co2[3]
                          )}
                          style={{ flex: co2LowerPercent }}
                        >
                          {advancedMode && (
                            <div
                              className={cx(
                                'border-solid  border-r-12 border-y-transparent border-y-[5px] my-1 border-l-0',
                                taintClasses.co2[4]
                              )}
                            />
                          )}
                          <span className="absolute left-[12px] pl-0.5">{advancedMode ? co2LowerBoundString : ''}</span>
                        </div>
                      </div>
                      <div className="h-[22px] pr-12 pl-3 flex flex-1 border-l border-solid border-white">
                        <div
                          className={cx(
                            'relative whitespace-nowrap tracking-tight py-0.5 text-right font-extrabold sm:text-xs md:text-sm flex items-center justify-end',
                            taintClasses.cost[0]
                          )}
                          style={{ flex: costLowerPercent }}
                        >
                          <span className="pr-0.5 absolute right-[12px]">{advancedMode ? lowerBoundString : ''}</span>
                          {advancedMode && (
                            <div
                              className={cx(
                                'border-solid  border-l-12 border-y-transparent border-y-[5px] my-1 border-r-0',
                                taintClasses.cost[1]
                              )}
                            />
                          )}
                        </div>
                        <div className={cx('relative ', taintClasses.cost[2])} style={{ flex: costWidth }} />
                        <div
                          className={cx(
                            'relative whitespace-nowrap py-0.5 tracking-tight text-left font-extrabold sm:text-xs md:text-sm flex items-center justify-start',
                            taintClasses.cost[3]
                          )}
                          style={{ flex: 100 - costUpperPercent }}
                        >
                          {advancedMode && (
                            <div
                              className={cx(
                                'border-solid  border-r-12 border-y-transparent border-y-[5px] my-1 border-l-0',
                                taintClasses.cost[4]
                              )}
                            />
                          )}
                          <span className="pl-0.5 absolute left-[12px]">{advancedMode ? upperBoundString : ''}</span>
                        </div>
                      </div>
                    </div>
                    {isReseauDeChaleurMoyenForCost && (
                      <span className="flex text-xs italic mt-1">
                        <span className="flex-1" />
                        <span className="flex-1 pl-8 tracking-tighter leading-tight text-warning">
                          Prix moyen français, faute de données tarifaires pour ce réseau.
                        </span>
                      </span>
                    )}
                  </Fragment>
                );
              })}
            </div>

            <div className="flex justify-between text-sm font-bold text-gray-600 -mt-2 mb-8">
              <div className="flex-1 ml-12 mr-2 flex items-center justify-between relative">
                {Array.from({ length: Math.floor(100 / getGridRepeatPercentage(scaleEmissionsCO2maxValue)) }).map((_, i) => (
                  <div className="relative flex-1" key={`scale_co2_${i}-${scaleEmissionsCO2maxValue}`}>
                    &nbsp;
                    <span className="absolute origin-bottom-right -rotate-45 w-[100px] -translate-x-[100px] whitespace-nowrap text-right">
                      {formatEmissionsCO2(
                        scaleEmissionsCO2maxValue * (1 - (i * getGridRepeatPercentage(scaleEmissionsCO2maxValue)) / 100),
                        ''
                      )}
                    </span>
                  </div>
                ))}
                <span className="absolute origin-bottom-right -rotate-45 right-0 whitespace-nowrap text-right">
                  {formatEmissionsCO2(0, '')}
                </span>
              </div>
              <div className="flex-1 mr-12 ml-2 flex items-center justify-between relative">
                <span className="absolute origin-bottom-right -rotate-45 left-0 whitespace-nowrap text-right -translate-x-[5px]">
                  {formatCost(0, false)}
                </span>
                {Array.from({ length: Math.floor(100 / getGridRepeatPercentage(scaleCostMaxValue)) }).map((_, i) => (
                  <div className="relative flex-1" key={`scale_cost_${i}-${scaleCostMaxValue}`}>
                    &nbsp;
                    <span className="absolute origin-bottom-right -rotate-45 w-full translate-x-[5px] whitespace-nowrap text-right">
                      {formatCost(scaleCostMaxValue * (((i + 1) * getGridRepeatPercentage(scaleCostMaxValue)) / 100), false)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-sm font-bold  text-gray-600 mb-16">
              <div className="flex-1 ml-12 mr-2 flex items-center justify-center">Émissions de CO2 (tCO2e)</div>
              <div className="flex-1 mr-12 ml-2 flex items-center justify-center">Coût global (€TTC)</div>
            </div>
          </div>
        )}
        {graphType === 'couts' && (
          <div ref={coutsRef}>
            <Heading as="h6">
              Coût global annuel - {titleItemsString}
              {typeDeBatiment === 'tertiaire' ? '' : ' (par logement)'} ({dataYear})
            </Heading>
            <DisclaimerButton className="mb-5!" />
            <Chart
              chartType="BarChart"
              height="100%"
              chartLanguage="FR-fr"
              // désactive le clic sur la légende qui masque les barres + le style sélection
              chartEvents={[
                {
                  callback: ({ chartWrapper }) => {
                    if (chartWrapper) {
                      (chartWrapper.getChart() as any).setSelection();
                    }
                  },
                  eventName: 'select',
                },
              ]}
              loader={<ChartPlaceholder>Chargement du graphe...</ChartPlaceholder>}
              data={coutGraphData}
              options={{
                ...coutGraphOptions,
                height: coutGraphData.length * estimatedRowHeightPx + estimatedLegendAndUnitsHeightPx, // dynamic height https://github.com/rakannimer/react-google-charts/issues/385
              }}
            />
          </div>
        )}
        {graphType === 'emissions' && (
          <>
            <Heading as="h6">
              Émissions annuelles de CO2{perBuilding ? ' (par bâtiment)' : typeDeBatiment === 'tertiaire' ? '' : ' (par logement)'} (
              {dataYear})
            </Heading>
            <DisclaimerButton className="mb-5!" />
            {typeDeBatiment === 'résidentiel' && (
              <SegmentedControl
                className="mt-2!"
                hideLegend
                small
                segments={[
                  {
                    label: 'Par logement',
                    nativeInputProps: {
                      checked: !perBuilding,
                      onChange: () => setPerBuilding(false),
                    },
                  },
                  {
                    label: 'Par bâtiment',
                    nativeInputProps: {
                      checked: perBuilding,
                      onChange: () => setPerBuilding(true),
                    },
                  },
                ]}
              />
            )}
            <Chart
              chartType="BarChart"
              height="100%"
              chartLanguage="FR-fr"
              // désactive le clic sur la légende qui masque les barres + le style sélection
              chartEvents={[
                {
                  callback: ({ chartWrapper }) => {
                    if (chartWrapper) {
                      (chartWrapper.getChart() as any).setSelection();
                    }
                  },
                  eventName: 'select',
                },
              ]}
              loader={<ChartPlaceholder>Chargement du graphe...</ChartPlaceholder>}
              data={emissionsCO2GraphData}
              options={{
                ...emissionsCO2GraphOptions,
                height: emissionsCO2GraphData.length * estimatedRowHeightPx + estimatedLegendAndUnitsHeightPx, // dynamic height https://github.com/rakannimer/react-google-charts/issues/385
              }}
            />
          </>
        )}
        <Logos className="fr-mt-4w" size="sm" justifyContent="end" />
        <div className="text-right text-xs text-faded">
          <DataYearDisclaimer />
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-2 border-2 border-dashed border-info-light p-2">
        <div className="text-center flex gap-2 justify-center">
          <Button
            priority="secondary"
            onClick={async () => await captureNodeAndDownload(ref, { filename: `${captureImageName}-${graphType}.png`, padding: 20 })}
            loading={capturing}
          >
            Sauvegarder l'image
          </Button>
          {exportSheets && (
            <ButtonExport priority="secondary" filename={`${captureImageName}-${graphType}.xlsx`} sheets={exportSheets}>
              Exporter les données
            </ButtonExport>
          )}
        </div>
        <Notice size="sm" classes={{ title: 'font-normal! text-sm!' }}>
          {exportSheets ? (
            "En cas d'utilisation de l'image ou des données exportées, un lien vers le comparateur en ligne doit obligatoirement être apposé à proximité de l'image ou des données utilisées."
          ) : (
            <>
              En cas d’utilisation de l’<strong>image exportée</strong>, un lien vers le comparateur en ligne doit obligatoirement être
              apposé à proximité de l’image.
            </>
          )}
        </Notice>
      </div>
    </>
  );
};

export default Graph;
