import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import { resolveUnrealizableReasonColumns, resolveUnrealizableReasonReset } from './unrealizable-reason';

type ResolveInput = { currentStatus: string | undefined; values: Parameters<typeof resolveUnrealizableReasonColumns>[1] };

describe('resolveUnrealizableReasonColumns', () => {
  const acceptedCases: TestCase<ResolveInput, ReturnType<typeof resolveUnrealizableReasonColumns>>[] = [
    {
      expectedOutput: { unrealizable_detail: 'Réseau à 450 m', unrealizable_reason: 'batiment_trop_eloigne' },
      input: {
        currentStatus: DEMANDE_STATUS.TO_PROCESS,
        values: {
          Status: DEMANDE_STATUS.UNREALISABLE,
          unrealizable_detail: 'Réseau à 450 m',
          unrealizable_reason: 'batiment_trop_eloigne',
        },
      },
      label: 'passage en Non réalisable avec motif et précision → les deux sont écrits',
    },
    {
      expectedOutput: { unrealizable_detail: null, unrealizable_reason: 'maison_individuelle' },
      input: {
        currentStatus: undefined,
        values: { Status: DEMANDE_STATUS.UNREALISABLE, unrealizable_detail: '', unrealizable_reason: 'maison_individuelle' },
      },
      label: 'précision vide → stockée à null',
    },
    {
      expectedOutput: { unrealizable_detail: 'Réseau privé non raccordable', unrealizable_reason: 'autre' },
      input: {
        currentStatus: DEMANDE_STATUS.RECONTACTED,
        values: { Status: DEMANDE_STATUS.UNREALISABLE, unrealizable_detail: 'Réseau privé non raccordable', unrealizable_reason: 'autre' },
      },
      label: 'Autre motif avec une précision suffisante → accepté',
    },
    {
      expectedOutput: { unrealizable_detail: null, unrealizable_reason: null },
      input: { currentStatus: DEMANDE_STATUS.UNREALISABLE, values: { Status: DEMANDE_STATUS.RECONTACTED } },
      label: 'sortie du statut Non réalisable → motif et précision vidés',
    },
    {
      expectedOutput: {},
      input: { currentStatus: DEMANDE_STATUS.UNREALISABLE, values: { Status: DEMANDE_STATUS.UNREALISABLE } },
      label: 'demande déjà Non réalisable → motif inchangé',
    },
    {
      expectedOutput: {},
      input: { currentStatus: DEMANDE_STATUS.TO_PROCESS, values: {} },
      label: 'mise à jour sans changement de statut → motif inchangé',
    },
  ];

  it.each(acceptedCases)('$label', ({ input, expectedOutput }) => {
    expect(resolveUnrealizableReasonColumns(input.currentStatus, input.values)).toStrictEqual(expectedOutput);
  });

  const rejectedCases: TestCase<ResolveInput, string>[] = [
    {
      expectedOutput: 'Un motif est obligatoire pour classer une demande en « Non réalisable ».',
      input: { currentStatus: DEMANDE_STATUS.TO_PROCESS, values: { Status: DEMANDE_STATUS.UNREALISABLE } },
      label: 'passage en Non réalisable sans motif → refusé',
    },
    {
      expectedOutput: 'Un motif est obligatoire pour classer une demande en « Non réalisable ».',
      input: {
        currentStatus: DEMANDE_STATUS.TO_PROCESS,
        values: { Status: DEMANDE_STATUS.UNREALISABLE, unrealizable_reason: 'batiment_trop_eloigne_fcu' },
      },
      label: 'motif réservé au classement automatique → refusé',
    },
    {
      expectedOutput: 'Précisez le motif en au moins 10 caractères.',
      input: {
        currentStatus: DEMANDE_STATUS.TO_PROCESS,
        values: { Status: DEMANDE_STATUS.UNREALISABLE, unrealizable_detail: 'trop loin', unrealizable_reason: 'autre' },
      },
      label: 'Autre motif avec une précision trop courte → refusé',
    },
    {
      expectedOutput: 'Le motif ne peut être renseigné qu’au passage en « Non réalisable ».',
      input: {
        currentStatus: DEMANDE_STATUS.UNREALISABLE,
        values: { Status: DEMANDE_STATUS.UNREALISABLE, unrealizable_reason: 'maison_individuelle' },
      },
      label: 'motif envoyé sur une demande déjà Non réalisable → refusé',
    },
    {
      expectedOutput: 'Le motif ne peut être renseigné qu’au passage en « Non réalisable ».',
      input: {
        currentStatus: DEMANDE_STATUS.TO_PROCESS,
        values: { Status: DEMANDE_STATUS.RECONTACTED, unrealizable_reason: 'maison_individuelle' },
      },
      label: 'motif envoyé avec un autre statut → refusé',
    },
  ];

  it.each(rejectedCases)('$label', ({ input, expectedOutput }) => {
    expect(() => resolveUnrealizableReasonColumns(input.currentStatus, input.values)).toThrowError(
      expect.objectContaining({ code: 'BAD_REQUEST', message: expectedOutput })
    );
  });
});

describe('resolveUnrealizableReasonReset', () => {
  const cases: TestCase<string | undefined, ReturnType<typeof resolveUnrealizableReasonReset>>[] = [
    {
      expectedOutput: { unrealizable_detail: null, unrealizable_reason: null },
      input: DEMANDE_STATUS.RECONTACTED,
      label: 'autre statut → motif vidé',
    },
    { expectedOutput: {}, input: DEMANDE_STATUS.UNREALISABLE, label: 'Non réalisable → motif inchangé' },
    { expectedOutput: {}, input: undefined, label: 'statut absent → motif inchangé' },
  ];

  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(resolveUnrealizableReasonReset(input)).toStrictEqual(expectedOutput);
  });
});
