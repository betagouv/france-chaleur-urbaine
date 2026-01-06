import { describe, expect, it } from 'vitest';

import type { DetailedEligibilityStatus } from '@/server/services/addresseInformation';
import type { TestCase } from '@/tests/trpc-helpers';
import { parseExpressionToAST, parseResultActions } from '@/utils/expression-parser';

import { applyParsedRulesToEligibilityData } from './assignment-rules-service';

const createParsedRule = (pattern: string, result: string) => ({
  actions: parseResultActions(result),
  ast: parseExpressionToAST(pattern),
  search_pattern: pattern,
});

const createEligibilityData = (overrides: Partial<DetailedEligibilityStatus> = {}): DetailedEligibilityStatus =>
  ({
    commune: { insee_com: '75001', insee_dep: '75', insee_reg: '11', nom: 'Paris' },
    communes: [],
    departement: { insee_dep: '75', nom: 'Paris' },
    distance: 100,
    eligible: false,
    epci: null,
    ept: null,
    id_fcu: 7501,
    id_sncu: '',
    nom: '',
    pdp: null,
    region: { insee_reg: '11', nom: 'Île-de-France' },
    reseauDeChaleur: null,
    reseauDeChaleurSansTrace: null,
    reseauEnConstruction: null,
    tags: [],
    type: 'reseau_existant_loin',
    zoneEnConstruction: null,
    ...overrides,
  }) as DetailedEligibilityStatus;

const createEligibilityDataForParis = (overrides: Partial<DetailedEligibilityStatus> = {}) =>
  createEligibilityData({ commune: { insee_com: '75001', insee_dep: '75', insee_reg: '11', nom: 'Paris' }, ...overrides });

