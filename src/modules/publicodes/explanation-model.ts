import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import type Engine from 'publicodes';

import { formatNodeValue, formatUnit, type PublicodesNodeValue } from './format';

export type NodeValue = PublicodesNodeValue;

export type Provenance = 'situation' | 'default' | 'computed';

export type ExplanationNode =
  | {
      kind: 'reference';
      dottedName: RuleName;
      label: string;
      value: NodeValue;
      unit: string;
      provenance: Provenance;
      hasFormula: boolean;
      /** true when a situation value overrides a value the model would compute — expanding shows the model value */
      hasOverriddenValue: boolean;
    }
  | { kind: 'constant'; value: NodeValue; unit: string }
  | { kind: 'operation'; operator: string; operands: ExplanationNode[]; value: NodeValue; unit: string }
  | { kind: 'condition'; condition: ExplanationNode; isConditionTrue: boolean; result: ExplanationNode; value: NodeValue; unit: string }
  | { kind: 'test'; keyword: string; operand: ExplanationNode; value: NodeValue }
  | { kind: 'variations'; cases: ExplanationVariationCase[]; value: NodeValue; unit: string }
  | { kind: 'mecanism'; name: string; children: ExplanationNode[]; value: NodeValue; unit: string };

export type ExplanationVariationCase = {
  /** null = the "sinon" fallback case */
  condition: ExplanationNode | null;
  result: ExplanationNode;
  isActive: boolean;
};

export type RuleExplanation = {
  dottedName: string;
  description: string | undefined;
  value: NodeValue;
  unit: string;
  provenance: Provenance;
  /** null = leaf: the value comes directly from the situation or a constant, there is no formula to show */
  formula: ExplanationNode | null;
  /** set when a situation value overrides a value the model would otherwise compute: the model value */
  overriddenModelValue?: NodeValue;
};

/** Loose structural view of publicodes AST nodes — the lib does not export usable node types */
type PublicodesNode = {
  nodeKind?: string;
  nodeValue?: NodeValue;
  unit?: { numerators: string[]; denominators: string[] };
  explanation?: any;
  sourceMap?: { mecanismName?: string };
  dottedName?: string;
  title?: string;
  name?: string;
  operationKind?: string;
  type?: { type?: string };
  rawNode?: unknown;
  private?: boolean;
};

export type FCUEngine = Engine<RuleName>;

/** Some rules (private, virtual $SITUATION…) cannot be evaluated from outside the engine — never let that crash the display */
const safeEvaluate = (engine: FCUEngine, dottedName: RuleName): PublicodesNode | undefined => {
  try {
    return engine.evaluate(dottedName) as PublicodesNode;
  } catch {
    return undefined;
  }
};

const getRuleDescription = (engine: FCUEngine, dottedName: RuleName): string | undefined => {
  try {
    return engine.getRule(dottedName).rawNode.description;
  } catch {
    return undefined;
  }
};

/**
 * Builds a display-oriented explanation of a rule from the evaluated publicodes AST:
 * value, provenance (user input / default / computed) and a normalized formula tree.
 */
export const buildRuleExplanation = (engine: FCUEngine, dottedName: RuleName): RuleExplanation => {
  const evaluated = safeEvaluate(engine, dottedName) ?? ({} as PublicodesNode);
  const provenance = getRuleProvenance(engine, dottedName);
  const innerFormula = unwrapNode(evaluated.explanation?.valeur);
  const formula = provenance === 'situation' || !innerFormula ? null : normalizeNode(engine, innerFormula);

  return {
    description: getRuleDescription(engine, dottedName),
    dottedName,
    formula: formula?.kind === 'constant' ? null : formula,
    overriddenModelValue: provenance === 'situation' ? getOverriddenModelValue(engine, dottedName, evaluated.nodeValue) : undefined,
    provenance,
    unit: evaluated.unit ? formatUnit(evaluated.unit) : '',
    value: evaluated.nodeValue,
  };
};

/** Evaluates the rule as if it were absent from the situation, to reveal the model value a user input overrides */
const getOverriddenModelValue = (engine: FCUEngine, dottedName: RuleName, situationValue: NodeValue): NodeValue => {
  try {
    const modelValue = (engine.evaluate({ contexte: { [dottedName]: 'non défini' }, valeur: dottedName }) as PublicodesNode).nodeValue;
    return modelValue !== undefined && modelValue !== null && modelValue !== situationValue ? modelValue : undefined;
  } catch {
    return undefined;
  }
};

