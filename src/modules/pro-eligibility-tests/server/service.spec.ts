import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import type { ProEligibilityTestEligibility } from '../types';
import { getTransition } from './service';

describe('getTransition()', () => {
  const createEligibility = (overrides: Partial<ProEligibilityTestEligibility> = {}): ProEligibilityTestEligibility => ({
    distance: 150,
    eligible: true,
    id_fcu: 1,
    id_sncu: 'RCU-001',
    nom: 'Réseau Test',
    type: 'reseau_existant_proche',
    ...overrides,
  });

  describe('Initial state', () => {
    it('returns "initial" when no previous eligibility', () => {
      const newEligibility = createEligibility();
      expect(getTransition(undefined, newEligibility)).toBe('initial');
    });
  });

  describe('No change', () => {
    it('returns "none" when all fields are identical', () => {
      const eligibility = createEligibility();
      expect(getTransition(eligibility, eligibility)).toBe('none');
    });

    it('returns "none" when distance changes by less than 5m (GPS tolerance)', () => {
      const old = createEligibility({ distance: 150 });
      const current = createEligibility({ distance: 153 });
      expect(getTransition(old, current)).toBe('none');
    });
  });

  describe('PDP transitions', () => {
    type TransitionTestCase = TestCase<
      { old: Partial<ProEligibilityTestEligibility>; current: Partial<ProEligibilityTestEligibility> },
      string
    >;

    const testCases: TransitionTestCase[] = [
      {
        expectedOutput: 'entree_pdp',
        input: {
          current: { type: 'dans_pdp_reseau_existant' as const },
          old: { type: 'reseau_existant_proche' as const },
        },
        label: 'returns "entree_pdp" when entering a PDP',
      },
      {
        expectedOutput: 'sortie_pdp',
        input: {
          current: { type: 'reseau_existant_proche' as const },
          old: { type: 'dans_pdp_reseau_existant' as const },
        },
        label: 'returns "sortie_pdp" when leaving a PDP',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(getTransition(createEligibility(input.old), createEligibility(input.current))).toBe(expectedOutput);
    });
  });

  describe('Future to existing network transitions', () => {
    it('returns "futur_vers_existant" when future network becomes existing (construction completed)', () => {
      const old = createEligibility({ type: 'reseau_futur_proche' });
      const current = createEligibility({ type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('futur_vers_existant');
    });
  });

  describe('New network detection', () => {
    type TransitionTestCase = TestCase<
      { old: Partial<ProEligibilityTestEligibility>; current: Partial<ProEligibilityTestEligibility> },
      string
    >;

    const testCases: TransitionTestCase[] = [
      {
        expectedOutput: 'nouveau_reseau_existant',
        input: {
          current: { distance: 500, type: 'reseau_existant_loin' as const },
          old: { distance: 0, type: 'trop_eloigne' as const },
        },
        label: 'returns "nouveau_reseau_existant" when going from too far to existing network',
      },
      {
        expectedOutput: 'nouveau_reseau_futur',
        input: {
          current: { distance: 150, type: 'reseau_futur_proche' as const },
          old: { distance: 0, type: 'trop_eloigne' as const },
        },
        label: 'returns "nouveau_reseau_futur" when going from too far to future network',
      },
      {
        expectedOutput: 'reseau_supprime',
        input: {
          current: { distance: 0, type: 'trop_eloigne' as const },
          old: { distance: 800, type: 'reseau_existant_loin' as const },
        },
        label: 'returns "reseau_supprime" when network becomes too far',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(getTransition(createEligibility(input.old), createEligibility(input.current))).toBe(expectedOutput);
    });
  });

  describe('Network change', () => {
    it('returns "changement_reseau" when id_fcu changes', () => {
      const old = createEligibility({ id_fcu: 1 });
      const current = createEligibility({ id_fcu: 2 });
      expect(getTransition(old, current)).toBe('changement_reseau');
    });
  });

  describe('Distance changes within same type', () => {
    type TransitionTestCase = TestCase<
      { old: Partial<ProEligibilityTestEligibility>; current: Partial<ProEligibilityTestEligibility> },
      string
    >;

    const testCases: TransitionTestCase[] = [
      {
        expectedOutput: 'rapprochement',
        input: {
          current: { distance: 120, type: 'reseau_existant_proche' as const },
          old: { distance: 200, type: 'reseau_existant_proche' as const },
        },
        label: 'returns "rapprochement" when distance decreases significantly (>50m)',
      },
      {
        expectedOutput: 'eloignement',
        input: {
          current: { distance: 200, type: 'reseau_existant_proche' as const },
          old: { distance: 120, type: 'reseau_existant_proche' as const },
        },
        label: 'returns "eloignement" when distance increases significantly (>50m)',
      },
      {
        expectedOutput: 'modification_mineure',
        input: {
          current: { distance: 180, type: 'reseau_existant_proche' as const },
          old: { distance: 150, type: 'reseau_existant_proche' as const },
        },
        label: 'returns "modification_mineure" when distance changes by less than 50m',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(getTransition(createEligibility(input.old), createEligibility(input.current))).toBe(expectedOutput);
    });
  });

  describe('Proximity improvements (existing networks)', () => {
    type TransitionTestCase = TestCase<
      { old: Partial<ProEligibilityTestEligibility>; current: Partial<ProEligibilityTestEligibility> },
      string
    >;

    const testCases: TransitionTestCase[] = [
      {
        expectedOutput: 'amelioration_proximite',
        input: {
          current: { distance: 150, type: 'reseau_existant_proche' as const },
          old: { distance: 500, type: 'reseau_existant_loin' as const },
        },
        label: 'returns "amelioration_proximite" when going from loin to proche',
      },
      {
        expectedOutput: 'amelioration_proximite',
        input: {
          current: { distance: 50, type: 'reseau_existant_tres_proche' as const },
          old: { distance: 150, type: 'reseau_existant_proche' as const },
        },
        label: 'returns "amelioration_proximite" when going from proche to tres_proche',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(getTransition(createEligibility(input.old), createEligibility(input.current))).toBe(expectedOutput);
    });
  });

  describe('Proximity degradations (existing networks)', () => {
    type TransitionTestCase = TestCase<
      { old: Partial<ProEligibilityTestEligibility>; current: Partial<ProEligibilityTestEligibility> },
      string
    >;

    const testCases: TransitionTestCase[] = [
      {
        expectedOutput: 'degradation_proximite',
        input: {
          current: { distance: 150, type: 'reseau_existant_proche' as const },
          old: { distance: 50, type: 'reseau_existant_tres_proche' as const },
        },
        label: 'returns "degradation_proximite" when going from tres_proche to proche',
      },
      {
        expectedOutput: 'degradation_proximite',
        input: {
          current: { distance: 500, type: 'reseau_existant_loin' as const },
          old: { distance: 150, type: 'reseau_existant_proche' as const },
        },
        label: 'returns "degradation_proximite" when going from proche to loin',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(getTransition(createEligibility(input.old), createEligibility(input.current))).toBe(expectedOutput);
    });
  });

  describe('Proximity improvements (future networks)', () => {
    type TransitionTestCase = TestCase<
      { old: Partial<ProEligibilityTestEligibility>; current: Partial<ProEligibilityTestEligibility> },
      string
    >;

    const testCases: TransitionTestCase[] = [
      {
        expectedOutput: 'amelioration_proximite',
        input: {
          current: { distance: 150, type: 'reseau_futur_proche' as const },
          old: { distance: 500, type: 'reseau_futur_loin' as const },
        },
        label: 'returns "amelioration_proximite" when going from futur loin to futur proche',
      },
      {
        expectedOutput: 'amelioration_proximite',
        input: {
          current: { distance: 50, type: 'reseau_futur_tres_proche' as const },
          old: { distance: 150, type: 'reseau_futur_proche' as const },
        },
        label: 'returns "amelioration_proximite" when going from futur proche to futur tres_proche',
      },
      {
        expectedOutput: 'amelioration_proximite',
        input: {
          current: { distance: 0, type: 'dans_zone_reseau_futur' as const },
          old: { distance: 150, type: 'reseau_futur_proche' as const },
        },
        label: 'returns "amelioration_proximite" when entering dans_zone_reseau_futur',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(getTransition(createEligibility(input.old), createEligibility(input.current))).toBe(expectedOutput);
    });
  });

  describe('Proximity degradations (future networks)', () => {
    type TransitionTestCase = TestCase<
      { old: Partial<ProEligibilityTestEligibility>; current: Partial<ProEligibilityTestEligibility> },
      string
    >;

    const testCases: TransitionTestCase[] = [
      {
        expectedOutput: 'degradation_proximite',
        input: {
          current: { distance: 150, type: 'reseau_futur_proche' as const },
          old: { distance: 50, type: 'reseau_futur_tres_proche' as const },
        },
        label: 'returns "degradation_proximite" when going from futur tres_proche to futur proche',
      },
      {
        expectedOutput: 'degradation_proximite',
        input: {
          current: { distance: 500, type: 'reseau_futur_loin' as const },
          old: { distance: 150, type: 'reseau_futur_proche' as const },
        },
        label: 'returns "degradation_proximite" when going from futur proche to futur loin',
      },
      {
        expectedOutput: 'degradation_proximite',
        input: {
          current: { distance: 150, type: 'reseau_futur_proche' as const },
          old: { distance: 0, type: 'dans_zone_reseau_futur' as const },
        },
        label: 'returns "degradation_proximite" when leaving dans_zone_reseau_futur',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(getTransition(createEligibility(input.old), createEligibility(input.current))).toBe(expectedOutput);
    });
  });

  describe('City with network without trace', () => {
    type TransitionTestCase = TestCase<
      { old: Partial<ProEligibilityTestEligibility>; current: Partial<ProEligibilityTestEligibility> },
      string
    >;

    const testCases: TransitionTestCase[] = [
      {
        expectedOutput: 'entree_ville_reseau_sans_trace',
        input: {
          current: { distance: 0, type: 'dans_ville_reseau_existant_sans_trace' as const },
          old: { distance: 500, type: 'reseau_existant_loin' as const },
        },
        label: 'returns "entree_ville_reseau_sans_trace" when entering a city with network from existing network',
      },
      {
        expectedOutput: 'sortie_ville_reseau_sans_trace',
        input: {
          current: { distance: 150, type: 'reseau_existant_proche' as const },
          old: { distance: 0, type: 'dans_ville_reseau_existant_sans_trace' as const },
        },
        label: 'returns "sortie_ville_reseau_sans_trace" when leaving a city with network',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(getTransition(createEligibility(input.old), createEligibility(input.current))).toBe(expectedOutput);
    });
  });

  describe('Complex scenarios', () => {
    it('handles typical expansion flow: trop_eloigne -> loin -> proche -> tres_proche', () => {
      const step1 = createEligibility({ distance: 0, type: 'trop_eloigne' });
      const step2 = createEligibility({ distance: 500, type: 'reseau_existant_loin' });
      const step3 = createEligibility({ distance: 150, type: 'reseau_existant_proche' });
      const step4 = createEligibility({ distance: 50, type: 'reseau_existant_tres_proche' });

      expect(getTransition(step1, step2)).toBe('nouveau_reseau_existant');
      expect(getTransition(step2, step3)).toBe('amelioration_proximite');
      expect(getTransition(step3, step4)).toBe('amelioration_proximite');
    });

    it('handles construction completion: futur_proche -> existant_proche', () => {
      const old = createEligibility({ distance: 150, id_fcu: 1, type: 'reseau_futur_proche' });
      const current = createEligibility({ distance: 150, id_fcu: 1, type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('futur_vers_existant');
    });

    it('handles PDP with proximity change', () => {
      const step1 = createEligibility({ distance: 500, type: 'reseau_existant_loin' });
      const step2 = createEligibility({ distance: 500, type: 'dans_pdp_reseau_existant' });
      const step3 = createEligibility({ distance: 150, type: 'reseau_existant_proche' });

      expect(getTransition(step1, step2)).toBe('entree_pdp');
      expect(getTransition(step2, step3)).toBe('sortie_pdp');
    });
  });

  describe('Edge cases', () => {
    it('returns "reseau_supprime" when going from city network to too far', () => {
      const old = createEligibility({ type: 'dans_ville_reseau_existant_sans_trace' });
      const current = createEligibility({ type: 'trop_eloigne' });
      expect(getTransition(old, current)).toBe('reseau_supprime');
    });

    it('prioritizes PDP transitions over proximity changes', () => {
      const old = createEligibility({ distance: 500, type: 'reseau_existant_loin' });
      const current = createEligibility({ distance: 50, type: 'dans_pdp_reseau_existant' });
      expect(getTransition(old, current)).toBe('entree_pdp');
    });

    it('prioritizes future->existing over proximity changes', () => {
      const old = createEligibility({ distance: 500, type: 'reseau_futur_loin' });
      const current = createEligibility({ distance: 50, type: 'reseau_existant_tres_proche' });
      expect(getTransition(old, current)).toBe('futur_vers_existant');
    });

    it('prioritizes network change over distance change', () => {
      const old = createEligibility({ distance: 200, id_fcu: 1, type: 'reseau_existant_proche' });
      const current = createEligibility({ distance: 100, id_fcu: 2, type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('changement_reseau');
    });
  });
});
