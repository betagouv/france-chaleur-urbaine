import { describe, expect, it } from 'vitest';

import type { DetailedEligibilityStatus } from '@/server/services/addresseInformation';
import { parseExpressionToAST, parseResultActions } from '@/utils/expression-parser';

import { applyParsedRulesToEligibilityData } from './assignment-rules-service';

const createParsedRule = (pattern: string, result: string) => ({
  actions: parseResultActions(result),
  ast: parseExpressionToAST(pattern),
  search_pattern: pattern,
});

const createEligibilityData = (overrides: Partial<DetailedEligibilityStatus> = {}): DetailedEligibilityStatus => ({
  basedOnIris: false,
  city: 'Paris',
  closestNetwork: null,
  closestNetworkDisplayDistance: null,
  closestNetworkDistance: null,
  eligibleDistance: null,
  futurNetwork: null,
  futurNetworkDisplayDistance: null,
  futurNetworkDistance: null,
  gestionnaires: [],
  id_fcu: null,
  inPDP: false,
  inZDP: false,
  isEligible: false,
  isEligibleRdc: false,
  nearestNetwork: null,
  nearestNetworkDistance: null,
  networkLocalization: null,
  reseaux: [],
  type: 'reseau_existant_loin',
  ...overrides,
});

describe('applyParsedRulesToEligibilityData()', () => {
  describe('tags', () => {
    it('applique un tag quand la règle correspond', () => {
      const rules = [createParsedRule('city:"Paris"', 'tag:"TagParis"')];
      const data = createEligibilityData({ city: 'Paris' });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toEqual(['TagParis']);
    });

    it("n'applique pas de tag quand la règle ne correspond pas", () => {
      const rules = [createParsedRule('city:"Lyon"', 'tag:"TagLyon"')];
      const data = createEligibilityData({ city: 'Paris' });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toEqual([]);
    });

    it('applique plusieurs tags de plusieurs règles', () => {
      const rules = [createParsedRule('city:"Paris"', 'tag:"Tag1"'), createParsedRule('city:"Paris"', 'tag:"Tag2"')];
      const data = createEligibilityData({ city: 'Paris' });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toContain('Tag1');
      expect(result.tags).toContain('Tag2');
    });

    it('déduplique les tags', () => {
      const rules = [createParsedRule('city:"Paris"', 'tag:"SameTag"'), createParsedRule('isEligible:"true"', 'tag:"SameTag"')];
      const data = createEligibilityData({ city: 'Paris', isEligible: true });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toEqual(['SameTag']);
    });

    it("applique plusieurs tags d'une même règle", () => {
      const rules = [createParsedRule('city:"Paris"', 'tag:"Tag1", tag:"Tag2"')];
      const data = createEligibilityData({ city: 'Paris' });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toContain('Tag1');
      expect(result.tags).toContain('Tag2');
    });
  });

  describe('assignment (affectation)', () => {
    it('applique une affectation quand la règle correspond', () => {
      const rules = [createParsedRule('city:"Paris"', 'affecte:"GestionnaireA"')];
      const data = createEligibilityData({ city: 'Paris' });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.assignment).toBe('GestionnaireA');
    });

    it("n'applique pas d'affectation quand la règle ne correspond pas", () => {
      const rules = [createParsedRule('city:"Lyon"', 'affecte:"GestionnaireB"')];
      const data = createEligibilityData({ city: 'Paris' });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.assignment).toBeNull();
    });

    it("prend la première affectation trouvée (pas d'écrasement)", () => {
      const rules = [createParsedRule('city:"Paris"', 'affecte:"Premier"'), createParsedRule('city:"Paris"', 'affecte:"Second"')];
      const data = createEligibilityData({ city: 'Paris' });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.assignment).toBe('Premier');
    });
  });

  describe('combinaison tags + affectation', () => {
    it('applique tags et affectation de la même règle', () => {
      const rules = [createParsedRule('city:"Paris"', 'tag:"TagParis", affecte:"GestionnaireParis"')];
      const data = createEligibilityData({ city: 'Paris' });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toEqual(['TagParis']);
      expect(result.assignment).toBe('GestionnaireParis');
    });

    it('accumule les tags mais garde la première affectation', () => {
      const rules = [
        createParsedRule('city:"Paris"', 'tag:"Tag1", affecte:"Premier"'),
        createParsedRule('isEligible:"true"', 'tag:"Tag2", affecte:"Second"'),
      ];
      const data = createEligibilityData({ city: 'Paris', isEligible: true });

      const result = applyParsedRulesToEligibilityData(rules, data);

      expect(result.tags).toContain('Tag1');
      expect(result.tags).toContain('Tag2');
      expect(result.assignment).toBe('Premier');
    });
  });

  describe('expressions complexes', () => {
    it('évalue correctement les expressions avec AND (&&)', () => {
      const rules = [createParsedRule('city:"Paris" && isEligible:"true"', 'tag:"ParisEligible"')];

      const dataMatch = createEligibilityData({ city: 'Paris', isEligible: true });
      expect(applyParsedRulesToEligibilityData(rules, dataMatch).tags).toEqual(['ParisEligible']);

      const dataNoMatch = createEligibilityData({ city: 'Paris', isEligible: false });
      expect(applyParsedRulesToEligibilityData(rules, dataNoMatch).tags).toEqual([]);
    });

    it('évalue correctement les expressions avec OR (||)', () => {
      const rules = [createParsedRule('city:"Paris" || city:"Lyon"', 'tag:"GrandeVille"')];

      const dataParis = createEligibilityData({ city: 'Paris' });
      expect(applyParsedRulesToEligibilityData(rules, dataParis).tags).toEqual(['GrandeVille']);

      const dataLyon = createEligibilityData({ city: 'Lyon' });
      expect(applyParsedRulesToEligibilityData(rules, dataLyon).tags).toEqual(['GrandeVille']);

      const dataMarseille = createEligibilityData({ city: 'Marseille' });
      expect(applyParsedRulesToEligibilityData(rules, dataMarseille).tags).toEqual([]);
    });

    it('évalue correctement les expressions avec NOT (!)', () => {
      const rules = [createParsedRule('!city:"Paris"', 'tag:"HorsParis"')];

      const dataParis = createEligibilityData({ city: 'Paris' });
      expect(applyParsedRulesToEligibilityData(rules, dataParis).tags).toEqual([]);

      const dataLyon = createEligibilityData({ city: 'Lyon' });
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
