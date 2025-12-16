import { describe, expect, it } from 'vitest';

import { emailSchema, envBooleanSchema, sanitizeEmail, zAirtableRecordId, zGeometry, zPassword } from './validation';

describe('zPassword', () => {
  describe('mots de passe valides', () => {
    it.each([['Password1'], ['Abcdefg1'], ['Test1234'], ['MyP4ssword'], ['LongPassword123'], ['A1bcdefg']])('accepte "%s"', (password) => {
      expect(zPassword.safeParse(password).success).toBe(true);
    });
  });

  describe('mots de passe invalides', () => {
    it('rejette un mot de passe trop court (< 8 caractères)', () => {
      expect(zPassword.safeParse('Pass1').success).toBe(false);
      expect(zPassword.safeParse('Abc123').success).toBe(false);
      expect(zPassword.safeParse('Ab1cdef').success).toBe(false);
    });

    it('rejette un mot de passe sans minuscule', () => {
      expect(zPassword.safeParse('PASSWORD1').success).toBe(false);
      expect(zPassword.safeParse('ABCDEFG1').success).toBe(false);
    });

    it('rejette un mot de passe sans majuscule', () => {
      expect(zPassword.safeParse('password1').success).toBe(false);
      expect(zPassword.safeParse('abcdefg1').success).toBe(false);
    });

    it('rejette un mot de passe sans chiffre', () => {
      expect(zPassword.safeParse('Password').success).toBe(false);
      expect(zPassword.safeParse('Abcdefgh').success).toBe(false);
    });

    it('rejette une chaîne vide', () => {
      expect(zPassword.safeParse('').success).toBe(false);
    });
  });

  describe('cas limites', () => {
    it('accepte exactement 8 caractères avec toutes les conditions', () => {
      expect(zPassword.safeParse('Abcdef1g').success).toBe(true);
    });

    it('accepte un mot de passe très long', () => {
      expect(zPassword.safeParse('Abcdefghijklmnop1234567890').success).toBe(true);
    });

    it('accepte les caractères spéciaux', () => {
      expect(zPassword.safeParse('Password1!@#').success).toBe(true);
      expect(zPassword.safeParse('P@ssw0rd!').success).toBe(true);
    });
  });
});

describe('zAirtableRecordId', () => {
  describe('IDs valides (17 caractères alphanumériques)', () => {
    it.each([['rec6nCFUO7Nzj6M9n'], ['recABCDEF12345678'], ['abc1234567890abcd'], ['12345678901234567']])('accepte "%s"', (id) => {
      expect(zAirtableRecordId.safeParse(id).success).toBe(true);
    });
  });

  describe('IDs invalides', () => {
    it('rejette un ID de 16 caractères (trop court)', () => {
      expect(zAirtableRecordId.safeParse('rec123456789012a').success).toBe(false);
    });

    it('rejette un ID de 18 caractères (trop long)', () => {
      expect(zAirtableRecordId.safeParse('rec123456789012abc').success).toBe(false);
    });

    it('rejette un ID avec caractères spéciaux', () => {
      expect(zAirtableRecordId.safeParse('rec6nCFUO7Nzj6M9!').success).toBe(false);
    });

    it('rejette une chaîne vide', () => {
      expect(zAirtableRecordId.safeParse('').success).toBe(false);
    });

    it('rejette un ID avec des tirets', () => {
      expect(zAirtableRecordId.safeParse('rec-nCFUO7Nzj6M9n').success).toBe(false);
    });
  });
});

describe('emailSchema', () => {
  describe('emails valides', () => {
    it.each([
      ['test@example.com', 'test@example.com'],
      ['TEST@EXAMPLE.COM', 'test@example.com'],
      ['  user@domain.fr  ', 'user@domain.fr'],
      ['name.surname@company.org', 'name.surname@company.org'],
    ])('accepte et normalise "%s" en "%s"', (input, expected) => {
      const result = emailSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(expected);
      }
    });
  });

  describe('emails invalides', () => {
    it.each([['invalid'], ['@domain.com'], ['user@'], [''], ['user@domain']])('rejette "%s"', (email) => {
      expect(emailSchema.safeParse(email).success).toBe(false);
    });
  });
});

describe('sanitizeEmail()', () => {
  it('normalise un email valide', () => {
    expect(sanitizeEmail('TEST@Example.COM')).toBe('test@example.com');
  });

  it("retourne l'email original si invalide", () => {
    expect(sanitizeEmail('invalid')).toBe('invalid');
  });

  it('trim les espaces', () => {
    expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
  });
});

describe('envBooleanSchema', () => {
  describe('valeurs truthy', () => {
    it.each([
      ['true', true],
      ['1', true],
    ])('transforme "%s" en %s', (input, expected) => {
      expect(envBooleanSchema.parse(input)).toBe(expected);
    });
  });

  describe('valeurs falsy', () => {
    it.each([
      ['false', false],
      ['0', false],
    ])('transforme "%s" en %s', (input, expected) => {
      expect(envBooleanSchema.parse(input)).toBe(expected);
    });
  });

  describe('valeurs invalides', () => {
    it('retourne false pour des valeurs non reconnues (catch)', () => {
      expect(envBooleanSchema.parse('yes')).toBe(false);
      expect(envBooleanSchema.parse('no')).toBe(false);
      expect(envBooleanSchema.parse('')).toBe(false);
    });
  });
});

describe('zGeometry', () => {
  describe('géométries valides', () => {
    it.each([
      [{ coordinates: [2.35, 48.85], type: 'Point' }],
      [
        {
          coordinates: [
            [2.35, 48.85],
            [2.36, 48.86],
          ],
          type: 'LineString',
        },
      ],
      [
        {
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
      ],
      [
        {
          coordinates: [
            [2.35, 48.85],
            [2.36, 48.86],
          ],
          type: 'MultiPoint',
        },
      ],
      [
        {
          coordinates: [
            [
              [2.35, 48.85],
              [2.36, 48.86],
            ],
          ],
          type: 'MultiLineString',
        },
      ],
      [
        {
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
      ],
      [{ geometries: [], type: 'GeometryCollection' }],
      [{ features: [], type: 'FeatureCollection' }],
    ])('accepte %j', (geometry) => {
      expect(zGeometry.safeParse(geometry).success).toBe(true);
    });
  });

  describe('géométries invalides', () => {
    it('rejette un objet sans type', () => {
      expect(zGeometry.safeParse({ coordinates: [2.35, 48.85] }).success).toBe(false);
    });

    it('rejette null', () => {
      expect(zGeometry.safeParse(null).success).toBe(false);
    });

    it('rejette undefined', () => {
      expect(zGeometry.safeParse(undefined).success).toBe(false);
    });

    it('rejette un type non reconnu', () => {
      expect(zGeometry.safeParse({ type: 'InvalidType' }).success).toBe(false);
    });
  });
});
