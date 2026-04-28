import { describe, expect, it } from 'vitest';

import type { TestCaseBoolean } from '@/tests/trpc-helpers';
import type { UserRole } from '@/types/enum/UserRole';

import type { Permission } from '../types';
import { canUserAccessDemand, type DemandForAccess, isUserResponsibleForDemand } from './demand-access';

type UserWithRole = { id: string; role: UserRole };

type TestInput = {
  user: UserWithRole;
  permissions: Permission[];
  demand: DemandForAccess;
};

const admin: UserWithRole = { id: '1', role: 'admin' };
const gestionnaire: UserWithRole = { id: '1', role: 'gestionnaire' };
const collectivite: UserWithRole = { id: '1', role: 'collectivite' };
const alec: UserWithRole = { id: '1', role: 'alec' };
const particulier: UserWithRole = { id: '1', role: 'particulier' };

const baseDemand: DemandForAccess = {
  commune_code: '75056',
  departement_code: '75',
  epci_code: '200054781',
  ept_code: 'T1',
  network_id: 1,
  network_type: 'existant',
  region_code: '11',
  validated: true,
};

const unvalidated: DemandForAccess = { ...baseDemand, validated: false };
const constructionDemand: DemandForAccess = { ...baseDemand, network_type: 'en_construction' };

const networkExistant: Permission = { resource_id: '1', type: 'reseau_existant' };
const networkConstruction: Permission = { resource_id: '1', type: 'reseau_en_construction' };
const networkWrongId: Permission = { resource_id: '999', type: 'reseau_existant' };
const commune75056: Permission = { resource_id: '75056', type: 'commune' };
const dept75: Permission = { resource_id: '75', type: 'departement' };
const dept13: Permission = { resource_id: '13', type: 'departement' };
const region11: Permission = { resource_id: '11', type: 'region' };
const eptT1: Permission = { resource_id: 'T1', type: 'ept' };
const epci200054781: Permission = { resource_id: '200054781', type: 'epci' };
const epciWrong: Permission = { resource_id: '200000000', type: 'epci' };
const national: Permission = { resource_id: null, type: 'national' };

const testLabel = ({ user, permissions, demand }: TestInput): string => {
  const parts: string[] = [user.role];
  if (permissions.length > 0) {
    parts.push(`[${permissions.map((p) => `${p.type}:${p.resource_id ?? 'null'}`).join(', ')}]`);
  } else {
    parts.push('[no perms]');
  }
  if (!demand.validated) parts.push('(unvalidated)');
  if (demand.network_type === 'en_construction') parts.push('(construction)');
  return parts.join(' ');
};

describe('canUserAccessDemand', () => {
  const cases: TestCaseBoolean<TestInput>[] = [
    // Admin — always true
    { expectedOutput: true, input: { demand: baseDemand, permissions: [], user: admin } },
    { expectedOutput: true, input: { demand: unvalidated, permissions: [], user: admin } },

    // Particulier — always false
    { expectedOutput: false, input: { demand: baseDemand, permissions: [], user: particulier } },

    // Gestionnaire with network permissions
    { expectedOutput: true, input: { demand: baseDemand, permissions: [networkExistant], user: gestionnaire } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [networkWrongId], user: gestionnaire } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [networkConstruction], user: gestionnaire } },
    { expectedOutput: true, input: { demand: constructionDemand, permissions: [networkConstruction], user: gestionnaire } },
    { expectedOutput: false, input: { demand: unvalidated, permissions: [networkExistant], user: gestionnaire } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [], user: gestionnaire } },

    // Gestionnaire with territory permissions (decoupled — any role can have any permission type)
    { expectedOutput: true, input: { demand: baseDemand, permissions: [commune75056], user: gestionnaire } },
    { expectedOutput: true, input: { demand: baseDemand, permissions: [national], user: gestionnaire } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [dept13], user: gestionnaire } },

    // Collectivité with territory permissions
    { expectedOutput: true, input: { demand: baseDemand, permissions: [commune75056], user: collectivite } },
    { expectedOutput: true, input: { demand: baseDemand, permissions: [dept75], user: collectivite } },
    { expectedOutput: true, input: { demand: baseDemand, permissions: [region11], user: collectivite } },
    { expectedOutput: true, input: { demand: baseDemand, permissions: [eptT1], user: collectivite } },
    { expectedOutput: true, input: { demand: baseDemand, permissions: [epci200054781], user: collectivite } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [epciWrong], user: collectivite } },
    { expectedOutput: true, input: { demand: baseDemand, permissions: [national], user: collectivite } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [dept13], user: collectivite } },
    { expectedOutput: false, input: { demand: unvalidated, permissions: [commune75056], user: collectivite } },

    // Collectivité with network permissions (decoupled)
    { expectedOutput: true, input: { demand: baseDemand, permissions: [networkExistant], user: collectivite } },

    // ALEC — same logic
    { expectedOutput: true, input: { demand: baseDemand, permissions: [dept75], user: alec } },
    { expectedOutput: true, input: { demand: baseDemand, permissions: [epci200054781], user: alec } },
    { expectedOutput: true, input: { demand: constructionDemand, permissions: [networkConstruction], user: alec } },

    // Multiple permissions — one match is enough
    {
      expectedOutput: true,
      input: { demand: baseDemand, permissions: [{ resource_id: '13055', type: 'commune' }, dept75], user: collectivite },
    },

    // Mixed network + territory permissions
    { expectedOutput: true, input: { demand: baseDemand, permissions: [networkExistant, dept75], user: gestionnaire } },
    { expectedOutput: true, input: { demand: baseDemand, permissions: [networkWrongId, dept75], user: gestionnaire } },
  ];

  cases.forEach(({ input, expectedOutput }) => {
    const action = expectedOutput ? 'grants' : 'denies';
    it(`${action} access: ${testLabel(input)}`, () => {
      expect(canUserAccessDemand(input.user, input.permissions, input.demand)).toStrictEqual(expectedOutput);
    });
  });
});

