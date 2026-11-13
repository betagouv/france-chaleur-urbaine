import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';

import { getRuleLabel } from '@/components/form/publicodes/labels';
import type { FCUEngine } from '@/modules/publicodes/explanation-model';
import type { SimulatorSituation } from '@/modules/simulator/constants';
import { upperCaseFirstChar } from '@/utils/strings';

import { addresseToPublicodesRules, modesDeChauffage } from '../mappings';

export type ModePublicodesKey = (typeof modesDeChauffage)[number]['publicodesKey'];

/** A column of the comparison: one heating mode evaluated with its own parameter overrides on top of the shared context */
export type Scenario = {
  id: string;
  label: string;
  mode: ModePublicodesKey;
  overrides: SimulatorSituation;
};

export const costRows = [
  { key: 'P1abo', label: 'Abonnement (P1 abo)' },
  { key: 'P1conso', label: 'Consommation chauffage (P1 conso)' },
  { key: 'P1ECS', label: 'Consommation ECS (P1 ECS)' },
  { key: 'P1prime', label: "Électricité des auxiliaires (P1')" },
  { key: 'P1Consofroid', label: 'Consommation froid' },
  { key: 'P2', label: 'Petit entretien (P2)' },
  { key: 'P3', label: 'Gros entretien (P3)' },
  { key: 'P4 moins aides', label: 'Investissement annualisé net (P4 − aides)' },
  { key: 'aides', label: 'Aides perçues' },
] as const;

export const costTotalRuleSuffix = 'bilan . total avec aides';

export const co2Rows = [
  { key: 'scope 1', label: 'Directes (scope 1)' },
  { key: 'scope 2', label: 'Indirectes, énergie (scope 2)' },
  { key: 'scope 3', label: 'Indirectes, matériel (scope 3)' },
] as const;

export const co2TotalRuleSuffix = 'environnement . total';

/** Namespaces evaluated once for every scenario: editing them belongs to the shared context, not to a scenario */
const SHARED_CONTEXT_NAMESPACES = ['climat', 'bâtiment', 'besoins', 'ecs', 'climatisation', 'dimensionnement'];

export const getScenarioRule = (mode: ModePublicodesKey, suffix: string) => `${mode} . ${suffix}` as RuleName;

export const getModeLabel = (mode: ModePublicodesKey) => modesDeChauffage.find((item) => item.publicodesKey === mode)?.label ?? mode;

/** Namespace heading: the heating mode label when the namespace is a mode, otherwise the capitalized namespace */
export const getNamespaceLabel = (namespace: string) =>
  modesDeChauffage.find((item) => item.publicodesKey === namespace)?.label ?? upperCaseFirstChar(namespace);

/** Builds an isolated engine for a scenario: shared parsed rules, own situation (shared context + overrides) and own cache */
export const createScenarioEngine = (baseEngine: FCUEngine, baseSituation: SimulatorSituation, scenario: Scenario): FCUEngine => {
  const scenarioEngine = baseEngine.shallowCopy();
  const situation = Object.fromEntries(
    Object.entries({ ...baseSituation, ...scenario.overrides }).filter(([, value]) => value !== null && value !== undefined)
  );
  scenarioEngine.setSituation(situation);
  return scenarioEngine;
};

/** `referencesIn` is a semi-internal but stable publicodes v1 map (rule → rules it references), also used by @publicodes/react-ui */
const getReferencesInMap = (engine: FCUEngine) =>
  (engine as { baseContext?: { referencesMaps?: { referencesIn?: Map<string, Set<string>> } } }).baseContext?.referencesMaps?.referencesIn;

export type InfluentialInputGroup = {
  namespace: string;
  isSharedContext: boolean;
  rules: RuleName[];
};

/**
 * Walks the dependency graph down from the target rules and keeps every user-facing input (a rule with a label)
 * that influences them, grouped by namespace: the mode's own parameters first, then fuels, finance, aids, then the shared context.
 */
export const getInfluentialInputs = (engine: FCUEngine, mode: ModePublicodesKey, targetRules: RuleName[]): InfluentialInputGroup[] => {
  const referencesIn = getReferencesInMap(engine);
  const visited = new Set<string>();
  const queue: string[] = [...targetRules];
  while (queue.length > 0) {
    const rule = queue.pop() as string;
    if (visited.has(rule)) {
      continue;
    }
    visited.add(rule);
    referencesIn?.get(rule)?.forEach((reference) => {
      if (!visited.has(reference)) {
        queue.push(reference);
      }
    });
  }

  const inputs = [...visited]
    .filter((rule): rule is RuleName => getRuleLabel(rule) !== undefined && !(rule in addresseToPublicodesRules))
    .sort((ruleA, ruleB) => ruleA.localeCompare(ruleB, 'fr'));

  const namespaceOrder = (namespace: string) =>
    namespace === mode
      ? 0
      : ['combustibles', 'investissement', 'amortissement', 'aides', 'ecs additionnelle'].includes(namespace)
        ? 1
        : SHARED_CONTEXT_NAMESPACES.includes(namespace)
          ? 3
          : 2;

  const groups = inputs.reduce<Map<string, RuleName[]>>((accumulator, rule) => {
    const namespace = rule.split(' . ')[0];
    accumulator.set(namespace, [...(accumulator.get(namespace) ?? []), rule]);
    return accumulator;
  }, new Map());

  return [...groups.entries()]
    .map(([namespace, rules]) => ({ isSharedContext: SHARED_CONTEXT_NAMESPACES.includes(namespace), namespace, rules }))
    .sort((groupA, groupB) => namespaceOrder(groupA.namespace) - namespaceOrder(groupB.namespace));
};

export const countOverrides = (scenario: Scenario) =>
  Object.values(scenario.overrides).filter((value) => value !== null && value !== undefined && value !== '').length;
