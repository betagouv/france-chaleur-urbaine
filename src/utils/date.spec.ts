import { describe, expect, it } from 'vitest';

import { formatAsISODate, formatAsISODateMinutes, formatFrenchDate, formatFrenchDateTime } from './date';

describe('date utilities', () => {
  describe('formatAsISODateMinutes()', () => {
    it('formate une date au format ISO avec minutes', () => {
      const date = new Date('2024-01-25T16:48:30.000Z');
      expect(formatAsISODateMinutes(date)).toBe('2024-01-25T16:48');
    });

    it('gère minuit correctement', () => {
      const date = new Date('2024-12-31T00:00:00.000Z');
      expect(formatAsISODateMinutes(date)).toBe('2024-12-31T00:00');
    });

    it('gère les minutes à un chiffre', () => {
      const date = new Date('2024-06-15T09:05:00.000Z');
      expect(formatAsISODateMinutes(date)).toBe('2024-06-15T09:05');
    });
  });

  describe('formatAsISODate()', () => {
    it('formate une date au format ISO date uniquement', () => {
      const date = new Date('2024-01-25T16:48:30.000Z');
      expect(formatAsISODate(date)).toBe('2024-01-25');
    });

    it("gère le premier jour de l'année", () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      expect(formatAsISODate(date)).toBe('2024-01-01');
    });

    it("gère le dernier jour de l'année", () => {
      const date = new Date('2024-12-31T23:59:59.000Z');
      expect(formatAsISODate(date)).toBe('2024-12-31');
    });
  });

  describe('formatFrenchDate()', () => {
    it('formate une date au format français DD/MM/YYYY', () => {
      const date = new Date('2024-01-25T16:48:30.000Z');
      expect(formatFrenchDate(date)).toBe('25/01/2024');
    });

    it('gère les jours et mois à un chiffre avec padding', () => {
      const date = new Date('2024-06-05T00:00:00.000Z');
      expect(formatFrenchDate(date)).toBe('05/06/2024');
    });

    it('gère le premier jour du mois', () => {
      const date = new Date('2024-03-01T00:00:00.000Z');
      expect(formatFrenchDate(date)).toBe('01/03/2024');
    });
  });

  describe('formatFrenchDateTime()', () => {
    it('formate une date avec heure au format français', () => {
      const date = new Date('2024-01-25T14:30:00.000Z');
      const result = formatFrenchDateTime(date);
      expect(result).toMatch(/25\/01\/2024/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('gère minuit', () => {
      const date = new Date('2024-01-25T00:00:00.000Z');
      const result = formatFrenchDateTime(date);
      expect(result).toMatch(/25\/01\/2024/);
    });

    it('gère les heures à un chiffre avec padding', () => {
      const date = new Date('2024-01-25T05:05:00.000Z');
      const result = formatFrenchDateTime(date);
      expect(result).toMatch(/25\/01\/2024/);
    });
  });
});
