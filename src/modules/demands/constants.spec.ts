import { describe, expect, it } from 'vitest';

import { normalizeHeatingEnergy, normalizeHeatingType } from './constants';

describe('normalizeHeatingEnergy()', () => {
  describe('électricité', () => {
    it.each([
      ['Électricité', 'Électricité'],
      ['électricité', 'Électricité'],
      ['ÉLECTRICITÉ', 'Électricité'],
      ['electricite', 'Électricité'],
      ['ELECTRICITE', 'Électricité'],
      ['electricité', 'Électricité'],
      ['  électricité  ', 'Électricité'],
    ])('normalise "%s" en "%s"', (input, expected) => {
      expect(normalizeHeatingEnergy(input)).toBe(expected);
    });
  });

  describe('gaz', () => {
    it.each([
      ['gaz', 'Gaz'],
      ['Gaz', 'Gaz'],
      ['GAZ', 'Gaz'],
      ['  gaz  ', 'Gaz'],
    ])('normalise "%s" en "%s"', (input, expected) => {
      expect(normalizeHeatingEnergy(input)).toBe(expected);
    });
  });

  describe('fioul', () => {
    it.each([
      ['fioul', 'Fioul'],
      ['Fioul', 'Fioul'],
      ['FIOUL', 'Fioul'],
      ['  fioul  ', 'Fioul'],
    ])('normalise "%s" en "%s"', (input, expected) => {
      expect(normalizeHeatingEnergy(input)).toBe(expected);
    });
  });

  describe('autre', () => {
    it.each([
      ['autre', 'Autre / Je ne sais pas'],
      ['Autre', 'Autre / Je ne sais pas'],
      ['AUTRE', 'Autre / Je ne sais pas'],
      ['autre / je ne sais pas', 'Autre / Je ne sais pas'],
      ['Autre / Je ne sais pas', 'Autre / Je ne sais pas'],
    ])('normalise "%s" en "%s"', (input, expected) => {
      expect(normalizeHeatingEnergy(input)).toBe(expected);
    });
  });

  describe('valeurs invalides', () => {
    it('retourne null pour null', () => {
      expect(normalizeHeatingEnergy(null)).toBeNull();
    });

    it('retourne null pour undefined', () => {
      expect(normalizeHeatingEnergy(undefined)).toBeNull();
    });

    it('retourne null pour une chaîne vide', () => {
      expect(normalizeHeatingEnergy('')).toBeNull();
    });

    it('retourne null pour une valeur non reconnue', () => {
      expect(normalizeHeatingEnergy('charbon')).toBeNull();
      expect(normalizeHeatingEnergy('bois')).toBeNull();
      expect(normalizeHeatingEnergy('solaire')).toBeNull();
    });
  });
});

describe('normalizeHeatingType()', () => {
  describe('collectif', () => {
    it.each([
      ['collectif', 'Collectif'],
      ['Collectif', 'Collectif'],
      ['COLLECTIF', 'Collectif'],
      ['  collectif  ', 'Collectif'],
    ])('normalise "%s" en "%s"', (input, expected) => {
      expect(normalizeHeatingType(input)).toBe(expected);
    });
  });

  describe('individuel', () => {
    it.each([
      ['individuel', 'Individuel'],
      ['Individuel', 'Individuel'],
      ['INDIVIDUEL', 'Individuel'],
      ['  individuel  ', 'Individuel'],
    ])('normalise "%s" en "%s"', (input, expected) => {
      expect(normalizeHeatingType(input)).toBe(expected);
    });
  });

  describe('autre', () => {
    it.each([
      ['autre', 'Autre / Je ne sais pas'],
      ['Autre', 'Autre / Je ne sais pas'],
      ['autre / je ne sais pas', 'Autre / Je ne sais pas'],
    ])('normalise "%s" en "%s"', (input, expected) => {
      expect(normalizeHeatingType(input)).toBe(expected);
    });
  });

  describe('valeurs invalides', () => {
    it('retourne null pour null', () => {
      expect(normalizeHeatingType(null)).toBeNull();
    });

    it('retourne null pour undefined', () => {
      expect(normalizeHeatingType(undefined)).toBeNull();
    });

    it('retourne null pour une chaîne vide', () => {
      expect(normalizeHeatingType('')).toBeNull();
    });

    it('retourne null pour une valeur non reconnue', () => {
      expect(normalizeHeatingType('mixte')).toBeNull();
    });
  });

  describe('valeurs de mode de chauffage dans le mauvais champ', () => {
    it.each([['électricité'], ['electricite'], ['gaz'], ['fioul']])('retourne null pour "%s" (valeur de mode, pas de type)', (input) => {
      expect(normalizeHeatingType(input)).toBeNull();
    });
  });
});
