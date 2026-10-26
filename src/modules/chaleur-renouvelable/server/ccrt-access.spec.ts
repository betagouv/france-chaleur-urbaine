import { expect, it } from 'vitest';

import type { Permission } from '@/modules/permissions/types';
import type { TestCase } from '@/tests/trpc-helpers';
import { testUsers } from '@/tests/trpc-helpers';

import { canUserAccessCcrtDemand } from './ccrt-access';

const demand = {
  commune_code: '13055',
  departement_code: '13',
  epci_code: 'EPCI-13',
  ept_code: 'EPT-13',
  region_code: '93',
  validated: true,
};

const cases: TestCase<Permission[], boolean>[] = [
  { expectedOutput: true, input: [{ resource_id: '13055', type: 'commune' }], label: 'commune' },
  { expectedOutput: true, input: [{ resource_id: 'EPCI-13', type: 'epci' }], label: 'EPCI' },
  { expectedOutput: true, input: [{ resource_id: 'EPT-13', type: 'ept' }], label: 'EPT' },
  { expectedOutput: true, input: [{ resource_id: '13', type: 'departement' }], label: 'department' },
  { expectedOutput: true, input: [{ resource_id: '93', type: 'region' }], label: 'region' },
  { expectedOutput: false, input: [{ resource_id: '75056', type: 'commune' }], label: 'another territory' },
  { expectedOutput: false, input: [{ resource_id: '13', type: 'reseau_de_chaleur' }], label: 'network without a territorial permission' },
  {
    expectedOutput: false,
    input: [{ resource_id: 'operator', type: 'organization' }],
    label: 'organization without a territorial permission',
  },
  { expectedOutput: false, input: [], label: 'no permissions' },
];

it.each(cases)('uses classic permissions: $label', ({ input, expectedOutput }) => {
  expect(canUserAccessCcrtDemand(testUsers.ccrt, input, demand)).toStrictEqual(expectedOutput);
});

it('hides unpublished demands from CCRT accounts even with matching permissions', () => {
  expect(
    canUserAccessCcrtDemand(testUsers.ccrt, [{ resource_id: '13055', type: 'commune' }], { ...demand, validated: false })
  ).toStrictEqual(false);
});
