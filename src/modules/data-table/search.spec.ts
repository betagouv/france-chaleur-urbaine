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
  const cases: TestCase<string, boolean>[] = [
    ['empty query matches', '', true],
    ['accent-insensitive', 'elodie', true],
    ['every token must match', 'dupont 42', true],
    ['one missing token rejects', 'dupont 43', false],
    ['tags are searchable', 'FROID', true],
  ];
  it.each(cases)('%s', (_, query, expected) => expect(matchesSearch(index, query)).toStrictEqual(expected));
});
