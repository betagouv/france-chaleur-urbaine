import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { createParserForRecordKey, createParserForRecordValues, parseAsLngLat } from './nuqs-parsers';

describe('parseAsLngLat', () => {
  describe('retourne [lng, lat] pour les entrées valides', () => {
    const testCases: TestCase<string, [number, number]>[] = [
      { expectedOutput: [4.717692, 49.767402], input: '4.717692,49.767402', label: 'coordonnées décimales standard' },
      { expectedOutput: [0, 0], input: '0,0', label: 'origine [0, 0]' },
      { expectedOutput: [-1.5, 48.8], input: '-1.5,48.8', label: 'longitude négative' },
      { expectedOutput: [2.3488, 48.8534], input: '2.3488,48.8534', label: 'Paris' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(parseAsLngLat.parse(input)).toEqual(expectedOutput);
    });
  });

  describe('retourne null pour les entrées invalides', () => {
    const testCases: TestCase<string, null>[] = [
      { expectedOutput: null, input: 'abc,49', label: 'longitude non numérique' },
      { expectedOutput: null, input: '4.71,abc', label: 'latitude non numérique' },
      { expectedOutput: null, input: 'abc,def', label: 'aucune valeur numérique' },
      { expectedOutput: null, input: ',', label: 'virgule seule' },
      { expectedOutput: null, input: '4.71', label: 'une seule valeur sans virgule' },
      { expectedOutput: null, input: '4.71,49,0', label: 'trois valeurs' },
      { expectedOutput: null, input: '', label: 'chaîne vide' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(parseAsLngLat.parse(input)).toBe(expectedOutput);
    });
  });

  describe('serialize', () => {
    it('sérialise un tuple en chaîne "lng,lat"', () => {
      expect(parseAsLngLat.serialize([4.717692, 49.767402])).toBe('4.717692,49.767402');
    });
  });
});

describe('createParserForRecordKey', () => {
  const registry = {
    dalkia: { alt: 'logo Dalkia', src: '/logo-DALKIA.png' },
    engie: { alt: 'logo ENGIE', src: '/logo-ENGIE.jpg' },
    viaseva: { alt: 'logo viaseva', src: '/logo-viaseva.svg' },
  } as const;

  const parseAsRegistryKey = createParserForRecordKey(registry);

  describe('retourne la clé pour les valeurs valides', () => {
    const testCases: TestCase<string, keyof typeof registry>[] = [
      { expectedOutput: 'dalkia', input: 'dalkia', label: '"dalkia" est une clé valide' },
      { expectedOutput: 'engie', input: 'engie', label: '"engie" est une clé valide' },
      { expectedOutput: 'viaseva', input: 'viaseva', label: '"viaseva" est une clé valide' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(parseAsRegistryKey.parse(input)).toBe(expectedOutput);
    });
  });

  describe('retourne null pour les valeurs invalides', () => {
    const testCases: TestCase<string, null>[] = [
      { expectedOutput: null, input: 'unknown', label: 'clé inexistante' },
      { expectedOutput: null, input: '', label: 'chaîne vide' },
      { expectedOutput: null, input: 'DALKIA', label: 'casse différente' },
      { expectedOutput: null, input: '__proto__', label: 'prototype poisoning attempt' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(parseAsRegistryKey.parse(input)).toBe(expectedOutput);
    });
  });

  describe('serialize', () => {
    it('sérialise une clé en chaîne identique', () => {
      expect(parseAsRegistryKey.serialize('dalkia')).toBe('dalkia');
    });
  });
});

describe('createParserForRecordValues', () => {
  const mapping = {
    futur_reseau: 'reseauxEnConstruction',
    pdp: 'zonesDeDeveloppementPrioritaire',
    reseau_chaleur: 'reseauxDeChaleur',
  } as const;

  const parseAsFeatures = createParserForRecordValues(mapping);

  describe('retourne les valeurs mappées pour les clés valides', () => {
    const testCases: TestCase<string, (typeof mapping)[keyof typeof mapping][]>[] = [
      { expectedOutput: ['reseauxDeChaleur'], input: 'reseau_chaleur', label: 'une clé valide' },
      { expectedOutput: ['reseauxDeChaleur', 'reseauxEnConstruction'], input: 'reseau_chaleur,futur_reseau', label: 'deux clés valides' },
      {
        expectedOutput: ['reseauxDeChaleur', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire'],
        input: 'reseau_chaleur,futur_reseau,pdp',
        label: 'toutes les clés',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(parseAsFeatures.parse(input)).toEqual(expectedOutput);
    });
  });

  describe('ignore les clés inconnues', () => {
    const testCases: TestCase<string, (typeof mapping)[keyof typeof mapping][]>[] = [
      { expectedOutput: [], input: 'unknown', label: 'clé inconnue seule' },
      { expectedOutput: ['reseauxDeChaleur'], input: 'reseau_chaleur,unknown', label: 'clé valide + clé inconnue' },
      { expectedOutput: [], input: 'unknown1,unknown2', label: 'plusieurs clés inconnues' },
      { expectedOutput: [], input: '__proto__', label: 'prototype poisoning attempt' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(parseAsFeatures.parse(input)).toEqual(expectedOutput);
    });
  });

  describe('gère les espaces autour des clés', () => {
    it('trim les espaces autour de chaque clé', () => {
      expect(parseAsFeatures.parse(' reseau_chaleur , futur_reseau ')).toEqual(['reseauxDeChaleur', 'reseauxEnConstruction']);
    });
  });
});
