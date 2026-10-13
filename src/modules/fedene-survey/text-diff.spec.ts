import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { type DiffSegment, diffValues } from './text-diff';

const render = (segments: DiffSegment[]) =>
  segments.map(({ kind, text }) => (kind === 'different' ? `[${text}]` : kind === 'variant' ? `{${text}}` : text)).join('');

describe('diffValues()', () => {
  const testCases: TestCase<[string, string], { left: string; right: string }>[] = [
    { expectedOutput: { left: 'Orcières', right: 'Orcières' }, input: ['Orcières', 'Orcières'], label: 'valeurs identiques' },
    {
      expectedOutput: { left: '{Commune} {de} {Cérilly}', right: '{COMMUNE} {DE} {CERILLY}' },
      input: ['Commune de Cérilly', 'COMMUNE DE CERILLY'],
      label: 'casse et accents : variantes, rien de différent',
    },
    {
      expectedOutput: { left: "[Commune d']Orcières", right: 'Orcières' },
      input: ["Commune d'Orcières", 'Orcières'],
      label: 'préfixe en plus à gauche',
    },
    {
      expectedOutput: { left: 'Dalkia Poitiers', right: 'Dalkia Poitiers[ (DALKIA)]' },
      input: ['Dalkia Poitiers', 'Dalkia Poitiers (DALKIA)'],
      label: 'groupe ajouté à droite',
    },
    {
      expectedOutput: { left: '[MAIRIE] DE CERILLY', right: '[COMMUNE] DE CERILLY' },
      input: ['MAIRIE DE CERILLY', 'COMMUNE DE CERILLY'],
      label: 'premier mot différent',
    },
    { expectedOutput: { left: '', right: '[Orcières]' }, input: ['', 'Orcières'], label: 'valeur vide à gauche' },
    {
      expectedOutput: { left: '[Ville de ]Paris', right: 'Paris[ Habitat]' },
      input: ['Ville de Paris', 'Paris Habitat'],
      label: 'mot commun déplacé : aligné sur le mot, pas sur les espaces',
    },
    {
      expectedOutput: {
        left: '[CPCU - ]Compagnie {parisienne}',
        right: 'Compagnie {Parisienne}[ de Chauffage Urbain (CPCU)]',
      },
      input: ['CPCU - Compagnie parisienne', 'Compagnie Parisienne de Chauffage Urbain (CPCU)'],
      label: 'sigle et développé',
    },
    {
      expectedOutput: { left: '{Cœur} de ville', right: '{Coeur} de ville' },
      input: ['Cœur de ville', 'Coeur de ville'],
      label: 'ligature',
    },
    {
      expectedOutput: { left: 'Lannion[-]{Trégor} {Communauté}', right: 'Lannion[ ]{Tregor} {communauté}' },
      input: ['Lannion-Trégor Communauté', 'Lannion Tregor communauté'],
      label: 'séparateur différent, mots en variantes',
    },
    {
      expectedOutput: { left: 'MSE [(Meridia Smart Energie) ]Réseau chaud', right: 'MSE Réseau chaud' },
      input: ['MSE (Meridia Smart Energie) Réseau chaud', 'MSE Réseau chaud'],
      label: 'parenthèse en plus au milieu',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    const { left, right } = diffValues(...input);
    expect({ left: render(left), right: render(right) }).toStrictEqual(expectedOutput);
  });
});
