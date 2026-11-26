import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl';
import { useDebouncedEffect } from '@react-hookz/web';
import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button';
import type { FCUEngine } from '@/modules/publicodes/explanation-model';
import { formatNodeValue, formatUnit } from '@/modules/publicodes/format';
import cx from '@/utils/cx';

import { modesDeChauffage } from '../mappings';
import {
  co2Rows,
  co2TotalRuleSuffix,
  costRows,
  costTotalRuleSuffix,
  countOverrides,
  getScenarioRule,
  type ModePublicodesKey,
  type Scenario,
} from './scenario-model';

type ScenariosTableProps = {
  scenarios: Scenario[];
  engines: Record<string, FCUEngine>;
  isTertiaire: boolean;
  onEdit: (scenarioId: string) => void;
  onDuplicate: (scenarioId: string) => void;
  onRemove: (scenarioId: string) => void;
  onRename: (scenarioId: string, label: string) => void;
  onChangeMode: (scenarioId: string, mode: ModePublicodesKey) => void;
  onExplain: (engine: FCUEngine, rule: RuleName) => void;
};

/**
 * Results grid: one fixed-width column per scenario (horizontal scroll, sticky row labels), one row per cost post and CO2 scope.
 * Every figure is clickable and opens the formula explanation evaluated in that scenario's engine; totals carry a proportional bar
 * and the gap to the first column. A synthesis view keeps only the totals when many scenarios are compared.
 */
