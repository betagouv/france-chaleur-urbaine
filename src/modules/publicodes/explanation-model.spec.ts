import Engine from 'publicodes';
import { describe, expect, it } from 'vitest';

import { buildRuleExplanation, type ExplanationNode, type FCUEngine, type RuleExplanation } from './explanation-model';

const createEngine = (rules: Record<string, unknown>) =>
  new Engine(rules as never, { logger: { error: () => {}, log: () => {}, warn: () => {} } }) as unknown as FCUEngine;

const explain = (rules: Record<string, unknown>, dottedName: string) => buildRuleExplanation(createEngine(rules), dottedName as never);

const reference = (dottedName: string, value: number | null, hasFormula = false): ExplanationNode => ({
  dottedName: dottedName as never,
  hasFormula,
  hasOverriddenValue: false,
  kind: 'reference',
  label: dottedName,
  provenance: 'computed',
  unit: '',
  value,
});

const constant = (value: number | boolean | null): ExplanationNode => ({ kind: 'constant', unit: '', value });

const computedRule = (dottedName: string, value: number | boolean | null, formula: ExplanationNode): RuleExplanation => ({
  description: undefined,
  dottedName,
  formula,
  overriddenModelValue: undefined,
  provenance: 'computed',
  unit: '',
  value,
});

const baseRules = { a: 10, b: 20, c: { 'applicable si': 'non', valeur: 5 } };

describe('buildRuleExplanation', () => {
  describe('list mechanisms rebuilt from their source operands', () => {
    it.each([
      ['le maximum de', 20],
      ['le minimum de', 10],
      ['moyenne', 15],
    ])('shows the original operands of "%s" instead of the compiled form', (mecanism, expectedValue) => {
      const rules = { ...baseRules, m: { [mecanism]: ['a', 'b', 'c'] } };

      const explanation = explain(rules, 'm');

      expect(explanation).toStrictEqual(
        computedRule('m', expectedValue, {
          children: [reference('a', 10), reference('b', 20), reference('c', null, true)],
          kind: 'mecanism',
          name: mecanism,
          unit: '',
          value: expectedValue,
        })
      );
    });
  });

  describe('boolean comparisons compiled from applicability mechanisms', () => {
    it('shows "applicable si: C" as the condition C itself', () => {
      const rules = { ...baseRules, r: { 'applicable si': 'b > 5', valeur: 'a' } };

      const explanation = explain(rules, 'r');

      expect(explanation).toStrictEqual(
        computedRule('r', 10, {
          condition: { kind: 'operation', operands: [reference('b', 20), constant(5)], operator: '>', unit: '', value: true },
          isConditionTrue: true,
          kind: 'condition',
          result: reference('a', 10),
          unit: '',
          value: 10,
        })
      );
    });

    it('shows "non applicable si: C" as the negated condition', () => {
      const rules = { ...baseRules, r: { 'non applicable si': 'b > 5', valeur: 'a' } };

      const explanation = explain(rules, 'r');

      expect(explanation).toStrictEqual(
        computedRule('r', null, {
          condition: { kind: 'operation', operands: [reference('b', 20), constant(5)], operator: '<=', unit: '', value: false },
          isConditionTrue: false,
          kind: 'condition',
          result: constant(null),
          unit: '',
          value: null,
        })
      );
    });

    it.each([
      ['est défini', 'a', reference('a', 10), true],
      ['est applicable', 'c', reference('c', null, true), false],
    ])('shows "%s" as a test instead of a comparison with "non"', (keyword, operand, expectedOperand, expectedValue) => {
      const rules = { ...baseRules, r: { [keyword]: operand } };

      const explanation = explain(rules, 'r');

      expect(explanation).toStrictEqual(
        computedRule('r', expectedValue, { keyword, kind: 'test', operand: expectedOperand, value: expectedValue })
      );
    });
  });
});