describe('isUserResponsibleForDemand', () => {
  const unaffectedDemand: DemandForAccess = { ...baseDemand, network_id: null, network_type: null };

  const cases: TestCaseBoolean<TestInput>[] = [
    // Admin — never responsible
    { expectedOutput: false, input: { demand: baseDemand, permissions: [networkExistant], user: admin } },
    { expectedOutput: false, input: { demand: unaffectedDemand, permissions: [national], user: admin } },

    // Particulier — never responsible
    { expectedOutput: false, input: { demand: baseDemand, permissions: [networkExistant], user: particulier } },

    // Unvalidated demand — never responsible
    { expectedOutput: false, input: { demand: unvalidated, permissions: [networkExistant], user: gestionnaire } },

    // Demand with network → only matching network permission grants responsibility
    { expectedOutput: true, input: { demand: baseDemand, permissions: [networkExistant], user: gestionnaire } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [networkWrongId], user: gestionnaire } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [networkConstruction], user: gestionnaire } },
    { expectedOutput: true, input: { demand: constructionDemand, permissions: [networkConstruction], user: gestionnaire } },
    // Territory perm on a demand affected to a network → NOT responsible (visible only)
    { expectedOutput: false, input: { demand: baseDemand, permissions: [commune75056], user: collectivite } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [dept75], user: collectivite } },
    { expectedOutput: false, input: { demand: baseDemand, permissions: [national], user: collectivite } },
    // Mix: territory + matching network → responsible (network match wins)
    { expectedOutput: true, input: { demand: baseDemand, permissions: [networkExistant, dept75], user: gestionnaire } },
    // Mix: territory + non-matching network → NOT responsible
    { expectedOutput: false, input: { demand: baseDemand, permissions: [networkWrongId, dept75], user: gestionnaire } },

    // Demand without network → any matching territory permission grants responsibility
    { expectedOutput: true, input: { demand: unaffectedDemand, permissions: [commune75056], user: collectivite } },
    { expectedOutput: true, input: { demand: unaffectedDemand, permissions: [dept75], user: collectivite } },
    { expectedOutput: true, input: { demand: unaffectedDemand, permissions: [region11], user: collectivite } },
    { expectedOutput: true, input: { demand: unaffectedDemand, permissions: [eptT1], user: collectivite } },
    { expectedOutput: true, input: { demand: unaffectedDemand, permissions: [epci200054781], user: collectivite } },
    { expectedOutput: false, input: { demand: unaffectedDemand, permissions: [epciWrong], user: collectivite } },
    { expectedOutput: true, input: { demand: unaffectedDemand, permissions: [national], user: collectivite } },
    { expectedOutput: false, input: { demand: unaffectedDemand, permissions: [dept13], user: collectivite } },
    // Demand without network + only network perm → NOT responsible (case theoretical, perm route wouldn't grant access)
    { expectedOutput: false, input: { demand: unaffectedDemand, permissions: [networkExistant], user: gestionnaire } },

    // No permissions
    { expectedOutput: false, input: { demand: baseDemand, permissions: [], user: gestionnaire } },
    { expectedOutput: false, input: { demand: unaffectedDemand, permissions: [], user: collectivite } },
  ];

  cases.forEach(({ input, expectedOutput }) => {
    const action = expectedOutput ? 'is responsible' : 'is not responsible';
    const networkLabel = input.demand.network_id === null ? '(no-network)' : '';
    it(`${action}: ${testLabel(input)}${networkLabel}`, () => {
      expect(isUserResponsibleForDemand(input.user, input.permissions, input.demand)).toStrictEqual(expectedOutput);
    });
  });
});
