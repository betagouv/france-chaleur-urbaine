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

/**
 * List mechanisms whose compiled form is unreadable: max/min become a fold of nested conditions over private
 * `$INTERNAL valeur` / `$INTERNAL acc` rules, moyenne a ratio of two sums. `sourceMap.args.valeur` still holds
 * the original operands (parsed, not evaluated), so the mechanism is rebuilt from there.
 */
const LIST_MECANISMS_REBUILT_FROM_SOURCE = ['le maximum de', 'le minimum de', 'moyenne'];

const isBooleanNode = (node: ExplanationNode): boolean =>
  node.kind === 'test' ||
  (node.kind === 'operation' && (COMPARISON_OPERATORS.includes(node.operator) || node.operator === 'et' || node.operator === 'ou')) ||
  typeof node.value === 'boolean';

/**
 * « X = oui » / « X != non » ≡ X and « X = non » / « X != oui » ≡ not X — plumbing compiled from
 * applicable si, non applicable si, est défini and est applicable. Null when the comparison is not of that shape
 * or when X cannot be negated simply.
 */
const collapseBooleanComparison = (operator: string, operands: ExplanationNode[]): ExplanationNode | null => {
  if (operands.length !== 2) {
    return null;
  }
  const constantIndex = operands.findIndex((operand) => operand.kind === 'constant' && typeof operand.value === 'boolean');
  if (constantIndex === -1) {
    return null;
  }
  const other = operands[1 - constantIndex];
  if (!isBooleanNode(other)) {
    return null;
  }
  const keepsValue = (operator === '=') === (operands[constantIndex].value === true);
  return keepsValue ? other : negateNode(other);
};

