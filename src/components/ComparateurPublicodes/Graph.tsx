import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl';
import { parseAsBoolean, useQueryState } from 'nuqs';
import React, { useRef } from 'react';
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

import { ChartPlaceholder, GraphTooltip } from './ComparateurPublicodes.style';
import { modesDeChauffage } from './mappings';
import { dataYearDisclaimer, DisclaimerButton, Logos } from './Placeholder';
import { type SimulatorEngine } from './useSimulatorEngine';

const COST_PRECISION = 10;
const CO2_PRECISION = 5;
const costPrecisionPercentage = COST_PRECISION / 100;
const co2PrecisionPercentage = CO2_PRECISION / 100;

type GraphProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
  advancedMode?: boolean;
  captureImageName?: string;
  usedReseauDeChaleurLabel: string;
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
  title: React.ReactNode;
  color: string;
  amount: number;
  bordered?: boolean;
  valueFormatter: (value: number) => React.ReactNode;
}

const getTooltip = ({ title, amount, color, bordered, valueFormatter }: TooltipProps) =>
  ReactDOMServer.renderToString(
    <GraphTooltip>
      <span style={bordered ? { border: `2px solid ${color}` } : { backgroundColor: color }}></span>
      <div style={{ maxWidth: '300px', lineHeight: '1.25rem', fontSize: '0.875rem', margin: '2px 0' }}>{title}</div>
      <strong style={{ whiteSpace: 'nowrap' }}>{valueFormatter(amount)}</strong>
    </GraphTooltip>
  );

const getColumn = (title: string) => [title, { role: 'style' }, { type: 'string', role: 'tooltip', p: { html: true } }];

