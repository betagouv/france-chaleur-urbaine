import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { formatAsISODate, formatAsISODateMinutes, formatFrenchDate, formatFrenchDateTime } from './date';

describe('date utilities', () => {
  describe('formatAsISODateMinutes()', () => {
    const testCases: TestCase<Date, string>[] = [
      {
        expectedOutput: '2024-01-25T16:48',
        input: new Date('2024-01-25T16:48:30.000Z'),
        label: 'formate une date au format ISO avec minutes',
      },
      {
        expectedOutput: '2024-12-31T00:00',
        input: new Date('2024-12-31T00:00:00.000Z'),
        label: 'gère minuit correctement',
      },
      {
        expectedOutput: '2024-06-15T09:05',
        input: new Date('2024-06-15T09:05:00.000Z'),
        label: 'gère les minutes à un chiffre',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(formatAsISODateMinutes(input)).toBe(expectedOutput);
    });
  });

  describe('formatAsISODate()', () => {
    const testCases: TestCase<Date, string>[] = [
      {
        expectedOutput: '2024-01-25',
        input: new Date('2024-01-25T16:48:30.000Z'),
        label: 'formate une date au format ISO date uniquement',
      },
      {
        expectedOutput: '2024-01-01',
        input: new Date('2024-01-01T00:00:00.000Z'),
        label: "gère le premier jour de l'année",
      },
      {
        expectedOutput: '2024-12-31',
        input: new Date('2024-12-31T23:59:59.000Z'),
        label: "gère le dernier jour de l'année",
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(formatAsISODate(input)).toBe(expectedOutput);
    });
  });

  describe('formatFrenchDate()', () => {
    const testCases: TestCase<Date, string>[] = [
      {
        expectedOutput: '25/01/2024',
        input: new Date('2024-01-25T16:48:30.000Z'),
        label: 'formate une date au format français DD/MM/YYYY',
      },
      {
        expectedOutput: '05/06/2024',
        input: new Date('2024-06-05T00:00:00.000Z'),
        label: 'gère les jours et mois à un chiffre avec padding',
      },
      {
        expectedOutput: '01/03/2024',
        input: new Date('2024-03-01T00:00:00.000Z'),
        label: 'gère le premier jour du mois',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(formatFrenchDate(input)).toBe(expectedOutput);
    });
  });

  describe('formatFrenchDateTime()', () => {
    type DateTimeTestCase = TestCase<Date, { datePattern: string; timePattern?: string }>;

    const testCases: DateTimeTestCase[] = [
      {
        expectedOutput: { datePattern: '25/01/2024', timePattern: '\\d{2}:\\d{2}' },
        input: new Date('2024-01-25T14:30:00.000Z'),
        label: 'formate une date avec heure au format français',
      },
      {
        expectedOutput: { datePattern: '25/01/2024' },
        input: new Date('2024-01-25T00:00:00.000Z'),
        label: 'gère minuit',
      },
      {
        expectedOutput: { datePattern: '25/01/2024' },
        input: new Date('2024-01-25T05:05:00.000Z'),
        label: 'gère les heures à un chiffre avec padding',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      const result = formatFrenchDateTime(input);
      expect(result).toMatch(new RegExp(expectedOutput.datePattern));
      if (expectedOutput.timePattern) {
        expect(result).toMatch(new RegExp(expectedOutput.timePattern));
      }
    });
  });
});
