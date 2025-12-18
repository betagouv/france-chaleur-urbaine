import { describe, expect, it } from 'vitest';

import type { DetailedEligibilityStatus } from '@/server/services/addresseInformation';
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
    it('applique un tag quand la règle correspond', () => {
      const rules = [createParsedRule('commune.nom:"Paris"', 'tag:"TagParis"')];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toEqual(['TagParis']);
    });

    it("n'applique pas de tag quand la règle ne correspond pas", () => {
      const rules = [createParsedRule('commune.nom:"Lyon"', 'tag:"TagLyon"')];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toEqual([]);
    });

    it('applique plusieurs tags de plusieurs règles', () => {
      const rules = [createParsedRule('commune.nom:"Paris"', 'tag:"Tag1"'), createParsedRule('commune.nom:"Paris"', 'tag:"Tag2"')];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toContain('Tag1');
      expect(result.tags).toContain('Tag2');
    });

    it('déduplique les tags', () => {
      const rules = [createParsedRule('commune.nom:"Paris"', 'tag:"SameTag"'), createParsedRule('eligible:"true"', 'tag:"SameTag"')];
      const data = createEligibilityDataForParis({ eligible: true });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toEqual(['SameTag']);
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
    it('applique une affectation quand la règle correspond', () => {
      const rules = [createParsedRule('commune.nom:"Paris"', 'affecte:"GestionnaireA"')];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.assignment).toBe('GestionnaireA');
    });

    it("n'applique pas d'affectation quand la règle ne correspond pas", () => {
      const rules = [createParsedRule('commune.nom:"Lyon"', 'affecte:"GestionnaireB"')];
      const data = createEligibilityDataForParis();

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.assignment).toBeNull();
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
    it('évalue correctement les expressions avec AND (&&)', () => {
      const rules = [createParsedRule('commune.nom:"Paris" && eligible:"true"', 'tag:"ParisEligible"')];

      const dataMatch = createEligibilityDataForParis({ eligible: true });
      expect(applyParsedRulesToEligibilityData(rules, dataMatch).tags).toEqual(['ParisEligible']);

      const dataNoMatch = createEligibilityDataForParis({ eligible: false });
      expect(applyParsedRulesToEligibilityData(rules, dataNoMatch).tags).toEqual([]);
    });

    it('évalue correctement les expressions avec OR (||)', () => {
      const rules = [createParsedRule('commune.nom:"Paris" || commune.nom:"Lyon"', 'tag:"GrandeVille"')];

      const dataParis = createEligibilityDataForParis();
      expect(applyParsedRulesToEligibilityData(rules, dataParis).tags).toEqual(['GrandeVille']);

      const dataLyon = createEligibilityDataForParis();
      expect(applyParsedRulesToEligibilityData(rules, dataLyon).tags).toEqual(['GrandeVille']);

      const dataMarseille = createEligibilityData({ commune: { insee_com: '13001', insee_dep: '13', insee_reg: '93', nom: 'Marseille' } });
      expect(applyParsedRulesToEligibilityData(rules, dataMarseille).tags).toEqual([]);
    });

    it('évalue correctement les expressions avec NOT (!)', () => {
      const rules = [createParsedRule('!commune.nom:"Paris"', 'tag:"HorsParis"')];

      const dataParis = createEligibilityDataForParis();
      expect(applyParsedRulesToEligibilityData(rules, dataParis).tags).toEqual([]);

      const dataLyon = createEligibilityData({ commune: { insee_com: '69001', insee_dep: '69', insee_reg: '84', nom: 'Lyon' } });
      expect(applyParsedRulesToEligibilityData(rules, dataLyon).tags).toEqual(['HorsParis']);
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
