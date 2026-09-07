import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { resolveColumns } from './columns';
import { buildSearchIndex, defaultSearchText, matchesSearch } from './search';

type Row = { name: string; count: number; tags: string[]; nested: { deep: true } };

const row: Row = { count: 42, name: 'Élodie Dupont', nested: { deep: true }, tags: ['chaud', 'froid'] };
const columns = resolveColumns<Row>([
  { accessorKey: 'name', header: 'Nom' },
  { accessorKey: 'count', header: 'Compte' },
  { accessorKey: 'tags', header: 'Tags' },
  { accessorKey: 'nested', header: 'Objet' },
]);

describe('defaultSearchText', () => {
  it('indexes strings, numbers and string arrays, ignores objects', () => {
    expect(defaultSearchText(row, columns)).toStrictEqual('Élodie Dupont 42 chaud froid');
  });
});

describe('matchesSearch', () => {
  const index = buildSearchIndex([row], (item) => defaultSearchText(item, columns))[0];
  const testCases: TestCase<string, boolean>[] = [
    { expectedOutput: true, input: '', label: 'empty query matches' },
    { expectedOutput: true, input: 'elodie', label: 'accent-insensitive' },
    { expectedOutput: true, input: 'dupont 42', label: 'every token must match' },
    { expectedOutput: false, input: 'dupont 43', label: 'one missing token rejects' },
    { expectedOutput: true, input: 'FROID', label: 'tags are searchable' },
  ];
  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(matchesSearch(index, input)).toStrictEqual(expectedOutput);
  });
});