export const getRuleProvenance = (engine: FCUEngine, dottedName: RuleName): Provenance => {
  if (dottedName in engine.getSituation()) {
    return 'situation';
  }
  try {
    return engine.getRule(dottedName).rawNode['par défaut'] !== undefined ? 'default' : 'computed';
  } catch {
    return 'computed';
  }
};

/** Compiler conditions whose active branch is the only thing worth showing (their si is internal plumbing) */
const TRANSPARENT_CONDITION_MECANISMS = ['dans la situation', 'par défaut'];

/** Skips AST wrappers that carry no meaning for the reader ($SITUATION / par défaut conditions, unit conversions, variable manquante) */
const unwrapNode = (node: PublicodesNode | undefined): PublicodesNode | undefined => {
  if (!node) {
    return node;
  }
  if (node.nodeKind === 'condition' && TRANSPARENT_CONDITION_MECANISMS.includes(node.sourceMap?.mecanismName ?? '')) {
    // si undefined = branche court-circuitée non évaluée : on préfère la formule (alors) à la référence $SITUATION (sinon)
    const branch = node.explanation.si?.nodeValue === false ? node.explanation.sinon : node.explanation.alors;
    return unwrapNode(branch);
  }
  if (node.nodeKind === 'unité' || node.nodeKind === 'simplifier unité' || node.nodeKind === 'variable manquante') {
    return unwrapNode(node.explanation);
  }
  return node;
};

const ASSOCIATIVE_OPERATORS = ['+', '*', 'et', 'ou'];

export const COMPARISON_OPERATORS = ['=', '!=', '<', '<=', '>', '>='];

const computeComparisonValue = (operator: string, left: NodeValue, right: NodeValue): NodeValue => {
  if (left === undefined || left === null || right === undefined || right === null) {
    return undefined;
  }
  if (operator === '=' || operator === '!=') {
    // formatNodeValue canonise les chaînes publicodes (avec ou sans apostrophes)
    const isEqual = formatNodeValue(left) === formatNodeValue(right);
    return operator === '=' ? isEqual : !isEqual;
  }
  if (typeof left !== 'number' || typeof right !== 'number') {
    return undefined;
  }
  return operator === '<' ? left < right : operator === '<=' ? left <= right : operator === '>' ? left > right : left >= right;
};

const isBooleanConstant = (candidate: PublicodesNode | undefined): candidate is PublicodesNode =>
  candidate?.nodeKind === 'constant' && typeof candidate.nodeValue === 'boolean';

const NEGATED_TEST_KEYWORDS: Record<string, string> = {
  'est applicable': 'est non applicable',
  'est défini': 'est non défini',
  'est non applicable': 'est applicable',
  'est non défini': 'est défini',
};

const NEGATED_COMPARISON_OPERATORS: Record<string, string> = { '!=': '=', '<': '>=', '<=': '>', '=': '!=', '>': '<=', '>=': '<' };

/** Logical negation of a test or comparison node; null when the node cannot be negated simply */
const negateNode = (node: ExplanationNode): ExplanationNode | null => {
  const negatedValue = typeof node.value === 'boolean' ? !node.value : node.value;
  if (node.kind === 'test' && NEGATED_TEST_KEYWORDS[node.keyword]) {
    return { ...node, keyword: NEGATED_TEST_KEYWORDS[node.keyword], value: negatedValue };
  }
  if (node.kind === 'operation' && NEGATED_COMPARISON_OPERATORS[node.operator]) {
    return { ...node, operator: NEGATED_COMPARISON_OPERATORS[node.operator], value: negatedValue };
  }
  return null;
};

const computeTestValue = (testKind: string, operandValue: NodeValue): NodeValue => {
  switch (testKind) {
    case 'est non défini':
      return operandValue === undefined;
    case 'est défini':
      return operandValue !== undefined;
    case 'est non applicable':
      return operandValue === null;
    case 'est applicable':
      return operandValue !== null && operandValue !== undefined;
    default:
      return undefined;
  }
};