export function ScenariosTable({
  scenarios,
  engines,
  isTertiaire,
  onEdit,
  onDuplicate,
  onRemove,
  onRename,
  onChangeMode,
  onExplain,
}: ScenariosTableProps) {
  const [showDetails, setShowDetails] = useState(true);

  const getValue = (scenario: Scenario, suffix: string) => {
    const evaluated = engines[scenario.id].evaluate(getScenarioRule(scenario.mode, suffix));
    return {
      unit: evaluated.unit ? formatUnit(evaluated.unit) : '',
      value: typeof evaluated.nodeValue === 'number' ? evaluated.nodeValue : 0,
    };
  };
  const costTotals = scenarios.map((scenario) => getValue(scenario, costTotalRuleSuffix).value);
  const co2Totals = scenarios.map((scenario) => getValue(scenario, co2TotalRuleSuffix).value);
  const maxCost = Math.max(...costTotals, 1);
  const maxCo2 = Math.max(...co2Totals, 1);
  const availableModes = modesDeChauffage.filter((mode) => !isTertiaire || mode.tertiaire);

  // Units are carried by the row label (same rule suffix for every column) so cells stay narrow
  const renderRowLabel = (label: string, suffix: string, bold = false) => (
    <td className={cx('sticky left-0 z-1 bg-white px-2 py-1', bold ? 'font-bold' : 'text-faded')}>
      {label}
      {scenarios.length > 0 && <small className="ml-1 text-xs text-gray-500">{getValue(scenarios[0], suffix).unit}</small>}
    </td>
  );

  const renderCell = (scenario: Scenario, suffix: string, options: { bold?: boolean; signed?: boolean } = {}) => {
    const { value } = getValue(scenario, suffix);
    return (
      <td key={scenario.id} className="px-2 py-1 text-right">
        <button
          type="button"
          onClick={() => onExplain(engines[scenario.id], getScenarioRule(scenario.mode, suffix))}
          title={`Comprendre le calcul de « ${getScenarioRule(scenario.mode, suffix)} »`}
          className={cx(
            'cursor-pointer whitespace-nowrap border border-transparent px-1.5 py-0.5 tabular-nums transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700',
            options.bold && 'font-bold',
            value === 0 && 'text-faded'
          )}
        >
          {options.signed && value > 0 ? '− ' : ''}
          {formatNodeValue(Math.round(value))}
        </button>
      </td>
    );
  };

  const renderGap = (totals: number[], index: number) => {
    if (index === 0 || totals[0] === 0) {
      return <span className="text-xs text-faded">référence</span>;
    }
    const gap = (totals[index] - totals[0]) / totals[0];
    return (
      <span className={cx('text-xs font-bold tabular-nums', gap > 0 ? 'text-error' : gap < 0 ? 'text-success' : 'text-faded')}>
        {gap > 0 ? '+' : ''}
        {Math.round(gap * 100)} % vs réf.
      </span>
    );
  };

  const renderBarRow = (totals: number[], max: number, colorClasses: { reseau: string; other: string }) => (
    <tr>
      <td className="sticky left-0 z-1 bg-white px-2 py-1" />
      {scenarios.map((scenario, index) => (
        <td key={scenario.id} className="px-2 py-2">
          <div className="flex flex-col gap-1">
            <div className="h-2 w-full rounded-xs bg-gray-100">
              <div
                className={cx('h-2 rounded-xs', scenario.mode === 'réseau de chaleur' ? colorClasses.reseau : colorClasses.other)}
                style={{ width: `${Math.round((totals[index] / max) * 100)}%` }}
              />
            </div>
            <div className="text-right">{renderGap(totals, index)}</div>
          </div>
        </td>
      ))}
    </tr>
  );

  const renderSectionRow = (title: string) => (
    <tr className="bg-gray-50">
      <th className="sticky left-0 z-1 bg-gray-50 px-2 py-2 text-left text-sm font-bold">{title}</th>
      <th colSpan={scenarios.length} />
    </tr>
  );

  return (
    <div className="flex flex-col gap-2">
      <SegmentedControl
        hideLegend
        small
        className="self-end"
        segments={[
          { label: 'Détail', nativeInputProps: { checked: showDetails, onChange: () => setShowDetails(true) } },
          { label: 'Synthèse', nativeInputProps: { checked: !showDetails, onChange: () => setShowDetails(false) } },
        ]}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="align-top">
              <th className="sticky left-0 z-1 w-56 min-w-56 bg-white px-2 py-2 text-left font-normal text-faded">Scénario</th>
              {scenarios.map((scenario, index) => {
                const overridesCount = countOverrides(scenario);
                return (
                  <th key={scenario.id} className="w-56 min-w-56 px-2 py-2 text-left font-normal">
                    <div className="flex flex-col gap-1">
                      <ScenarioNameInput
                        label={scenario.label}
                        ariaLabel={`Nom du scénario ${index + 1}`}
                        onCommit={(label) => onRename(scenario.id, label)}
                      />
                      <select
                        className="fr-select text-sm!"
                        value={scenario.mode}
                        onChange={(event) => onChangeMode(scenario.id, event.target.value as ModePublicodesKey)}
                        aria-label={`Mode de chauffage du scénario ${index + 1}`}
                      >
                        {availableModes.map((mode) => (
                          <option key={mode.publicodesKey} value={mode.publicodesKey}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <Button
                          size="small"
                          priority={overridesCount > 0 ? 'primary' : 'secondary'}
                          className="whitespace-nowrap"
                          title={overridesCount > 0 ? `${overridesCount} paramètre(s) modifié(s)` : 'Paramètres du scénario'}
                          onClick={() => onEdit(scenario.id)}
                        >
                          Paramètres{overridesCount > 0 ? ` (${overridesCount})` : ''}
                        </Button>
                        <Button
                          size="small"
                          priority="tertiary"
                          iconId="fr-icon-clipboard-line"
                          title="Dupliquer ce scénario"
                          onClick={() => onDuplicate(scenario.id)}
                        />
                        <Button
                          size="small"
                          priority="tertiary"
                          iconId="fr-icon-delete-line"
                          title="Supprimer ce scénario"
                          disabled={scenarios.length === 1}
                          onClick={() => onRemove(scenario.id)}
                        />
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {renderSectionRow(`Coût annuel${isTertiaire ? '' : ' par logement'}`)}
            {showDetails &&
              costRows.map((row) => (
                <tr key={row.key} className="border-b border-gray-100">
                  {renderRowLabel(row.label, `bilan . ${row.key}`)}
                  {scenarios.map((scenario) => renderCell(scenario, `bilan . ${row.key}`, { signed: row.key === 'aides' }))}
                </tr>
              ))}
            <tr className="border-b-2 border-gray-300">
              {renderRowLabel('Total avec aides', costTotalRuleSuffix, true)}
              {scenarios.map((scenario) => renderCell(scenario, costTotalRuleSuffix, { bold: true }))}
            </tr>
            {renderBarRow(costTotals, maxCost, { other: 'bg-fcu-purple', reseau: 'bg-fcu-green' })}

            {renderSectionRow(`CO2 annuel${isTertiaire ? '' : ' par logement'}`)}
            {showDetails &&
              co2Rows.map((row) => (
                <tr key={row.key} className="border-b border-gray-100">
                  {renderRowLabel(row.label, `environnement . ${row.key}`)}
                  {scenarios.map((scenario) => renderCell(scenario, `environnement . ${row.key}`))}
                </tr>
              ))}
            <tr className="border-b-2 border-gray-300">
              {renderRowLabel('Total', co2TotalRuleSuffix, true)}
              {scenarios.map((scenario) => renderCell(scenario, co2TotalRuleSuffix, { bold: true }))}
            </tr>
            {renderBarRow(co2Totals, maxCo2, { other: 'bg-fcu-orange-light', reseau: 'bg-fcu-green-light' })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ScenarioNameInputProps = { label: string; ariaLabel: string; onCommit: (label: string) => void };

/** Keeps keystrokes local and commits after a pause: a rename must not re-render the whole comparison on every key */
function ScenarioNameInput({ label, ariaLabel, onCommit }: ScenarioNameInputProps) {
  const [draft, setDraft] = useState(label);

  // External change of the label (mode switched, link restored): drop the local draft
  useEffect(() => {
    setDraft(label);
  }, [label]);

  useDebouncedEffect(
    () => {
      if (draft !== label) {
        onCommit(draft);
      }
    },
    [draft],
    300
  );

  return (
    <input
      type="text"
      className="fr-input text-sm! font-bold!"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      aria-label={ariaLabel}
    />
  );
}