const normalizeNode = (engine: FCUEngine, rawNode: PublicodesNode): ExplanationNode => {
  const node = unwrapNode(rawNode) as PublicodesNode;
  const unit = node.unit ? formatUnit(node.unit) : '';

  const mecanismName = node.sourceMap?.mecanismName ?? '';
  const foldedOperands = (node.sourceMap as { args?: { valeur?: PublicodesNode[] } } | undefined)?.args?.valeur;
  if (LIST_MECANISMS_REBUILT_FROM_SOURCE.includes(mecanismName) && Array.isArray(foldedOperands)) {
    return {
      // sourceMap operands are not evaluated in place: evaluate them against the current situation
      children: foldedOperands.map((operand) => normalizeNode(engine, engine.evaluate(operand as never) as PublicodesNode)),
      kind: 'mecanism',
      name: mecanismName,
      unit,
      value: node.nodeValue,
    };
  }

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
      if (operator === '=' || operator === '!=') {
        const collapsed = collapseBooleanComparison(operator, operands);
        if (collapsed) {
          // a short-circuited X has no value of its own: the comparison verdict is the best we have
          return collapsed.value === undefined && typeof value === 'boolean' ? { ...collapsed, value } : collapsed;
        }
      }
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

// Flat view: the formula as one line of terms (active branches only) and the list of inputs that actually fed the value

export type FlatToken =
  | Extract<ExplanationNode, { kind: 'reference' }>
  | { kind: 'constant'; value: NodeValue; unit: string }
  | { kind: 'symbol'; text: string }
  /** Opening bracket, labelled by the inlined rule (navigable) or the mechanism name, bare for a sub-operation */
  | { kind: 'open'; dottedName?: RuleName; label?: string }
  | { kind: 'close' };

export type FlatInput = Extract<ExplanationNode, { kind: 'reference' }>;

const FLAT_OPERATOR_SYMBOLS: Record<string, string> = { '-': '−', '*': '×', '**': '^', '/': '÷', '//': '÷' };

/** A reference the reader can act on: a user input (situation / par défaut) or a model constant — never inlined further */
const isLeafReference = (node: Extract<ExplanationNode, { kind: 'reference' }>): boolean =>
  node.provenance !== 'computed' || !node.hasFormula;

export type FlattenOptions = {
  /** Inline computed references that many levels down (their name labels the bracket); inputs are never inlined */
  depth: number;
  /** Drop the terms worth 0 from sums and differences (an aid not granted, a cooling post without cooling, fold seeds…) */
  hideZeroTerms?: boolean;
};

const ADDITIVE_OPERATORS = ['+', '-'];

const isZeroTerm = (node: ExplanationNode) => node.value === 0;

const flattenNode = (engine: FCUEngine, node: ExplanationNode, options: FlattenOptions, parentOperator: string | null): FlatToken[] => {
  switch (node.kind) {
    case 'constant':
      return [node];
    case 'reference': {
      if (options.depth <= 0 || isLeafReference(node)) {
        return [node];
      }
      const formula = buildRuleExplanation(engine, node.dottedName).formula;
      return formula
        ? [
            { dottedName: node.dottedName, kind: 'open', label: node.label },
            ...flattenNode(engine, formula, { ...options, depth: options.depth - 1 }, null),
            { kind: 'close' },
          ]
        : [node];
    }
    case 'operation': {
      const hideZeros = options.hideZeroTerms && ADDITIVE_OPERATORS.includes(node.operator);
      const operands = hideZeros ? node.operands.filter((operand) => !isZeroTerm(operand)) : node.operands;
      if (operands.length === 0) {
        return [{ kind: 'constant', unit: node.unit, value: node.value }];
      }
      // A difference whose first term was dropped keeps its leading minus: « − aides »
      const leadsWithOperator = hideZeros && node.operator === '-' && operands[0] !== node.operands[0];
      const needsParentheses = parentOperator !== null && parentOperator !== node.operator;
      const inner = operands.flatMap((operand, operandIndex) => [
        ...(operandIndex > 0 || leadsWithOperator
          ? [{ kind: 'symbol' as const, text: FLAT_OPERATOR_SYMBOLS[node.operator] ?? node.operator }]
          : []),
        ...flattenNode(engine, operand, options, node.operator),
      ]);
      return needsParentheses ? [{ kind: 'open' }, ...inner, { kind: 'close' }] : inner;
    }
    case 'condition':
      return flattenNode(engine, node.result, options, parentOperator);
    case 'variations': {
      const activeCase = node.cases.find((variationCase) => variationCase.isActive);
      return activeCase
        ? flattenNode(engine, activeCase.result, options, parentOperator)
        : [{ kind: 'constant', unit: node.unit, value: node.value }];
    }
    case 'test':
      return [{ kind: 'symbol', text: node.keyword }, ...flattenNode(engine, node.operand, options, null)];
    case 'mecanism':
      return [
        { kind: 'open', label: node.name },
        ...node.children.flatMap((child, childIndex) => [
          ...(childIndex > 0 ? [{ kind: 'symbol' as const, text: ';' }] : []),
          ...flattenNode(engine, child, options, null),
        ]),
        { kind: 'close' },
      ];
  }
};

/** Linearizes a rule formula: only the branches that were actually taken, operators as symbols, references kept as terms */
export const flattenRuleFormula = (engine: FCUEngine, dottedName: RuleName, options: FlattenOptions): FlatToken[] => {
  const formula = buildRuleExplanation(engine, dottedName).formula;
  return formula ? flattenNode(engine, formula, options, null) : [];
};

export type CalculationStep = {
  dottedName: RuleName;
  tokens: FlatToken[];
  value: NodeValue;
  unit: string;
};

/**
 * The calculation as a chain of one-level formulas, top-down: the rule itself, then every computed rule its formula
 * names, then theirs… each line stays flat (no nesting) and each intermediate rule appears once, where it is first needed.
 */
export const buildCalculationChain = (
  engine: FCUEngine,
  dottedName: RuleName,
  options: Pick<FlattenOptions, 'hideZeroTerms'>
): CalculationStep[] => {
  const steps: CalculationStep[] = [];
  const queued = new Set<RuleName>([dottedName]);
  const queue: RuleName[] = [dottedName];
  while (queue.length > 0) {
    const rule = queue.shift() as RuleName;
    const explanation = buildRuleExplanation(engine, rule);
    if (!explanation.formula) {
      continue;
    }
    const tokens = flattenNode(engine, explanation.formula, { ...options, depth: 0 }, null);
    steps.push({ dottedName: rule, tokens, unit: explanation.unit, value: explanation.value });
    tokens.forEach((token) => {
      if (token.kind === 'reference' && !isLeafReference(token) && !queued.has(token.dottedName)) {
        queued.add(token.dottedName);
        queue.push(token.dottedName);
      }
    });
  }
  return steps;
};

/**
 * Every input that contributed to the value: user inputs and model constants reached through the active branches only
 * (a DPE class or a fuel that the situation rules out never shows up). Deduplicated, user inputs first.
 */
export const collectContributingInputs = (engine: FCUEngine, dottedName: RuleName): FlatInput[] => {
  const inputs = new Map<RuleName, FlatInput>();
  const visited = new Set<RuleName>([dottedName]);
  const visit = (node: ExplanationNode) => {
    switch (node.kind) {
      case 'reference':
        if (isLeafReference(node)) {
          inputs.set(node.dottedName, node);
        } else if (!visited.has(node.dottedName)) {
          visited.add(node.dottedName);
          const formula = buildRuleExplanation(engine, node.dottedName).formula;
          if (formula) {
            visit(formula);
          }
        }
        return;
      case 'operation':
        node.operands.forEach(visit);
        return;
      case 'condition':
        visit(node.result);
        return;
      case 'variations':
        node.cases.filter((variationCase) => variationCase.isActive).forEach((variationCase) => visit(variationCase.result));
        return;
      case 'test':
        visit(node.operand);
        return;
      case 'mecanism':
        node.children.forEach(visit);
        return;
      case 'constant':
        return;
    }
  };
  const rootFormula = buildRuleExplanation(engine, dottedName).formula;
  if (rootFormula) {
    visit(rootFormula);
  }
  const provenanceOrder: Record<Provenance, number> = { computed: 2, default: 1, situation: 0 };
  return [...inputs.values()].sort(
    (inputA, inputB) =>
      provenanceOrder[inputA.provenance] - provenanceOrder[inputB.provenance] || inputA.dottedName.localeCompare(inputB.dottedName, 'fr')
  );
};

// Sources: where a rule value comes from. Structured `références` first, then the free-text `note` written as « Source : … — URL ».

export type RuleSource = {
  label: string;
  url?: string;
  /** The note as written in the model, for tooltips */
  raw: string;
  /** Set when the rule has no source of its own and only re-exposes another rule (« valeur: autre règle »): the rule that holds it */
  inheritedFrom?: RuleName;
};

const URL_PATTERN = /https?:\/\/[^\s)]+/g;
const SOURCE_PREFIX = /^\s*sources?\s*[:：]\s*/i;
const TRAILING_SEPARATORS = /[\s—–\-|,;:(]+$/;

/**
 * Reads a source out of a free-text note. A note is a source when it starts with « Source : » or contains a URL;
 * anything else is a remark and yields nothing. The label is the text without the URL and without the prefix.
 */
export const parseSourceNote = (note: string): RuleSource | undefined => {
  const urls = note.match(URL_PATTERN) ?? [];
  if (urls.length === 0 && !SOURCE_PREFIX.test(note)) {
    return undefined;
  }
  // The label is what precedes the first URL; what follows (edition, remarks) stays in `raw` for the tooltip
  const label = (urls[0] ? note.slice(0, note.indexOf(urls[0])) : note).replace(SOURCE_PREFIX, '').replace(TRAILING_SEPARATORS, '').trim();
  return { label: label || (urls[0] ?? note), raw: note, ...(urls[0] ? { url: urls[0] } : {}) };
};

const getOwnRuleSources = (engine: FCUEngine, dottedName: RuleName): RuleSource[] => {
  try {
    const rawNode = engine.getRule(dottedName).rawNode;
    const references = rawNode.références;
    if (references && Object.keys(references).length > 0) {
      return Object.entries(references).map(([label, url]) => ({ label, raw: `${label} — ${url}`, url }));
    }
    const source = rawNode.note ? parseSourceNote(rawNode.note) : undefined;
    return source ? [source] : [];
  } catch {
    return [];
  }
};

/** The rule this one merely re-exposes (its active formula is a bare reference), if any — undefined once a situation value overrides it */
const getAliasTarget = (engine: FCUEngine, dottedName: RuleName): RuleName | undefined => {
  const formula = buildRuleExplanation(engine, dottedName).formula;
  return formula?.kind === 'reference' ? formula.dottedName : undefined;
};

/**
 * Sources of a rule: its `références` entries, else its parsed `note`, else the sources of the rule it is an alias of
 * (transitively, so a user parameter defaulting to an address-derived value shows the survey that value comes from).
 */
export const getRuleSources = (engine: FCUEngine, dottedName: RuleName, visited: ReadonlySet<RuleName> = new Set()): RuleSource[] => {
  const own = getOwnRuleSources(engine, dottedName);
  if (own.length > 0) {
    return own;
  }
  const target = getAliasTarget(engine, dottedName);
  return target && !visited.has(target)
    ? getRuleSources(engine, target, new Set([...visited, dottedName])).map((source) => ({
        ...source,
        inheritedFrom: source.inheritedFrom ?? target,
      }))
    : [];
};

export type RuleAnnotation = {
  sources: RuleSource[];
  /** The rule's own note when it is not a source: a justification of the formula or of the value */
  remark?: string;
};

/** What justifies a rule: its sources, or else its free-text note (a justification of the formula, a caveat…) */
export const getRuleAnnotation = (engine: FCUEngine, dottedName: RuleName): RuleAnnotation => {
  const sources = getRuleSources(engine, dottedName);
  if (sources.length > 0) {
    return { sources };
  }
  try {
    const note = engine.getRule(dottedName).rawNode.note;
    return note ? { remark: note, sources } : { sources };
  } catch {
    return { sources };
  }
};
