import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { getPrixReseauFiable, isPrixReseauCommunique, isPrixReseauHorsBornes } from './constants';

type PrixInput = number | null | undefined;

describe('isPrixReseauCommunique', () => {
  const testCases: TestCase<PrixInput, boolean>[] = [
    { expectedOutput: false, input: null, label: 'null → non communiqué' },
    { expectedOutput: false, input: undefined, label: 'undefined → non communiqué' },
    { expectedOutput: false, input: 0, label: '0 → non communiqué' },
    { expectedOutput: false, input: 0.07, label: 'centimes (< 1 €) → non communiqué' },
    { expectedOutput: true, input: 1, label: 'seuil de 1 € → communiqué' },
    { expectedOutput: true, input: 110, label: 'prix dans les bornes → communiqué' },
    { expectedOutput: true, input: 500, label: 'prix hors bornes → communiqué' },
  ];
  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(isPrixReseauCommunique(input)).toStrictEqual(expectedOutput);
  });
});

describe('isPrixReseauHorsBornes', () => {
  const testCases: TestCase<PrixInput, boolean>[] = [
    { expectedOutput: false, input: null, label: 'null → pas hors bornes' },
    { expectedOutput: false, input: 0, label: '0 (non communiqué) → pas hors bornes' },
    { expectedOutput: false, input: 0.07, label: 'centimes (non communiqué) → pas hors bornes' },
    { expectedOutput: true, input: 69, label: 'sous la borne basse → hors bornes' },
    { expectedOutput: false, input: 70, label: 'borne basse → dans les bornes' },
    { expectedOutput: false, input: 110, label: 'prix courant → dans les bornes' },
    { expectedOutput: false, input: 160, label: 'borne haute → dans les bornes' },
    { expectedOutput: true, input: 161, label: 'au-dessus de la borne haute → hors bornes' },
  ];
  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(isPrixReseauHorsBornes(input)).toStrictEqual(expectedOutput);
  });
});

describe('getPrixReseauFiable', () => {
  const testCases: TestCase<PrixInput, number | undefined>[] = [
    { expectedOutput: undefined, input: null, label: 'null → pas de prix fiable' },
    { expectedOutput: undefined, input: 0, label: '0 (non communiqué) → pas de prix fiable' },
    { expectedOutput: undefined, input: 0.07, label: 'centimes (non communiqué) → pas de prix fiable' },
    { expectedOutput: 110, input: 110, label: 'prix dans les bornes → prix conservé' },
    { expectedOutput: undefined, input: 500, label: 'prix hors bornes → pas de prix fiable' },
  ];
  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(getPrixReseauFiable(input)).toStrictEqual(expectedOutput);
  });
});
