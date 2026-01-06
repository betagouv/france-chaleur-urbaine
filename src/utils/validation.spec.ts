import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { emailSchema, envBooleanSchema, sanitizeEmail, zAirtableRecordId, zGeometry, zPassword } from './validation';

describe('zPassword', () => {
  describe('mots de passe valides', () => {
    const testCases: TestCase<string, boolean>[] = [
      { expectedOutput: true, input: 'Password1', label: 'accepte "Password1"' },
      { expectedOutput: true, input: 'Abcdefg1', label: 'accepte "Abcdefg1"' },
      { expectedOutput: true, input: 'Test1234', label: 'accepte "Test1234"' },
      { expectedOutput: true, input: 'MyP4ssword', label: 'accepte "MyP4ssword"' },
      { expectedOutput: true, input: 'LongPassword123', label: 'accepte "LongPassword123"' },
      { expectedOutput: true, input: 'A1bcdefg', label: 'accepte "A1bcdefg"' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(zPassword.safeParse(input).success).toBe(expectedOutput);
    });
  });

  describe('mots de passe invalides', () => {
    const testCases: TestCase<string, boolean>[] = [
      { expectedOutput: false, input: 'Pass1', label: 'rejette "Pass1" (< 8 caractères)' },
      { expectedOutput: false, input: 'Abc123', label: 'rejette "Abc123" (< 8 caractères)' },
      { expectedOutput: false, input: 'Ab1cdef', label: 'rejette "Ab1cdef" (7 caractères)' },
      { expectedOutput: false, input: 'PASSWORD1', label: 'rejette "PASSWORD1" (sans minuscule)' },
      { expectedOutput: false, input: 'ABCDEFG1', label: 'rejette "ABCDEFG1" (sans minuscule)' },
      { expectedOutput: false, input: 'password1', label: 'rejette "password1" (sans majuscule)' },
      { expectedOutput: false, input: 'abcdefg1', label: 'rejette "abcdefg1" (sans majuscule)' },
      { expectedOutput: false, input: 'Password', label: 'rejette "Password" (sans chiffre)' },
      { expectedOutput: false, input: 'Abcdefgh', label: 'rejette "Abcdefgh" (sans chiffre)' },
      { expectedOutput: false, input: '', label: 'rejette une chaîne vide' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(zPassword.safeParse(input).success).toBe(expectedOutput);
    });
  });

  describe('cas limites', () => {
    const testCases: TestCase<string, boolean>[] = [
      { expectedOutput: true, input: 'Abcdef1g', label: 'accepte exactement 8 caractères avec toutes les conditions' },
      { expectedOutput: true, input: 'Abcdefghijklmnop1234567890', label: 'accepte un mot de passe très long' },
      { expectedOutput: true, input: 'Password1!@#', label: 'accepte les caractères spéciaux (Password1!@#)' },
      { expectedOutput: true, input: 'P@ssw0rd!', label: 'accepte les caractères spéciaux (P@ssw0rd!)' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(zPassword.safeParse(input).success).toBe(expectedOutput);
    });
  });
});

describe('zAirtableRecordId', () => {
  describe('IDs valides (17 caractères alphanumériques)', () => {
    const testCases: TestCase<string, boolean>[] = [
      { expectedOutput: true, input: 'rec6nCFUO7Nzj6M9n', label: 'accepte "rec6nCFUO7Nzj6M9n"' },
      { expectedOutput: true, input: 'recABCDEF12345678', label: 'accepte "recABCDEF12345678"' },
      { expectedOutput: true, input: 'abc1234567890abcd', label: 'accepte "abc1234567890abcd"' },
      { expectedOutput: true, input: '12345678901234567', label: 'accepte "12345678901234567"' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(zAirtableRecordId.safeParse(input).success).toBe(expectedOutput);
    });
  });

  describe('IDs invalides', () => {
    const testCases: TestCase<string, boolean>[] = [
      { expectedOutput: false, input: 'rec123456789012a', label: 'rejette un ID de 16 caractères (trop court)' },
      { expectedOutput: false, input: 'rec123456789012abc', label: 'rejette un ID de 18 caractères (trop long)' },
      { expectedOutput: false, input: 'rec6nCFUO7Nzj6M9!', label: 'rejette un ID avec caractères spéciaux' },
      { expectedOutput: false, input: '', label: 'rejette une chaîne vide' },
      { expectedOutput: false, input: 'rec-nCFUO7Nzj6M9n', label: 'rejette un ID avec des tirets' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(zAirtableRecordId.safeParse(input).success).toBe(expectedOutput);
    });
  });
});