describe('applyParsedRulesToEligibilityData()', () => {
  describe('tags', () => {
    type TagTestCase = TestCase<{ pattern: string; result: string; dataOverrides?: Partial<DetailedEligibilityStatus> }, string[]>;

    const testCases: TagTestCase[] = [
      {
        expectedOutput: ['TagParis'],
        input: { pattern: 'commune.nom:"Paris"', result: 'tag:"TagParis"' },
        label: 'applique un tag quand la règle correspond',
      },
      {
        expectedOutput: [],
        input: { pattern: 'commune.nom:"Lyon"', result: 'tag:"TagLyon"' },
        label: "n'applique pas de tag quand la règle ne correspond pas",
      },
      {
        expectedOutput: ['SameTag'],
        input: {
          dataOverrides: { eligible: true },
          pattern: 'commune.nom:"Paris" || eligible:"true"',
          result: 'tag:"SameTag"',
        },
        label: 'déduplique les tags',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      const rules = [createParsedRule(input.pattern, input.result)];
      const data = createEligibilityDataForParis(input.dataOverrides);

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toEqual(expectedOutput);
    });

    it('applique plusieurs tags de plusieurs règles', () => {
      const rules = [createParsedRule('commune.nom:"Paris"', 'tag:"Tag1"'), createParsedRule('commune.nom:"Paris"', 'tag:"Tag2"')];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toContain('Tag1');
      expect(result.tags).toContain('Tag2');
    });

    it("applique plusieurs tags d'une même règle", () => {
      const rules = [createParsedRule('commune.nom:"Paris"', 'tag:"Tag1", tag:"Tag2"')];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toContain('Tag1');
      expect(result.tags).toContain('Tag2');
    });
  });

  describe('assignment (affectation)', () => {
    type AssignmentTestCase = TestCase<{ pattern: string; result: string }, string | null>;

    const testCases: AssignmentTestCase[] = [
      {
        expectedOutput: 'GestionnaireA',
        input: { pattern: 'commune.nom:"Paris"', result: 'affecte:"GestionnaireA"' },
        label: 'applique une affectation quand la règle correspond',
      },
      {
        expectedOutput: null,
        input: { pattern: 'commune.nom:"Lyon"', result: 'affecte:"GestionnaireB"' },
        label: "n'applique pas d'affectation quand la règle ne correspond pas",
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      const rules = [createParsedRule(input.pattern, input.result)];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.assignment).toBe(expectedOutput);
    });

    it("prend la première affectation trouvée (pas d'écrasement)", () => {
      const rules = [
        createParsedRule('commune.nom:"Paris"', 'affecte:"Premier"'),
        createParsedRule('commune.nom:"Paris"', 'affecte:"Second"'),
      ];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.assignment).toBe('Premier');
    });
  });

  describe('combinaison tags + affectation', () => {
    it('applique tags et affectation de la même règle', () => {
      const rules = [createParsedRule('commune.nom:"Paris"', 'tag:"TagParis", affecte:"GestionnaireParis"')];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toEqual(['TagParis']);
      expect(result.assignment).toBe('GestionnaireParis');
    });

    it('accumule les tags mais garde la première affectation', () => {
      const rules = [
        createParsedRule('commune.nom:"Paris"', 'tag:"Tag1", affecte:"Premier"'),
        createParsedRule('eligible:"true"', 'tag:"Tag2", affecte:"Second"'),
      ];
      const data = createEligibilityDataForParis({ eligible: true });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toContain('Tag1');
      expect(result.tags).toContain('Tag2');
      expect(result.assignment).toBe('Premier');
    });
  });

  describe('expressions complexes', () => {
    type ComplexExpressionTestCase = TestCase<
      {
        pattern: string;
        result: string;
        testCases: Array<{
          dataOverrides: Partial<DetailedEligibilityStatus>;
          expectedTags: string[];
          label: string;
        }>;
      },
      void
    >;

    const testCases: ComplexExpressionTestCase[] = [
      {
        expectedOutput: undefined,
        input: {
          pattern: 'commune.nom:"Paris" && eligible:"true"',
          result: 'tag:"ParisEligible"',
          testCases: [
            { dataOverrides: { eligible: true }, expectedTags: ['ParisEligible'], label: 'Paris éligible' },
            { dataOverrides: { eligible: false }, expectedTags: [], label: 'Paris non éligible' },
          ],
        },
        label: 'évalue correctement les expressions avec AND (&&)',
      },
      {
        expectedOutput: undefined,
        input: {
          pattern: 'commune.nom:"Paris" || commune.nom:"Lyon"',
          result: 'tag:"GrandeVille"',
          testCases: [
            {
              dataOverrides: { commune: { insee_com: '75001', insee_dep: '75', insee_reg: '11', nom: 'Paris' } },
              expectedTags: ['GrandeVille'],
              label: 'Paris',
            },
            {
              dataOverrides: { commune: { insee_com: '69001', insee_dep: '69', insee_reg: '84', nom: 'Lyon' } },
              expectedTags: ['GrandeVille'],
              label: 'Lyon',
            },
          ],
        },
        label: 'évalue correctement les expressions avec OR (||)',
      },
      {
        expectedOutput: undefined,
        input: {
          pattern: '!commune.nom:"Paris"',
          result: 'tag:"HorsParis"',
          testCases: [
            {
              dataOverrides: { commune: { insee_com: '75001', insee_dep: '75', insee_reg: '11', nom: 'Paris' } },
              expectedTags: [],
              label: 'Paris',
            },
            {
              dataOverrides: { commune: { insee_com: '69001', insee_dep: '69', insee_reg: '84', nom: 'Lyon' } },
              expectedTags: ['HorsParis'],
              label: 'Lyon',
            },
          ],
        },
        label: 'évalue correctement les expressions avec NOT (!)',
      },
    ];

    it.each(testCases)('$label', ({ input }) => {
      const rules = [createParsedRule(input.pattern, input.result)];

      for (const testCase of input.testCases) {
        const data = createEligibilityDataForParis(testCase.dataOverrides);
        const result = applyParsedRulesToEligibilityData(rules, data);
        expect(result.tags).toEqual(testCase.expectedTags);
      }
    });

    it('évalue correctement OR avec Marseille (pas dans la liste)', () => {
      const rules = [createParsedRule('commune.nom:"Paris" || commune.nom:"Lyon"', 'tag:"GrandeVille"')];
      const dataMarseille = createEligibilityData({ commune: { insee_com: '13001', insee_dep: '13', insee_reg: '93', nom: 'Marseille' } });

      expect(applyParsedRulesToEligibilityData(rules, dataMarseille).tags).toEqual([]);
    });
  });

  describe('aucune règle', () => {
    it("retourne des tags vides et assignment null quand il n'y a pas de règles", () => {
      const result = applyParsedRulesToEligibilityData([], createEligibilityData());

      expect(result.tags).toEqual([]);
      expect(result.assignment).toBeNull();
    });
  });
});
