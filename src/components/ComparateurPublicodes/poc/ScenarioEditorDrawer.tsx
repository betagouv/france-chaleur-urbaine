import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useEffect, useMemo, useState } from 'react';

import { getRuleLabel } from '@/components/form/publicodes/labels';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Drawer from '@/components/ui/Drawer';
import type { FCUEngine } from '@/modules/publicodes/explanation-model';
import { formatNodeValue, formatUnit } from '@/modules/publicodes/format';
import type { SimulatorSituation } from '@/modules/simulator/constants';
import { upperCaseFirstChar } from '@/utils/strings';

import { getScenarioParamFieldId, ScenarioParamField } from './ScenarioParamField';
import {
  co2TotalRuleSuffix,
  costTotalRuleSuffix,
  getInfluentialInputs,
  getModeLabel,
  getNamespaceLabel,
  getScenarioRule,
  type Scenario,
} from './scenario-model';

type ScenarioEditorDrawerProps = {
  scenario: Scenario | null;
  baseEngine: FCUEngine;
  onClose: () => void;
  onChangeOverrides: (scenarioId: string, overrides: SimulatorSituation) => void;
  onExplain: (rule: RuleName) => void;
};

const isSet = (value: unknown) => value !== null && value !== undefined && value !== '';

/**
 * Side panel listing every input that influences the scenario's cost and CO2 totals (derived from the rule graph,
 * so it stays in sync with the model), grouped by namespace, searchable. The overrides are pinned at the top as chips
 * (click scrolls to the field, × removes the override) and each group header counts its own overrides.
 */
export function ScenarioEditorDrawer({ scenario, baseEngine, onClose, onChangeOverrides, onExplain }: ScenarioEditorDrawerProps) {
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groups = useMemo(
    () =>
      scenario
        ? getInfluentialInputs(baseEngine, scenario.mode, [
            getScenarioRule(scenario.mode, costTotalRuleSuffix),
            getScenarioRule(scenario.mode, co2TotalRuleSuffix),
          ])
        : [],
    [baseEngine, scenario?.mode]
  );

  const overriddenRules = useMemo(
    () => (scenario ? (Object.keys(scenario.overrides) as RuleName[]).filter((rule) => isSet(scenario.overrides[rule])) : []),
    [scenario?.overrides]
  );

  // On opening a scenario: expand its own group and every group that already holds an override
  useEffect(() => {
    if (!scenario) {
      return;
    }
    setExpandedGroups(
      new Set([
        scenario.mode,
        ...groups.filter((group) => group.rules.some((rule) => overriddenRules.includes(rule))).map((group) => group.namespace),
      ])
    );
    setSearch('');
  }, [scenario?.id]);

  if (!scenario) {
    return null;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const matches = (rule: RuleName) =>
    normalizedSearch === '' || `${rule} ${getRuleLabel(rule) ?? ''}`.toLowerCase().includes(normalizedSearch);
  const visibleGroups = groups.map((group) => ({ ...group, rules: group.rules.filter(matches) })).filter((group) => group.rules.length > 0);

  const setOverride = (rule: RuleName, value: string | number | null) =>
    onChangeOverrides(scenario.id, { ...scenario.overrides, [rule]: value });

  const toggleGroup = (namespace: string, expanded: boolean) =>
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (expanded) {
        next.add(namespace);
      } else {
        next.delete(namespace);
      }
      return next;
    });

  const scrollToRule = (rule: RuleName) => {
    setSearch('');
    toggleGroup(rule.split(' . ')[0], true);
    // The group may have just been expanded: scroll once the accordion has rendered its content
    setTimeout(() => document.getElementById(getScenarioParamFieldId(rule))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const formatOverride = (rule: RuleName) => {
    const evaluated = baseEngine.evaluate(rule);
    return `${formatNodeValue(scenario.overrides[rule])}${evaluated.unit ? ` ${formatUnit(evaluated.unit)}` : ''}`;
  };

  return (
    <Drawer open onClose={onClose} direction="right" className="w-[860px]" repositionInputs={false}>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="mb-1 text-xl">{scenario.label}</h3>
          <p className="mb-0 text-sm text-faded">
            {getModeLabel(scenario.mode)} · {groups.reduce((total, group) => total + group.rules.length, 0)} paramètres influencent ce
            résultat
          </p>
        </div>

        <div className="rounded border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold">
              {overriddenRules.length === 0
                ? 'Aucun paramètre modifié : ce scénario utilise les valeurs de base'
                : `${overriddenRules.length} paramètre${overriddenRules.length > 1 ? 's' : ''} modifié${overriddenRules.length > 1 ? 's' : ''}`}
            </span>
            {overriddenRules.length > 0 && (
              <Button priority="tertiary" size="small" onClick={() => onChangeOverrides(scenario.id, {})}>
                Tout réinitialiser
              </Button>
            )}
          </div>
          {overriddenRules.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {overriddenRules.map((rule) => (
                <span key={rule} className="inline-flex items-center gap-1 rounded bg-white pl-2 text-xs ring-1 ring-blue-200">
                  <button type="button" onClick={() => scrollToRule(rule)} className="cursor-pointer py-1 hover:text-blue-700" title={rule}>
                    <span className="text-faded">{upperCaseFirstChar(getRuleLabel(rule) ?? rule)} :</span>{' '}
                    <strong>{formatOverride(rule)}</strong>
                  </button>
                  <Button
                    iconId="fr-icon-close-line"
                    priority="tertiary"
                    size="small"
                    title={`Retirer la modification de ${rule}`}
                    className="min-h-2!"
                    onClick={() => setOverride(rule, null)}
                  />
                </span>
              ))}
            </div>
          )}
        </div>

        <input
          type="search"
          className="fr-input"
          placeholder="Rechercher un paramètre (ex : molécule, rendement, TVA…)"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {visibleGroups.map((group) => {
          const overridesInGroup = group.rules.filter((rule) => overriddenRules.includes(rule)).length;
          return (
            <Accordion
              key={group.namespace}
              small
              bordered
              expanded={normalizedSearch !== '' || expandedGroups.has(group.namespace)}
              onExpandedChange={(expanded) => toggleGroup(group.namespace, expanded)}
              label={
                <span className="flex flex-wrap items-center gap-2">
                  {getNamespaceLabel(group.namespace)}
                  <span className="text-xs font-normal text-faded">
                    {group.rules.length} paramètre{group.rules.length > 1 ? 's' : ''}
                    {group.isSharedContext && ' · contexte commun à tous les scénarios'}
                  </span>
                  {overridesInGroup > 0 && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-800">
                      {overridesInGroup} modifié{overridesInGroup > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              }
            >
              <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
                {group.rules.map((rule) => (
                  <ScenarioParamField
                    key={rule}
                    rule={rule}
                    baseEngine={baseEngine}
                    value={scenario.overrides[rule]}
                    onChange={(value) => setOverride(rule, value)}
                    onExplain={onExplain}
                  />
                ))}
              </div>
            </Accordion>
          );
        })}
      </div>
    </Drawer>
  );
}
