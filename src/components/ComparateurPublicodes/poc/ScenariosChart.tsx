import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { FCUEngine } from '@/modules/publicodes/explanation-model';

import { co2TotalRuleSuffix, costTotalRuleSuffix, getScenarioRule, type Scenario } from './scenario-model';

type ScenariosChartProps = {
  scenarios: Scenario[];
  engines: Record<string, FCUEngine>;
  isTertiaire: boolean;
};

// Same grouping as the public comparator (abonnement / consommation / entretien / investissement net), palette validated for CVD
const COST_SERIES = [
  { color: '#C9971F', key: 'abonnement', label: 'Abonnement', rules: ['P1abo'] },
  { color: '#D9573B', key: 'consommation', label: 'Consommation', rules: ['P1conso', 'P1ECS', 'P1Consofroid'] },
  { color: '#1C9A8C', key: 'entretien', label: 'Entretien', rules: ['P1prime', 'P2', 'P3'] },
  { color: '#6A4C93', key: 'investissement', label: 'Investissement net des aides', rules: ['P4 moins aides'] },
] as const;

const CO2_SERIES = [
  { color: '#7FA11E', key: 'scope1', label: 'Directes (scope 1)', rules: ['scope 1'] },
  { color: '#1F6E3F', key: 'scope2', label: 'Indirectes, énergie (scope 2)', rules: ['scope 2'] },
  { color: '#2A8FB8', key: 'scope3', label: 'Indirectes, matériel (scope 3)', rules: ['scope 3'] },
] as const;

const ROW_HEIGHT_PX = 36;
const CHART_PADDING_PX = 70;

const formatNumber = (value: number) => Math.round(value).toLocaleString('fr-FR');

/**
 * Horizontal stacked bars, one row per scenario, for the annual cost (by post) and the CO2 emissions (by scope):
 * the shape that keeps a long list of scenarios readable where the table columns no longer fit.
 */
export function ScenariosChart({ scenarios, engines, isTertiaire }: ScenariosChartProps) {
  const sumRules = (scenario: Scenario, namespace: string, rules: readonly string[]) =>
    rules.reduce((total, rule) => {
      const value = engines[scenario.id].evaluate(getScenarioRule(scenario.mode, [namespace, rule].filter(Boolean).join(' . '))).nodeValue;
      return total + (typeof value === 'number' ? value : 0);
    }, 0);

  // Evaluations are cached by each engine, but the data arrays must stay referentially stable for recharts to skip its own work
  const { costData, co2Data } = useMemo(
    () => ({
      co2Data: scenarios.map((scenario) => ({
        name: scenario.label,
        total: sumRules(scenario, '', [co2TotalRuleSuffix]),
        ...Object.fromEntries(CO2_SERIES.map((series) => [series.key, sumRules(scenario, 'environnement', series.rules)])),
      })),
      costData: scenarios.map((scenario) => ({
        name: scenario.label,
        total: sumRules(scenario, '', [costTotalRuleSuffix]),
        ...Object.fromEntries(COST_SERIES.map((series) => [series.key, sumRules(scenario, 'bilan', series.rules)])),
      })),
    }),
    [scenarios, engines]
  );
  const height = scenarios.length * ROW_HEIGHT_PX + CHART_PADDING_PX;
  const perUnit = isTertiaire ? '' : ' par logement';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <StackedBars title={`Coût annuel${perUnit} (€TTC)`} data={costData} series={COST_SERIES} height={height} unit="€" />
      <StackedBars title={`Émissions de CO2 annuelles${perUnit} (kgCO2e)`} data={co2Data} series={CO2_SERIES} height={height} unit="kg" />
    </div>
  );
}

type StackedBarsProps = {
  title: string;
  data: Record<string, string | number>[];
  series: readonly { color: string; key: string; label: string }[];
  height: number;
  unit: string;
};

function StackedBars({ title, data, series, height, unit }: StackedBarsProps) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-bold">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ bottom: 4, left: 4, right: 56, top: 4 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, name) => [`${formatNumber(Number(value))} ${unit}`, name]}
            labelStyle={{ fontWeight: 700 }}
            contentStyle={{ fontSize: 12 }}
            itemStyle={{ color: '#161616' }}
            // The legend and the neighbouring chart are positioned siblings: lift the tooltip above them
            wrapperStyle={{ pointerEvents: 'none', zIndex: 10 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
          {series.map((item, seriesIndex) => (
            <Bar key={item.key} dataKey={item.key} name={item.label} stackId="total" fill={item.color} stroke="#fff" strokeWidth={1}>
              {seriesIndex === series.length - 1 && (
                <LabelList
                  dataKey="total"
                  position="right"
                  formatter={(value) => formatNumber(Number(value))}
                  style={{ fontSize: 11, fontWeight: 700 }}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
