import { describe, expect, it } from 'vitest';

import type { ProEligibilityTestEligibility } from '../types';
import { getTransition } from './service';

describe('getTransition()', () => {
  const createEligibility = (overrides: Partial<ProEligibilityTestEligibility> = {}): ProEligibilityTestEligibility => ({
    distance: 150,
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
    it('returns "entree_pdp" when entering a PDP', () => {
      const old = createEligibility({ type: 'reseau_existant_proche' });
      const current = createEligibility({ type: 'dans_pdp' });
      expect(getTransition(old, current)).toBe('entree_pdp');
    });

    it('returns "sortie_pdp" when leaving a PDP', () => {
      const old = createEligibility({ type: 'dans_pdp' });
      const current = createEligibility({ type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('sortie_pdp');
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
    it('returns "nouveau_reseau_existant" when going from too far to existing network', () => {
      const old = createEligibility({ distance: 0, type: 'trop_eloigne' });
      const current = createEligibility({ distance: 500, type: 'reseau_existant_loin' });
      expect(getTransition(old, current)).toBe('nouveau_reseau_existant');
    });

    it('returns "nouveau_reseau_futur" when going from too far to future network', () => {
      const old = createEligibility({ distance: 0, type: 'trop_eloigne' });
      const current = createEligibility({ distance: 150, type: 'reseau_futur_proche' });
      expect(getTransition(old, current)).toBe('nouveau_reseau_futur');
    });

    it('returns "reseau_supprime" when network becomes too far', () => {
      const old = createEligibility({ distance: 800, type: 'reseau_existant_loin' });
      const current = createEligibility({ distance: 0, type: 'trop_eloigne' });
      expect(getTransition(old, current)).toBe('reseau_supprime');
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
    it('returns "rapprochement" when distance decreases significantly (>50m)', () => {
      const old = createEligibility({ distance: 200, type: 'reseau_existant_proche' });
      const current = createEligibility({ distance: 120, type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('rapprochement');
    });

    it('returns "eloignement" when distance increases significantly (>50m)', () => {
      const old = createEligibility({ distance: 120, type: 'reseau_existant_proche' });
      const current = createEligibility({ distance: 200, type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('eloignement');
    });

    it('returns "modification_mineure" when distance changes by less than 50m', () => {
      const old = createEligibility({ distance: 150, type: 'reseau_existant_proche' });
      const current = createEligibility({ distance: 180, type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('modification_mineure');
    });
  });

  describe('Proximity improvements (existing networks)', () => {
    it('returns "amelioration_proximite" when going from loin to proche', () => {
      const old = createEligibility({ distance: 500, type: 'reseau_existant_loin' });
      const current = createEligibility({ distance: 150, type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('amelioration_proximite');
    });

    it('returns "amelioration_proximite" when going from proche to tres_proche', () => {
      const old = createEligibility({ distance: 150, type: 'reseau_existant_proche' });
      const current = createEligibility({ distance: 50, type: 'reseau_existant_tres_proche' });
      expect(getTransition(old, current)).toBe('amelioration_proximite');
    });
  });

  describe('Proximity degradations (existing networks)', () => {
    it('returns "degradation_proximite" when going from tres_proche to proche', () => {
      const old = createEligibility({ distance: 50, type: 'reseau_existant_tres_proche' });
      const current = createEligibility({ distance: 150, type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('degradation_proximite');
    });

    it('returns "degradation_proximite" when going from proche to loin', () => {
      const old = createEligibility({ distance: 150, type: 'reseau_existant_proche' });
      const current = createEligibility({ distance: 500, type: 'reseau_existant_loin' });
      expect(getTransition(old, current)).toBe('degradation_proximite');
    });
  });

  describe('Proximity improvements (future networks)', () => {
    it('returns "amelioration_proximite" when going from futur loin to futur proche', () => {
      const old = createEligibility({ distance: 500, type: 'reseau_futur_loin' });
      const current = createEligibility({ distance: 150, type: 'reseau_futur_proche' });
      expect(getTransition(old, current)).toBe('amelioration_proximite');
    });

    it('returns "amelioration_proximite" when going from futur proche to futur tres_proche', () => {
      const old = createEligibility({ distance: 150, type: 'reseau_futur_proche' });
      const current = createEligibility({ distance: 50, type: 'reseau_futur_tres_proche' });
      expect(getTransition(old, current)).toBe('amelioration_proximite');
    });

    it('returns "amelioration_proximite" when entering dans_zone_reseau_futur', () => {
      const old = createEligibility({ distance: 150, type: 'reseau_futur_proche' });
      const current = createEligibility({ distance: 0, type: 'dans_zone_reseau_futur' });
      expect(getTransition(old, current)).toBe('amelioration_proximite');
    });
  });

  describe('Proximity degradations (future networks)', () => {
    it('returns "degradation_proximite" when going from futur tres_proche to futur proche', () => {
      const old = createEligibility({ distance: 50, type: 'reseau_futur_tres_proche' });
      const current = createEligibility({ distance: 150, type: 'reseau_futur_proche' });
      expect(getTransition(old, current)).toBe('degradation_proximite');
    });

    it('returns "degradation_proximite" when going from futur proche to futur loin', () => {
      const old = createEligibility({ distance: 150, type: 'reseau_futur_proche' });
      const current = createEligibility({ distance: 500, type: 'reseau_futur_loin' });
      expect(getTransition(old, current)).toBe('degradation_proximite');
    });

    it('returns "degradation_proximite" when leaving dans_zone_reseau_futur', () => {
      const old = createEligibility({ distance: 0, type: 'dans_zone_reseau_futur' });
      const current = createEligibility({ distance: 150, type: 'reseau_futur_proche' });
      expect(getTransition(old, current)).toBe('degradation_proximite');
    });
  });

  describe('City with network without trace', () => {
    it('returns "entree_ville_reseau_sans_trace" when entering a city with network from existing network', () => {
      const old = createEligibility({ distance: 500, type: 'reseau_existant_loin' });
      const current = createEligibility({ distance: 0, type: 'dans_ville_reseau_existant_sans_trace' });
      expect(getTransition(old, current)).toBe('entree_ville_reseau_sans_trace');
    });

    it('returns "sortie_ville_reseau_sans_trace" when leaving a city with network', () => {
      const old = createEligibility({ distance: 0, type: 'dans_ville_reseau_existant_sans_trace' });
      const current = createEligibility({ distance: 150, type: 'reseau_existant_proche' });
      expect(getTransition(old, current)).toBe('sortie_ville_reseau_sans_trace');
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
      const step2 = createEligibility({ distance: 500, type: 'dans_pdp' });
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
      const current = createEligibility({ distance: 50, type: 'dans_pdp' });
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
