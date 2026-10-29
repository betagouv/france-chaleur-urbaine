import Engine from 'publicodes';
import { describe, expect, it } from 'vitest';

import {
  buildCalculationChain,
  buildRuleExplanation,
  collectContributingInputs,
  type ExplanationNode,
  type FCUEngine,
  flattenRuleFormula,
  getRuleAnnotation,
  getRuleSources,
  parseSourceNote,
  type RuleExplanation,
} from './explanation-model';

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

describe('flattenRuleFormula', () => {
  const rules = {
    a: 10,
    b: { 'par défaut': 20 },
    product: { valeur: '(a + b) * 2' },
    sum: { somme: ['a', 'b'] },
    total: { valeur: 'sum * 2' },
    withCondition: { 'applicable si': 'a > 5', valeur: 'total' },
  };
  const symbol = (text: string) => ({ kind: 'symbol', text });
  const input = (dottedName: string, value: number, provenance: 'computed' | 'default') => ({
    ...reference(dottedName, value),
    provenance,
  });

  it('keeps computed references as terms at depth 0', () => {
    expect(flattenRuleFormula(createEngine(rules), 'total' as never, { depth: 0 })).toStrictEqual([
      reference('sum', 30, true),
      symbol('×'),
      constant(2),
    ]);
  });

  it('inlines computed references at depth 1 but never user inputs', () => {
    expect(flattenRuleFormula(createEngine(rules), 'total' as never, { depth: 1 })).toStrictEqual([
      { dottedName: 'sum', kind: 'open', label: 'sum' },
      input('a', 10, 'computed'),
      symbol('+'),
      input('b', 20, 'default'),
      { kind: 'close' },
      symbol('×'),
      constant(2),
    ]);
  });

  it('brackets a sub-operation of another operator with bare open and close tokens', () => {
    expect(flattenRuleFormula(createEngine(rules), 'product' as never, { depth: 0 })).toStrictEqual([
      { kind: 'open' },
      input('a', 10, 'computed'),
      symbol('+'),
      input('b', 20, 'default'),
      { kind: 'close' },
      symbol('×'),
      constant(2),
    ]);
  });

  it('drops the condition and keeps only the result that was taken', () => {
    expect(flattenRuleFormula(createEngine(rules), 'withCondition' as never, { depth: 0 })).toStrictEqual([reference('total', 60, true)]);
  });
});

describe('flattenRuleFormula with hideZeroTerms', () => {
  const rules = { a: 10, diff: { valeur: 'zero - a' }, sum: { valeur: 'a + zero' }, zero: 0 };
  const symbol = (text: string) => ({ kind: 'symbol', text });

  it('drops the zero terms of a sum', () => {
    expect(flattenRuleFormula(createEngine(rules), 'sum' as never, { depth: 0, hideZeroTerms: true })).toStrictEqual([reference('a', 10)]);
  });

  it('keeps a leading minus when the first term of a difference is dropped', () => {
    expect(flattenRuleFormula(createEngine(rules), 'diff' as never, { depth: 0, hideZeroTerms: true })).toStrictEqual([
      symbol('−'),
      reference('a', 10),
    ]);
  });
});

describe('buildCalculationChain', () => {
  it('lists the rule then each computed rule it names, once, top-down, without inputs', () => {
    const rules = {
      a: 10,
      b: { 'par défaut': 20 },
      double: { valeur: 'sum * 2' },
      sum: { valeur: 'a + b' },
      total: { valeur: 'double + sum' },
    };
    const symbol = (text: string) => ({ kind: 'symbol', text });

    expect(buildCalculationChain(createEngine(rules), 'total' as never, {})).toStrictEqual([
      { dottedName: 'total', tokens: [reference('double', 60, true), symbol('+'), reference('sum', 30, true)], unit: '', value: 90 },
      { dottedName: 'double', tokens: [reference('sum', 30, true), symbol('×'), constant(2)], unit: '', value: 60 },
      {
        dottedName: 'sum',
        tokens: [reference('a', 10), symbol('+'), { ...reference('b', 20), provenance: 'default' }],
        unit: '',
        value: 30,
      },
    ]);
  });
});

