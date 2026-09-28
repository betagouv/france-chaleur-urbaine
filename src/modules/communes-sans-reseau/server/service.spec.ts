import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { countByMonth } from './service';

describe('countByMonth', () => {
  const cases: TestCase<{ dates: Date[]; startDate: string; endDate: string }, Record<string, number>>[] = [
    {
      expectedOutput: {},
      input: { dates: [], endDate: '2025-02-01', startDate: '2025-01-01' },
      label: 'aucune date → objet vide',
    },
    {
      expectedOutput: { '2025-01-01': 2 },
      input: { dates: [new Date('2025-01-05'), new Date('2025-01-20')], endDate: '2025-02-01', startDate: '2025-01-01' },
      label: 'deux dates dans le mois → comptées ensemble',
    },
    {
      expectedOutput: { '2025-01-01': 1, '2025-02-01': 1 },
      input: { dates: [new Date('2025-01-05'), new Date('2025-02-05')], endDate: '2025-03-01', startDate: '2025-01-01' },
      label: 'deux mois → une clé par mois',
    },
    {
      expectedOutput: { '2025-01-01': 1 },
      input: {
        dates: [new Date('2024-12-31'), new Date('2025-01-01'), new Date('2025-02-01')],
        endDate: '2025-02-01',
        startDate: '2025-01-01',
      },
      label: 'bornes : début inclus, fin exclue',
    },
  ];
  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(countByMonth(input.dates, input.startDate, input.endDate)).toStrictEqual(expectedOutput);
  });
});
