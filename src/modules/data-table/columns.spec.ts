import { describe, expect, it } from 'vitest';

import { resolveColumns } from './columns';
import { buildExportColumns } from './export';

type Row = { name: string; tags: string[]; createdAt: Date; nested: { value: number } };

const row: Row = { createdAt: new Date('2024-05-01T00:00:00Z'), name: 'Réseau', nested: { value: 3 }, tags: ['a', 'b'] };

describe('resolveColumns', () => {
  it('derives id, accessor, header label and sortability', () => {
    const [byKey, byFn, display] = resolveColumns<Row>([
      { accessorKey: 'name', header: 'Nom' },
      { accessorFn: (item) => item.nested.value, header: 'Valeur', id: 'value', width: 80 },
      { cell: () => null, header: 'Actions', id: 'actions' },
    ]);
    expect([byKey.id, byKey.headerLabel, byKey.sortable, byKey.accessor(row)]).toStrictEqual(['name', 'Nom', true, 'Réseau']);
    expect([byFn.id, byFn.width, byFn.accessor(row)]).toStrictEqual(['value', 80, 3]);
    expect([display.id, display.sortable, display.accessor(row)]).toStrictEqual(['actions', false, undefined]);
  });

  it('drops hidden columns and throws without id', () => {
    expect(resolveColumns<Row>([{ accessorKey: 'name', header: 'Nom', hidden: true }])).toStrictEqual([]);
    expect(() => resolveColumns<Row>([{ cell: () => null, header: 'X', id: undefined as never }])).toThrow();
  });
});

describe('buildExportColumns', () => {
  it('serializes values, honours export overrides and extra columns', () => {
    const columns = buildExportColumns(
      resolveColumns<Row>([
        { accessorKey: 'name', export: { header: 'Nom du réseau' }, header: 'Nom' },
        { accessorKey: 'tags', header: 'Tags' },
        { accessorKey: 'createdAt', header: 'Créé le' },
        { accessorKey: 'nested', export: false, header: 'Objet' },
        { cell: () => null, export: { value: (item) => item.nested.value }, header: 'Valeur', id: 'value' },
      ]),
      [{ header: 'Extra', value: () => 'x' }]
    );
    expect(columns.map((column) => [column.header, column.value(row)])).toStrictEqual([
      ['Nom du réseau', 'Réseau'],
      ['Tags', 'a, b'],
      ['Créé le', '2024-05-01T00:00:00.000Z'],
      ['Valeur', 3],
      ['Extra', 'x'],
    ]);
  });
});
