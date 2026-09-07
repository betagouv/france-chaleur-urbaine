import { normalize } from '@/utils/strings';

import type { ResolvedColumn } from './types';

const isIndexable = (value: unknown): value is string | number | Array<string | number> =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  (Array.isArray(value) && value.every((item) => typeof item === 'string' || typeof item === 'number'));

/** Default searchable text of a row: every string, number or string[] column value, space-separated. */
export const defaultSearchText = <Row>(row: Row, columns: ResolvedColumn<Row>[]): string =>
  columns
    .map((column) => column.accessor(row))
    .filter(isIndexable)
    .map((value) => (Array.isArray(value) ? value.join(' ') : String(value)))
    .join(' ');

/** Normalized search index (one string per row), computed once per data/columns. */
export const buildSearchIndex = <Row>(rows: Row[], getText: (row: Row) => string): string[] => rows.map((row) => normalize(getText(row)));

/** Every query token must appear in the indexed text (accent and case insensitive). */
export const matchesSearch = (indexedText: string, query: string): boolean => {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  return tokens.every((token) => indexedText.includes(token));
};
