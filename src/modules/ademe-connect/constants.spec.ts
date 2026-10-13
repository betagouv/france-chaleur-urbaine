import { describe, expect, it } from 'vitest';

import type { StructureType } from '@/modules/users/constants';
import type { TestCase, TestCaseBoolean } from '@/tests/trpc-helpers';
import { type UserRole, userRoles } from '@/types/enum/UserRole';

import { ALL_FCU_RUBRIQUES, buildRubriques, isSyncedRole } from './constants';

describe('buildRubriques', () => {
  const cases: TestCase<[UserRole | null | undefined, StructureType | null | undefined], string[] | undefined>[] = [
    { expectedOutput: undefined, input: [undefined, undefined], label: 'no role and no structure → undefined' },
    { expectedOutput: undefined, input: ['admin', null], label: 'admin has no rubrique → undefined' },
    { expectedOutput: ['FCU - rôle particulier'], input: ['particulier', null], label: 'particulier without structure' },
    {
      expectedOutput: ['FCU - rôle professionnel', "FCU - structure Bureau d'études"],
      input: ['professionnel', 'bureau_etudes'],
      label: 'professionnel with structure → role then structure',
    },
    {
      expectedOutput: ['FCU - rôle gestionnaire', 'FCU - structure Gestionnaire de réseau de chaleur'],
      input: ['gestionnaire', 'gestionnaire_reseaux'],
      label: 'gestionnaire with structure',
    },
    {
      expectedOutput: ['FCU - rôle collectivité', 'FCU - structure Collectivité'],
      input: ['collectivite', 'collectivite'],
      label: 'collectivité with structure',
    },
    { expectedOutput: ['FCU - rôle ALEC', 'FCU - structure ALEC'], input: ['alec', 'alec'], label: 'ALEC with structure' },
    { expectedOutput: ['FCU - rôle CCRT', 'FCU - structure CCRT'], input: ['ccrt', 'ccrt'], label: 'CCRT has its own rubriques' },
    { expectedOutput: ['FCU - structure Autre'], input: [null, 'autre'], label: 'structure only' },
  ];

  it.each(cases)('$label', ({ input: [role, structureType], expectedOutput }) => {
    expect(buildRubriques(role, structureType)).toStrictEqual(expectedOutput);
  });
});

describe('isSyncedRole', () => {
  const cases: TestCaseBoolean<UserRole | null | undefined>[] = [
    { expectedOutput: false, input: undefined },
    { expectedOutput: false, input: null },
    { expectedOutput: false, input: 'admin' },
    ...userRoles.filter((role) => role !== 'admin').map((role) => ({ expectedOutput: true, input: role })),
  ];

  cases.forEach(({ input, expectedOutput }) => {
    it(`${String(input)} → ${expectedOutput}`, () => {
      expect(isSyncedRole(input)).toStrictEqual(expectedOutput);
    });
  });
});

describe('ALL_FCU_RUBRIQUES', () => {
  it('lists every rubrique once (the list is sent as rubriquesASupprimer on each profile update)', () => {
    expect(new Set(ALL_FCU_RUBRIQUES).size).toStrictEqual(ALL_FCU_RUBRIQUES.length);
  });

  it('covers every synced role', () => {
    const roleRubriques = userRoles.filter(isSyncedRole).map((role) => buildRubriques(role)?.[0]);
    expect(roleRubriques.every((rubrique) => rubrique && ALL_FCU_RUBRIQUES.includes(rubrique))).toStrictEqual(true);
  });
});