describe('emailSchema', () => {
  describe('emails valides', () => {
    const testCases: TestCase<string, string>[] = [
      { expectedOutput: 'test@example.com', input: 'test@example.com', label: 'accepte et normalise "test@example.com"' },
      { expectedOutput: 'test@example.com', input: 'TEST@EXAMPLE.COM', label: 'normalise "TEST@EXAMPLE.COM" en minuscules' },
      { expectedOutput: 'user@domain.fr', input: '  user@domain.fr  ', label: 'trim les espaces autour de "  user@domain.fr  "' },
      {
        expectedOutput: 'name.surname@company.org',
        input: 'name.surname@company.org',
        label: 'accepte "name.surname@company.org"',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      const result = emailSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(expectedOutput);
      }
    });
  });

  describe('emails invalides', () => {
    const testCases: TestCase<string, boolean>[] = [
      { expectedOutput: false, input: 'invalid', label: 'rejette "invalid"' },
      { expectedOutput: false, input: '@domain.com', label: 'rejette "@domain.com"' },
      { expectedOutput: false, input: 'user@', label: 'rejette "user@"' },
      { expectedOutput: false, input: '', label: 'rejette une chaîne vide' },
      { expectedOutput: false, input: 'user@domain', label: 'rejette "user@domain" (sans TLD)' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(emailSchema.safeParse(input).success).toBe(expectedOutput);
    });
  });
});

describe('sanitizeEmail()', () => {
  const testCases: TestCase<string, string>[] = [
    { expectedOutput: 'test@example.com', input: 'TEST@Example.COM', label: 'normalise un email valide' },
    { expectedOutput: 'invalid', input: 'invalid', label: "retourne l'email original si invalide" },
    { expectedOutput: 'test@example.com', input: '  test@example.com  ', label: 'trim les espaces' },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(sanitizeEmail(input)).toBe(expectedOutput);
  });
});

describe('envBooleanSchema', () => {
  describe('valeurs truthy', () => {
    const testCases: TestCase<string, boolean>[] = [
      { expectedOutput: true, input: 'true', label: 'transforme "true" en true' },
      { expectedOutput: true, input: '1', label: 'transforme "1" en true' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(envBooleanSchema.parse(input)).toBe(expectedOutput);
    });
  });

  describe('valeurs falsy', () => {
    const testCases: TestCase<string, boolean>[] = [
      { expectedOutput: false, input: 'false', label: 'transforme "false" en false' },
      { expectedOutput: false, input: '0', label: 'transforme "0" en false' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(envBooleanSchema.parse(input)).toBe(expectedOutput);
    });
  });

  describe('valeurs invalides', () => {
    const testCases: TestCase<string, boolean>[] = [
      { expectedOutput: false, input: 'yes', label: 'retourne false pour "yes" (non reconnu)' },
      { expectedOutput: false, input: 'no', label: 'retourne false pour "no" (non reconnu)' },
      { expectedOutput: false, input: '', label: 'retourne false pour une chaîne vide' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(envBooleanSchema.parse(input)).toBe(expectedOutput);
    });
  });
});

describe('zGeometry', () => {
  describe('géométries valides', () => {
    const testCases: TestCase<any, boolean>[] = [
      {
        expectedOutput: true,
        input: { coordinates: [2.35, 48.85], type: 'Point' },
        label: 'accepte un Point',
      },
      {
        expectedOutput: true,
        input: {
          coordinates: [
            [2.35, 48.85],
            [2.36, 48.86],
          ],
          type: 'LineString',
        },
        label: 'accepte un LineString',
      },
      {
        expectedOutput: true,
        input: {
          coordinates: [
            [
              [2.35, 48.85],
              [2.36, 48.85],
              [2.36, 48.86],
              [2.35, 48.85],
            ],
          ],
          type: 'Polygon',
        },
        label: 'accepte un Polygon',
      },
      {
        expectedOutput: true,
        input: {
          coordinates: [
            [2.35, 48.85],
            [2.36, 48.86],
          ],
          type: 'MultiPoint',
        },
        label: 'accepte un MultiPoint',
      },
      {
        expectedOutput: true,
        input: {
          coordinates: [
            [
              [2.35, 48.85],
              [2.36, 48.86],
            ],
          ],
          type: 'MultiLineString',
        },
        label: 'accepte un MultiLineString',
      },
      {
        expectedOutput: true,
        input: {
          coordinates: [
            [
              [
                [2.35, 48.85],
                [2.36, 48.85],
                [2.36, 48.86],
                [2.35, 48.85],
              ],
            ],
          ],
          type: 'MultiPolygon',
        },
        label: 'accepte un MultiPolygon',
      },
      {
        expectedOutput: true,
        input: { geometries: [], type: 'GeometryCollection' },
        label: 'accepte une GeometryCollection',
      },
      {
        expectedOutput: true,
        input: { features: [], type: 'FeatureCollection' },
        label: 'accepte une FeatureCollection',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(zGeometry.safeParse(input).success).toBe(expectedOutput);
    });
  });

  describe('géométries invalides', () => {
    const testCases: TestCase<any, boolean>[] = [
      {
        expectedOutput: false,
        input: { coordinates: [2.35, 48.85] },
        label: 'rejette un objet sans type',
      },
      {
        expectedOutput: false,
        input: null,
        label: 'rejette null',
      },
      {
        expectedOutput: false,
        input: undefined,
        label: 'rejette undefined',
      },
      {
        expectedOutput: false,
        input: { type: 'InvalidType' },
        label: 'rejette un type non reconnu',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(zGeometry.safeParse(input).success).toBe(expectedOutput);
    });
  });
});