describe('collectContributingInputs', () => {
  it('lists user inputs first, then model constants, through the active branches only', () => {
    const rules = {
      a: 10,
      b: { 'par défaut': 20 },
      pick: { variations: [{ alors: 'b', si: 'a > 5' }, { sinon: 'unused' }] },
      total: { somme: ['a', 'pick'] },
      unused: 99,
    };

    expect(collectContributingInputs(createEngine(rules), 'total' as never)).toStrictEqual([
      { ...reference('b', 20), provenance: 'default' },
      reference('a', 10),
    ]);
  });
});

describe('parseSourceNote', () => {
  const cases: [string, string, ReturnType<typeof parseSourceNote>][] = [
    [
      'label and url',
      'Source : INIES 2022 — https://www.inies.fr/',
      { label: 'INIES 2022', raw: 'Source : INIES 2022 — https://www.inies.fr/', url: 'https://www.inies.fr/' },
    ],
    ['label only', 'Source : ELCIMAI 2024', { label: 'ELCIMAI 2024', raw: 'Source : ELCIMAI 2024' }],
    [
      'url inside a sentence without the prefix',
      'Montant minimal de la prime - Source : Prime | Service-Public.fr — https://www.ecologie.gouv.fr/coup-pouce (2024)',
      {
        label: 'Montant minimal de la prime - Source : Prime | Service-Public.fr',
        raw: 'Montant minimal de la prime - Source : Prime | Service-Public.fr — https://www.ecologie.gouv.fr/coup-pouce (2024)',
        url: 'https://www.ecologie.gouv.fr/coup-pouce',
      },
    ],
    ['plain remark', "durée d'amortissement du raccordement", undefined],
    ['legacy bare label', 'ELCIMAI', undefined],
  ];
  it.each(cases)('%s', (_, note, expected) => expect(parseSourceNote(note)).toStrictEqual(expected));
});

describe('getRuleSources', () => {
  it('prefers structured références over the note', () => {
    const rules = {
      a: { note: 'Source : ignorée', références: { 'Base Empreinte': 'https://base-empreinte.ademe.fr/' }, valeur: 1 },
      b: { note: 'Source : AMORCE 2024', valeur: 2 },
      c: { note: 'une remarque', valeur: 3 },
    };
    const engine = createEngine(rules);

    expect(getRuleSources(engine, 'a' as never)).toStrictEqual([
      { label: 'Base Empreinte', raw: 'Base Empreinte — https://base-empreinte.ademe.fr/', url: 'https://base-empreinte.ademe.fr/' },
    ]);
    expect(getRuleSources(engine, 'b' as never)).toStrictEqual([{ label: 'AMORCE 2024', raw: 'Source : AMORCE 2024' }]);
    expect(getRuleSources(engine, 'c' as never)).toStrictEqual([]);
  });

  it('inherits the source of the rule an alias re-exposes, unless a situation value overrides the alias', () => {
    const rules = {
      alias: { 'par défaut': 'donnée' },
      donnée: { note: 'Source : AMORCE 2024 — https://amorce.asso.fr/', valeur: 5 },
      double: { valeur: 'alias' },
    };
    const engine = createEngine(rules);
    const expected = [
      {
        inheritedFrom: 'donnée',
        label: 'AMORCE 2024',
        raw: 'Source : AMORCE 2024 — https://amorce.asso.fr/',
        url: 'https://amorce.asso.fr/',
      },
    ];

    expect(getRuleSources(engine, 'alias' as never)).toStrictEqual(expected);
    expect(getRuleSources(engine, 'double' as never)).toStrictEqual(expected);

    engine.setSituation({ alias: 7 } as never);
    expect(getRuleSources(engine, 'alias' as never)).toStrictEqual([]);
  });

  it('exposes a non-source note as a remark', () => {
    const engine = createEngine({ a: { note: 'Source : AMORCE 2024', valeur: 1 }, b: { note: 'Taux normal de TVA', valeur: 2 }, c: 3 });

    expect(getRuleAnnotation(engine, 'a' as never)).toStrictEqual({ sources: [{ label: 'AMORCE 2024', raw: 'Source : AMORCE 2024' }] });
    expect(getRuleAnnotation(engine, 'b' as never)).toStrictEqual({ remark: 'Taux normal de TVA', sources: [] });
    expect(getRuleAnnotation(engine, 'c' as never)).toStrictEqual({ sources: [] });
  });
});
