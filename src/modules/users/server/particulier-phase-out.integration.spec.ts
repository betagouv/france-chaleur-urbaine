import type { User } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { sendEmailTemplate } from '@/modules/email';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.professionnel },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: true, input: testUsers.admin },
];

const announcedParticulier = { email: 'deja-prevenu@test.local', id: uuid(201), role: 'particulier' as const };
const particulierToAnnounce = { email: 'a-prevenir@test.local', id: uuid(202), role: 'particulier' as const };
const inactiveParticulier = { active: false, email: 'inactif@test.local', id: uuid(203), role: 'particulier' as const };

describe('users.particulierPhaseOut', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.mocked(sendEmailTemplate).mockClear();
    await seedTableUser([testUsers.admin, testUsers.professionnel, announcedParticulier, particulierToAnnounce, inactiveParticulier]);
    await kdb
      .insertInto('events')
      .values({
        context_id: announcedParticulier.id,
        context_type: 'user',
        data: JSON.stringify({ deletion_date: '2026-12-01' }),
        type: 'user_particulier_deletion_announced',
      })
      .execute();
  });

  adminOnly.forEach(({ input: user, expectedOutput: allowed }) => {
    it(`getStatus ${allowed ? 'allows' : 'forbids'} ${user?.role ?? 'anonymous'}`, async () => {
      const call = () => createTestCaller(user).users.particulierPhaseOut.getStatus();
      if (allowed) {
        await expect(call()).resolves.toMatchObject({ announcedCount: 1, toAnnounceCount: 1 });
      } else {
        await expect(call()).rejects.toMatchObject(forbiddenError);
      }
    });
  });

  it('lists active particulier accounts with their announcement state', async () => {
    const status = await createTestCaller(testUsers.admin).users.particulierPhaseOut.getStatus();

    expect(status.accounts.map((account) => [account.email, account.announced_at !== null, account.email_blocked_reason])).toStrictEqual([
      ['a-prevenir@test.local', false, null],
      ['deja-prevenu@test.local', true, null],
    ]);
  });

  it('announces only the accounts not yet notified and records one event per email', async () => {
    const result = await createTestCaller(testUsers.admin).users.particulierPhaseOut.announceDeletion({ deletionDate: '2026-12-15' });

    expect(result).toStrictEqual({ sentCount: 1 });
    expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual([
      [
        'auth.utilisateur.suppression-compte-particulier',
        expect.objectContaining({ email: 'a-prevenir@test.local' }),
        { deletionDate: '15 décembre 2026' },
      ],
    ]);
    const events = await kdb
      .selectFrom('events')
      .select(['author_id', 'context_id', 'data'])
      .where('type', '=', 'user_particulier_deletion_announced')
      .orderBy('created_at')
      .execute();
    expect(events).toStrictEqual([
      { author_id: null, context_id: announcedParticulier.id, data: { deletion_date: '2026-12-01' } },
      { author_id: testUsers.admin.id, context_id: particulierToAnnounce.id, data: { deletion_date: '2026-12-15' } },
    ]);

    // a second run has nothing left to send
    const secondRun = await createTestCaller(testUsers.admin).users.particulierPhaseOut.announceDeletion({ deletionDate: '2026-12-15' });
    expect(secondRun).toStrictEqual({ sentCount: 0 });
    expect(sendEmailTemplate).toHaveBeenCalledTimes(1);
  });

  it('forbids the announcement to non admins', async () => {
    await expect(
      createTestCaller(testUsers.professionnel).users.particulierPhaseOut.announceDeletion({ deletionDate: '2026-12-15' })
    ).rejects.toMatchObject(forbiddenError);
  });
});
