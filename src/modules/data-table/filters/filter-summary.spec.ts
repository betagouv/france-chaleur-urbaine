import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { summarizeFilterValue } from './filter-summary';
import { EMPTY_FACET_KEY, type FilterDef } from './filter-types';

type Row = { status: string | null; distance: number; createdAt: string; name: string; active: boolean };

const labels: Record<string, string> = { closed: 'Fermé', open: 'Ouvert' };

describe('summarizeFilterValue', () => {
  const testCases: TestCase<[FilterDef<Row>, unknown], string>[] = [
    {
      expectedOutput: 'Ouvert, Aucun',
      input: [
        { formatOption: (key) => labels[key], getValue: (row) => row.status, id: 'status', label: 'Statut', type: 'facets' },
        ['open', EMPTY_FACET_KEY],
      ],
      label: 'facets: formatted keys, empty key labelled',
    },
    {
      expectedOutput: '4 valeurs',
      input: [{ getValue: (row) => row.status, id: 'status', label: 'Statut', type: 'facets' }, ['a', 'b', 'c', 'd']],
      label: 'facets: count above three values',
    },
    {
      expectedOutput: '10 – 250 m',
      input: [{ getValue: (row) => row.distance, id: 'distance', label: 'Distance', type: 'range', unit: 'm' }, [10, 250]],
      label: 'range with unit',
    },
    {
      expectedOutput: 'du 01/01/2024 au 31/01/2024 vides incluses',
      input: [
        { getValue: (row) => row.createdAt, id: 'createdAt', label: 'Créé', type: 'dateRange' },
        { from: '2024-01-01', includeEmpty: true, to: '2024-01-31' },
      ],
      label: 'dateRange: both bounds and empties',
    },
    {
      expectedOutput: '« dupont »',
      input: [{ getValue: (row) => row.name, id: 'name', label: 'Nom', type: 'text' }, 'dupont'],
      label: 'text',
    },
    {
      expectedOutput: 'Sans statut',
      input: [
        { emptyLabel: 'Sans statut', getValue: (row) => row.status, id: 'hasStatus', label: 'Statut', type: 'emptyOrFilled' },
        'empty',
      ],
      label: 'emptyOrFilled with custom label',
    },
    {
      expectedOutput: 'actif',
      input: [
        { id: 'active', label: 'Actif', predicate: (row: Row, value: boolean) => row.active === value, render: () => null, type: 'custom' },
        true,
      ],
      label: 'custom',
    },
  ];
  it.each(testCases)('$label', ({ input: [filter, value], expectedOutput }) => {
    expect(summarizeFilterValue(filter, value)).toStrictEqual(expectedOutput);
  });
});