const getRow = ({ title, amount, color, bordered, valueFormatter }: TooltipProps) => [
  amount,
  getBarStyle(color, { bordered }),
  getTooltip({ title, amount, color, bordered, valueFormatter }),
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
const emissionsCO2GraphColumns = emissionsCO2GraphColumnNames.map(getColumn).flat();

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

const getCostPrecisionRange = (value: number) => {
  const lowerBound = Math.round((value * (1 - costPrecisionPercentage)) / 10) * 10;
  const upperBound = Math.round((value * (1 + costPrecisionPercentage)) / 10) * 10;

  const lowerBoundString = lowerBound.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const upperBoundString = upperBound.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  return { lowerBound, upperBound, lowerBoundString, upperBoundString };
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
  `${(Math.round(value / 10) * 10).toLocaleString('fr-FR', { ...(!suffix ? {} : { style: 'currency', currency: 'EUR' }), maximumFractionDigits: 0 })}`;

const Graph: React.FC<GraphProps> = ({ advancedMode, engine, className, captureImageName, usedReseauDeChaleurLabel, ...props }) => {
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

  const coutGraphColumns = coutGraphColumnNames.map(getColumn).flat();

  const coutGraphColors = advancedMode
    ? [colorP1Abo, colorP1Conso, colorP1ECS, colorP1prime, colorP1Consofroid, colorP2, colorP3, colorP4SansAides, colorP4Aides]
    : [colorP1Abo, colorP1Conso, colorP1prime, colorP4SansAides, colorP4Aides];

  const [graphType, setGraphType] = useQueryState('graph', { defaultValue: 'couts-emissions' });
  const [perBuilding, setPerBuilding] = useQueryState('perBuilding', parseAsBoolean.withDefault(false));
  const inclusClimatisation = engine.getField('Inclure la climatisation');
  const inclusECS = engine.getField('Production eau chaude sanitaire');
  const typeDeProductionDeFroid = engine.getField('type de production de froid');
  const typeDeBatiment = engine.getField('type de bâtiment');

  const getLabel = (typeInstallation: (typeof modesDeChauffage)[number]) => {
    let suffix = '';
    if (inclusClimatisation) {
      suffix = typeInstallation.reversible ? ' (chauffage + froid)' : ` + ${typeDeProductionDeFroid}`;
    }
    if (typeInstallation.label === 'Réseau de chaleur') {
      return `Réseau de chaleur (${usedReseauDeChaleurLabel})`;
    }

    return `${typeInstallation.label}${suffix}`;
  };

  const modesDeChauffageFiltres = modesDeChauffage.filter(
    (modeDeChauffage) =>
      (!advancedMode ? modeDeChauffage.grandPublicMode : true) &&
      hasModeDeChauffage(modeDeChauffage.label) &&
      (typeDeBatiment === 'tertiaire' ? modeDeChauffage.tertiaire : true)
  );

  const totalCoutsEtEmissions: [string, number, number][] = [];

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
              title: `P1 abonnement${typeInstallation.label === 'Réseau de chaleur' ? ' (R2 du réseau de chaleur)' : ''}`,
              amount: amountP1Abo,
              color: colorP1Abo,
              valueFormatter,
            }),
            ...getRow({
              title: `P1 consommation${typeInstallation.label === 'Réseau de chaleur' ? ' (R1 du réseau de chaleur)' : ''}`,
              amount: amountP1Conso,
              color: colorP1Conso,
              valueFormatter,
            }),
            ...getRow({ title: 'P1 ECS', amount: amountP1ECS, color: colorP1ECS, valueFormatter }),
            ...getRow({ title: "P1'", amount: amountP1prime, color: colorP1prime, valueFormatter }),
            ...getRow({
              title: 'P1 consommation froid',
              amount: amountP1Consofroid,
              color: colorP1Consofroid,
              valueFormatter,
            }),
            ...getRow({ title: 'P2', amount: amountP2, color: colorP2, valueFormatter }),
            ...getRow({ title: 'P3', amount: amountP3, color: colorP3, valueFormatter }),
            ...getRow({
              title: 'P4 moins aides',
              amount: amountP4SansAides,
              color: colorP4SansAides,
              valueFormatter,
            }),
            ...getRow({
              title: tooltipAides,
              amount: amountAides,
              color: colorP4Aides,
              bordered: true,
              valueFormatter,
            }),
          ]
        : [
            ...getRow({
              title: `Abonnement${typeInstallation.label === 'Réseau de chaleur' ? ' (R2 du réseau de chaleur)' : ''}`,
              amount: amountP1Abo,
              color: colorP1Abo,
              valueFormatter,
            }),
            ...getRow({
              title: `Consommation${typeInstallation.label === 'Réseau de chaleur' ? ' (R1 du réseau de chaleur)' : ''}`,
              amount: amountP1Conso + amountP1ECS,
              color: colorP1Conso,
              valueFormatter,
            }),
            ...getRow({
              title: 'Maintenance',
              amount: amountP1prime + amountP2 + amountP3,
              color: colorP1prime,
              valueFormatter,
            }),
            ...getRow({
              title: 'Investissement',
              amount: amountP4SansAides,
              color: colorP4SansAides,
              valueFormatter,
            }),
            ...getRow({
              title: tooltipAides,
              amount: amountAides,
              color: colorP4Aides,
              bordered: true,
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
      totalCoutsEtEmissions[index] = [getLabel(typeInstallation), totalAmount, -1];
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
      title: 'Coût €TTC',
      minValue: 0,
      maxValue: maxCoutValue,
    },
    stacked: false,
    colors: coutGraphColors,
    vAxis: {
      textPosition: 'right',
    },
  });

  const nbAppartements = perBuilding ? engine.getFieldAsNumber(`nombre de logements dans l'immeuble concerné`) : 1;

  let maxEmissionsCO2Value = 5000 * nbAppartements;

  const emissionsCO2GraphData = [
    ['Mode de chauffage', { role: 'annotation' }, ...emissionsCO2GraphColumns, { type: 'string', role: 'annotation' }],
    ...modesDeChauffageFiltres.flatMap((typeInstallation, index) => {
      const amounts = [
        ...getRow({
          title:
            "Émissions liées aux combustibles utilisés pour la production d'énergie, et réalisées directement sur le lieu de la consommation (scope 1)",
          amount: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 1`) * nbAppartements,
          color: colorScope1,
          valueFormatter: formatEmissionsCO2,
        }),
        ...getRow({
          title: "Émissions liées à l'utilisation d'énergie non produite sur le site de consommation (scope 2)",
          amount: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 2`) * nbAppartements,
          color: colorScope2,
          valueFormatter: formatEmissionsCO2,
        }),
        ...getRow({
          title: "Émissions liées à la fabrication des équipements, et non directement à la production d'énergie (scope 3)",
          amount: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Scope 3`) * nbAppartements,
          color: colorScope3,
          valueFormatter: formatEmissionsCO2,
        }),
      ];

      const totalAmount = (amounts.filter((amount) => !Number.isNaN(+amount)) as number[]).reduce((acc, amount) => acc + amount, 0);
      maxEmissionsCO2Value = Math.max(maxEmissionsCO2Value, totalAmount);
      totalCoutsEtEmissions[index][2] = totalAmount;
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

  const chartHeight = modesDeChauffageFiltres.length * estimatedRowHeightPx + estimatedBaseGraphHeightPx;

  const maxExistingEmissionsCO2Value =
    totalCoutsEtEmissions.reduce((acc, [, , co2]) => Math.max(acc, co2), 0) * (1 + co2PrecisionPercentage);
  const maxExistingCostValue = totalCoutsEtEmissions.reduce((acc, [, cost]) => Math.max(acc, cost), 0) * (1 + costPrecisionPercentage);
  const scaleTickCost = 500;
  const scaleCostMaxValue = Math.ceil(maxExistingCostValue / scaleTickCost) * scaleTickCost;
  const scaleEmissionsCO2maxValue =
    maxExistingEmissionsCO2Value > 10000
      ? Math.ceil(maxExistingEmissionsCO2Value / 10000) * 10000
      : Math.ceil(maxExistingEmissionsCO2Value / 1000) * 1000;

  const getGrid = (value: number) => {
    if (value % 500 === 0 && value <= 3000) return 100 / (value / 500);
    if (value % 1000 === 0 && value <= 10000) return 100 / (value / 1000);
    if (value % 10000 === 0 && value > 10000) return 100 / (value / 10000);
    return 50;
  };

  const titleItems = ['chauffage', inclusClimatisation && 'froid', inclusECS && 'ECS'].filter(Boolean);
  const titleItemsString =
    titleItems.length > 1 ? titleItems.slice(0, -1).join(', ') + ' et ' + titleItems[titleItems.length - 1] : titleItems[0] || '';

  let graphSectionTitle = '';

  return (
    <>
      <Box textAlign="right" my="4w">
        <SegmentedControl
          hideLegend
          segments={[
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
          ]}
        />
      </Box>
      <div ref={ref} className={cx(className)} {...props}>
        {graphType === 'couts-emissions' && (
          <div>
            <Heading as="h6">
              Coût global et émissions de CO2 annuels
              {typeDeBatiment === 'tertiaire' ? '' : ` (par ${perBuilding ? 'bâtiment' : 'logement'})`} - {titleItemsString}
            </Heading>
            <DisclaimerButton className="!mb-5" />
            <div className="relative pt-2 pb-8">
              <div className="absolute inset-0 -z-10 flex h-full w-full [&>*]:flex-1">
                <div
                  className="ml-12 mr-3"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to right,#CCC 0,#CCC 1px,transparent 1px,transparent ${getGrid(scaleEmissionsCO2maxValue)}%)`,
                    // Goal here is to give a grid that is relevent for a user
                    // when % is infinite (16.666666% for example), grid might appear inaccurate and we rather display only one understandable line instead
                    borderRight: '1px solid #CCC',
                  }}
                ></div>
                <div
                  className="ml-3 mr-12"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to right,#CCC 0,#CCC 1px,transparent 1px,transparent  ${getGrid(scaleCostMaxValue)}%)`,
                    borderRight: '1px solid #CCC',
                  }}
                ></div>
              </div>
              {totalCoutsEtEmissions.map(([name, cost, co2]) => {
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
                const graphSectionType: string = name.includes(' individuel') // Check within the name as there is no other easy way to find this information
                  ? 'Chauffage individuel'
                  : 'Chauffage collectif';

                let showSectionTitle = false;
                if (graphSectionTitle !== (graphSectionType as string)) {
                  showSectionTitle = true;
                  graphSectionTitle = graphSectionType;
                }

                return (
                  <>
                    {showSectionTitle && (
                      <div className="relative mb-1 mt-8 text-center text-xl font-bold bg-white/20">{graphSectionTitle}</div>
                    )}
                    <div key={name} className="relative mb-1 mt-2 flex items-center justify-center text-base font-bold">
                      <span className="bg-white/20">{name}</span>
                    </div>
                    <div className="group stretch flex items-center">
                      <div className="pl-12 pr-3 flex flex-1 border-r border-solid border-white">
                        <div
                          className="relative bg-fcu-orange-light/10 whitespace-nowrap py-0.5 tracking-tight text-left font-extrabold text-fcu-orange-light sm:text-xs md:text-sm flex items-center justify-end"
                          style={{ flex: 100 - co2UpperPercent }}
                        >
                          <span className="pr-0.5 absolute right-[12px]">{advancedMode ? co2UpperBoundString : ''}</span>
                          <div className="border-solid border-l-fcu-orange-light border-l-[12px] border-y-transparent border-y-[5px] my-1 border-r-0"></div>
                        </div>
                        <div className="relative bg-fcu-orange-light" style={{ flex: co2Width }}></div>
                        <div
                          className="relative bg-fcu-orange-light/30 whitespace-nowrap tracking-tight py-0.5 text-right font-extrabold text-fcu-orange-light sm:text-xs md:text-sm flex items-center justify-start"
                          style={{ flex: co2LowerPercent }}
                        >
                          <div className="border-solid border-r-fcu-orange-light border-r-[12px] border-y-transparent border-y-[5px] my-1 border-l-0"></div>
                          <span className="absolute left-[12px] pl-0.5">{advancedMode ? co2LowerBoundString : ''}</span>
                        </div>
                      </div>
                      <div className="pr-12 pl-3 flex flex-1 border-l border-solid border-white">
                        <div
                          className="relative bg-fcu-purple/30 whitespace-nowrap tracking-tight py-0.5 text-right font-extrabold text-fcu-purple sm:text-xs md:text-sm flex items-center justify-end"
                          style={{ flex: costLowerPercent }}
                        >
                          <span className="pr-0.5 absolute right-[12px]">{advancedMode ? lowerBoundString : ''}</span>
                          <div className="border-solid border-l-fcu-purple border-l-[12px] border-y-transparent border-y-[5px] my-1 border-r-0"></div>
                        </div>
                        <div className="relative bg-fcu-purple" style={{ flex: costWidth }}></div>
                        <div
                          className="relative bg-fcu-purple/10 whitespace-nowrap py-0.5 tracking-tight text-left font-extrabold text-fcu-purple sm:text-xs md:text-sm flex items-center justify-start"
                          style={{ flex: 100 - costUpperPercent }}
                        >
                          <div className="border-solid border-r-fcu-purple border-r-[12px] border-y-transparent border-y-[5px] my-1 border-l-0"></div>
                          <span className="pl-0.5 absolute left-[12px]">{advancedMode ? upperBoundString : ''}</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })}
            </div>

            <div className="flex justify-between text-sm font-bold text-gray-600 -mt-2 mb-8">
              <div className="flex-1 ml-12 mr-2 flex items-center justify-between relative">
                {Array.from({ length: Math.floor(100 / getGrid(scaleEmissionsCO2maxValue)) }).map((_, i) => (
                  <div className="relative flex-1" key={`scale_co2_${i}-${scaleEmissionsCO2maxValue}`}>
                    &nbsp;
                    <span className="absolute origin-bottom-right -rotate-45 w-[100px] -translate-x-[100px] whitespace-nowrap text-right">
                      {formatEmissionsCO2(scaleEmissionsCO2maxValue * (1 - (i * getGrid(scaleEmissionsCO2maxValue)) / 100), '')}
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
                {Array.from({ length: Math.floor(100 / getGrid(scaleCostMaxValue)) }).map((_, i) => (
                  <div className="relative flex-1" key={`scale_cost_${i}-${scaleCostMaxValue}`}>
                    &nbsp;
                    <span className="absolute origin-bottom-right -rotate-45 w-[100%] translate-x-[5px] whitespace-nowrap text-right">
                      {formatCost(scaleCostMaxValue * (((i + 1) * getGrid(scaleCostMaxValue)) / 100), false)}
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
              {typeDeBatiment === 'tertiaire' ? '' : ' (par logement)'}
            </Heading>
            <DisclaimerButton className="!mb-5" />
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
            <Heading as="h6">Émissions annuelles de CO2 (par {perBuilding ? 'bâtiment' : 'logement'})</Heading>
            <DisclaimerButton className="!mb-5" />
            {typeDeBatiment === 'résidentiel' && (
              <SegmentedControl
                className="!mt-2"
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
        <Logos className="fr-mt-4w" size="sm" justifyContent="end" />
        <div className="text-right text-xs text-faded">{dataYearDisclaimer}</div>
      </div>
      <div className="mt-12 flex flex-col gap-2 border-2 border-dashed border-info-light p-2">
        <div className="text-center">
          <Button
            priority="secondary"
            onClick={async () => await captureNodeAndDownload(ref, { padding: '20px', filename: `${captureImageName}-${graphType}.png` })}
            loading={capturing}
          >
            Sauvegarder l'image
          </Button>
        </div>
        <Notice size="sm">
          En cas d’utilisation de l’image exportée, un lien vers le comparateur en ligne doit obligatoirement être apposé à proximité de
          l’image.
        </Notice>
      </div>
    </>
  );
};

export default Graph;