/**
 * Fold seeds injected by mechanisms (null for somme, 1 for produit, oui for toutes ces conditions…):
 * either compiler-made (no rawNode) or a neutral element of the operator — noise for the reader.
 */
const isNeutralOperand = (node: PublicodesNode, operator: string): boolean =>
  node.nodeKind === 'constant' &&
  (node.rawNode === undefined || (operator === 'et' && node.nodeValue === true) || (operator === 'ou' && node.nodeValue === false));

const normalizeNode = (engine: FCUEngine, rawNode: PublicodesNode): ExplanationNode => {
  const node = unwrapNode(rawNode) as PublicodesNode;
  const unit = node.unit ? formatUnit(node.unit) : '';

  switch (node.nodeKind) {
    case 'reference': {
      const dottedName = node.dottedName as RuleName;
      // Dans une branche court-circuitée le nœud n'est pas évalué : on évalue la règle isolément (sauf règles privées)
      const standalone = node.nodeValue === undefined && !node.private ? safeEvaluate(engine, dottedName) : undefined;
      return {
        ...getReferenceMeta(engine, dottedName),
        dottedName,
        kind: 'reference',
        label: node.name ?? dottedName,
        unit: standalone?.unit ? formatUnit(standalone.unit) : unit,
        value: standalone ? standalone.nodeValue : node.nodeValue,
      };
    }
    case 'constant':
      return { kind: 'constant', unit, value: node.nodeValue };
    case 'operation': {
      const operator = node.operationKind as string;
      const rawOperands = flattenOperands(node, operator).filter((operand) => !isNeutralOperand(operand, operator));
      // Un seul opérande restant après retrait des constantes neutres → l'opération ne montre rien
      if (rawOperands.length === 1) {
        return normalizeNode(engine, rawOperands[0]);
      }
      const operands = rawOperands.map((operand) => normalizeNode(engine, operand));
      // Comparaison court-circuitée (non évaluée) : on calcule le verdict depuis les valeurs des opérandes
      const value =
        node.nodeValue === undefined && COMPARISON_OPERATORS.includes(operator)
          ? computeComparisonValue(operator, operands[0].value, operands[1].value)
          : node.nodeValue;
      return { kind: 'operation', operands, operator, unit, value };
    }
    case 'condition': {
      // « si C alors oui sinon non » (plomberie compilée de applicable si / remplace) ≡ C ; « alors non sinon oui » ≡ C inversée
      const alorsBranch = unwrapNode(node.explanation.alors);
      const sinonBranch = unwrapNode(node.explanation.sinon);
      if (isBooleanConstant(alorsBranch) && isBooleanConstant(sinonBranch) && alorsBranch.nodeValue !== sinonBranch.nodeValue) {
        const conditionNode = normalizeNode(engine, node.explanation.si);
        const collapsed = alorsBranch.nodeValue === true ? conditionNode : negateNode(conditionNode);
        if (collapsed) {
          return typeof node.nodeValue === 'boolean' ? { ...collapsed, value: node.nodeValue } : collapsed;
        }
      }
      const isConditionTrue = node.explanation.si?.nodeValue === true;
      const activeBranch = isConditionTrue ? node.explanation.alors : node.explanation.sinon;
      return {
        condition: normalizeNode(engine, node.explanation.si),
        isConditionTrue,
        kind: 'condition',
        result: normalizeNode(engine, activeBranch),
        unit,
        value: node.nodeValue,
      };
    }
    case 'variations': {
      const branches = node.explanation as { condition: PublicodesNode; consequence: PublicodesNode }[];
      // Un "sinon" final a une condition constante à true : seul le premier cas vrai est retenu
      const activeIndex = branches.findIndex((branch) => branch.condition.nodeValue === true);
      return {
        cases: branches.map((branch, branchIndex) => ({
          condition: branch.condition.nodeKind === 'constant' ? null : normalizeNode(engine, branch.condition),
          isActive: branchIndex === activeIndex,
          result: normalizeNode(engine, branch.consequence),
        })),
        kind: 'variations',
        unit,
        value: node.nodeValue,
      };
    }
    case 'est non défini':
    case 'est défini':
    case 'est non applicable':
    case 'est applicable': {
      const operand = normalizeNode(engine, node.explanation);
      // Test court-circuité (non évalué) : verdict approché depuis la valeur isolée de l'opérande
      const value = node.nodeValue !== undefined ? node.nodeValue : computeTestValue(node.nodeKind, operand.value);
      return { keyword: node.nodeKind, kind: 'test', operand, value };
    }
    default:
      return {
        children: extractChildNodes(node).map((child) => normalizeNode(engine, child)),
        kind: 'mecanism',
        name: node.sourceMap?.mecanismName ?? node.nodeKind ?? 'mécanisme',
        unit,
        value: node.nodeValue,
      };
  }
};

