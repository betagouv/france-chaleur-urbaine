import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedDemandeChaleurRenouvelable, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: false, input: testUsers.collectivite },
  { expectedOutput: true, input: testUsers.admin },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 3600 * 1000);

const seedDemand = (
  id: string,
  values: Partial<{ deleted_at: Date | null; pending_assignment_change: string | null; validated: boolean }>
) =>
  kdb
    .insertInto('demands')
    .values({ id, legacy_values: JSON.stringify({ Mail: `${id}@test.local` }), ...values })
    .execute();

const seedRequest = (status: 'pending' | 'processed') =>
  kdb
    .insertInto('network_change_requests')
    .values({
      contact_email: 'a@test.local',
      contact_first_name: 'A',
      contact_last_name: 'B',
      contact_type: 'exploitant',
      kind: 'autre',
      network_label: 'Réseau',
      payload: JSON.stringify({ dansCadreDemandeADEME: false, precisions: 'x' }),
      status,
    })
    .execute();

const seedJob = (status: 'error' | 'finished', updatedAt: Date) =>
  kdb.insertInto('jobs').values({ data: {}, status, type: 'build_tiles', updated_at: updatedAt }).execute();

describe('admin.getDashboardIndicators', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([{ ...testUsers.admin }]);
  });

  adminOnly.forEach(({ input: user, expectedOutput: allowed }) => {
    it(`${user ? user.role : 'anonymous'} ${allowed ? 'can' : 'cannot'} read the indicators`, async () => {
      const caller = createTestCaller(user);
      if (allowed) {
        await expect(caller.admin.getDashboardIndicators()).resolves.toBeDefined();
      } else {
        await expect(caller.admin.getDashboardIndicators()).rejects.toMatchObject(forbiddenError);
      }
    });
  });

  it('counts only the items waiting for the team', async () => {
    await seedDemand(uuid(1), { validated: false });
    await seedDemand(uuid(2), { deleted_at: daysAgo(1), validated: false }); // deleted: ignored
    await seedDemand(uuid(3), { pending_assignment_change: JSON.stringify({ comment: null }), validated: true });
    await seedDemand(uuid(4), { validated: true });
    await seedDemandeChaleurRenouvelable({ id: uuid(5), validated: false });
    await seedDemandeChaleurRenouvelable({ id: uuid(6), validated: true });
    await seedRequest('pending');
    await seedRequest('pending');
    await seedRequest('processed');
    await seedJob('error', daysAgo(1));
    await seedJob('error', daysAgo(10)); // older than the window: ignored
    await seedJob('finished', daysAgo(1));
    const caller = createTestCaller(testUsers.admin);

    expect(await caller.admin.getDashboardIndicators()).toStrictEqual({
      demandsToValidate: 1,
      jobsInError: 1,
      networkChangeRequestsPending: 2,
      pendingReassignments: 1,
      renewableHeatDemandsToValidate: 1,
    });
  });
});
