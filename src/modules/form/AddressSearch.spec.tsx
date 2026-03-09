import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { highlightMatch } from './AddressSearch';

function render(...args: Parameters<typeof highlightMatch>): string {
  const node = highlightMatch(...args);
  if (typeof node === 'string') return node;
  return renderToStaticMarkup(node as React.ReactElement);
}

const testCases: TestCase<Parameters<typeof highlightMatch>, string>[] = [
  {
    expectedOutput: 'Paris',
    input: ['Paris', 'xyz'],
    label: 'retourne le texte brut si aucun mot ne matche',
  },
  {
    expectedOutput: 'Paris',
    input: ['Paris', ''],
    label: 'retourne le texte brut si la query est vide',
  },
  {
    expectedOutput: '<strong>Par</strong>is',
    input: ['Paris', 'Par'],
    label: 'met en gras la correspondance exacte',
  },
  {
    expectedOutput: '<strong>Paris</strong>',
    input: ['Paris', 'paris'],
    label: 'est insensible à la casse',
  },
  {
    // normalize('café') = 'cafe' → matche tout le mot, affiche l'original avec accent
    expectedOutput: '<strong>café</strong>',
    input: ['café', 'cafe'],
    label: 'matche le texte accentué avec une recherche sans accent',
  },
  {
    // normalize('café') = 'cafe' → matche tout le mot, affiche l'original sans accent
    expectedOutput: '<strong>cafe</strong>',
    input: ['cafe', 'café'],
    label: 'matche le texte non-accentué avec une recherche accentuée',
  },
  {
    expectedOutput: '1 <strong>rue</strong> de <strong>Par</strong>is',
    input: ['1 rue de Paris', 'rue par'],
    label: 'matche chaque mot de la query indépendamment',
  },
];

describe('highlightMatch()', () => {
  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(render(...input)).toBe(expectedOutput);
  });
});