/** A rule whose formula is a bare constant brings nothing to expand */
const isConstantRule = (engine: FCUEngine, dottedName: RuleName): boolean => {
  const evaluated = engine.evaluate(dottedName) as PublicodesNode;
  return unwrapNode((evaluated.explanation as { valeur?: PublicodesNode })?.valeur)?.nodeKind === 'constant';
};

const getReferenceMeta = (
  engine: FCUEngine,
  dottedName: RuleName
): { hasFormula: boolean; hasOverriddenValue: boolean; provenance: Provenance } => {
  const provenance = getRuleProvenance(engine, dottedName);
  try {
    if (provenance === 'situation') {
      const situationValue = (engine.evaluate(dottedName) as PublicodesNode).nodeValue;
      return {
        hasFormula: false,
        hasOverriddenValue: getOverriddenModelValue(engine, dottedName, situationValue) !== undefined,
        provenance,
      };
    }
    return { hasFormula: !isConstantRule(engine, dottedName), hasOverriddenValue: false, provenance };
  } catch {
    return { hasFormula: false, hasOverriddenValue: false, provenance };
  }
};

/** Builds a standalone reference node for a rule, e.g. for the "used by" list of the rule browser */
export const buildReferenceNode = (engine: FCUEngine, dottedName: RuleName): Extract<ExplanationNode, { kind: 'reference' }> => {
  const evaluated = safeEvaluate(engine, dottedName);
  return {
    ...getReferenceMeta(engine, dottedName),
    dottedName,
    kind: 'reference',
    label: dottedName,
    unit: evaluated?.unit ? formatUnit(evaluated.unit) : '',
    value: evaluated?.nodeValue,
  };
};

/** Public rules that reference the given rule, via the engine's reverse dependency index */
export const getRuleUsages = (engine: FCUEngine, dottedName: RuleName): RuleName[] => {
  // baseContext est une API semi-interne mais stable de publicodes v1 (utilisée par @publicodes/react-ui)
  const rulesThatUse = (engine as { baseContext?: { referencesMaps?: { rulesThatUse?: Map<string, Set<string>> } } }).baseContext
    ?.referencesMaps?.rulesThatUse;
  const users = rulesThatUse?.get(dottedName);
  return users ? ([...users].filter((user) => !user.endsWith('$SITUATION') && isPublicRule(engine, user)).sort() as RuleName[]) : [];
};

const isPublicRule = (engine: FCUEngine, dottedName: string): boolean => {
  try {
    return !engine.getRule(dottedName as RuleName).private;
  } catch {
    return false;
  }
};

/** Flattens nested chains of the same associative operator: (a + b) + c → [a, b, c] */
const flattenOperands = (node: PublicodesNode, operator: string): PublicodesNode[] => {
  const [left, right] = node.explanation as [PublicodesNode, PublicodesNode];
  const flattenSide = (side: PublicodesNode): PublicodesNode[] => {
    const unwrapped = unwrapNode(side) as PublicodesNode;
    return ASSOCIATIVE_OPERATORS.includes(operator) && unwrapped.nodeKind === 'operation' && unwrapped.operationKind === operator
      ? flattenOperands(unwrapped, operator)
      : [unwrapped];
  };
  return [...flattenSide(left), ...flattenSide(right)];
};

/** Generic fallback: collects every AST child of an unhandled mechanism node */
const extractChildNodes = (node: PublicodesNode): PublicodesNode[] => {
  const explanation = node.explanation;
  if (!explanation || typeof explanation !== 'object') {
    return [];
  }
  const candidates = Array.isArray(explanation) ? explanation : Object.values(explanation);
  return candidates.filter(
    (candidate): candidate is PublicodesNode => !!candidate && typeof candidate === 'object' && 'nodeKind' in candidate
  );
};
