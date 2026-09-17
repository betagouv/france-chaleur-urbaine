import type { User } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { serverConfig } from '@/server/config';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

import type { BrevoBlockedContact } from './brevo-client';

vi.mock('./brevo-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./brevo-client')>()),
  isBrevoConfigured: vi.fn(() => true),
  listAllBlockedContacts: vi.fn().mockResolvedValue([]),
  listEmailEvents: vi.fn().mockResolvedValue([]),
  unblockContact: vi.fn().mockResolvedValue(true),
}));

import { listAllBlockedContacts, unblockContact } from './brevo-client';

const blockedUserId = uuid(300);
const blockedUserEmail = `blocked-${blockedUserId}@test.local`;
// Brevo returns the Paris wall-clock time with a "Z" suffix: 12:00 "Z" in September means 10:00 UTC.
const brevoBlockedAt = '2026-09-01T12:00:00.000Z';
const blockedAt = new Date('2026-09-01T10:00:00.000Z');

const brevoContact = (email: string, overrides: Partial<BrevoBlockedContact> = {}): BrevoBlockedContact => ({
  blockedAt: brevoBlockedAt,
  email,
  reason: { code: 'hardBounce' },
  ...overrides,
});

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.professionnel },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: false, input: testUsers.collectivite },
  { expectedOutput: false, input: testUsers.alec },
  { expectedOutput: false, input: testUsers.ccrt },
  { expectedOutput: true, input: testUsers.admin },
];

function testPermissions(
  permissions: TestCaseBoolean<Partial<User> | null>[],
  callRoute: (user: Partial<User> | null) => () => Promise<unknown>
) {
  permissions.forEach(({ input: user, expectedOutput: allowed }) => {
    it(`${allowed ? 'autorise' : 'refuse'} ${user?.role ?? 'non authentifié'}`, async () => {
      if (allowed) {
        await expect(callRoute(user)()).resolves.toBeDefined();
      } else {
        await expect(callRoute(user)).rejects.toMatchObject(forbiddenError);
      }
    });
  });
}

const listEvents = (type: string) =>
  kdb
    .selectFrom('events')
    .select(['type', 'context_type', 'context_id', 'author_id', 'data', 'created_at'])
    .where('type', '=', type as any)
    .execute();

describe('email.deliverability', () => {
  beforeEach(async () => {
    await cleanDatabase();
    // The admin must exist: unblock events reference their author (FK on events.author_id).
    await seedTableUser([{ email: blockedUserEmail.toUpperCase(), id: blockedUserId }, { ...testUsers.admin }]);
    vi.mocked(listAllBlockedContacts).mockResolvedValue([]);
    serverConfig.BREVO_ALLOW_WRITES = false;
  });

  describe('permissions', () => {
    describe('getSettings', () => {
      testPermissions(adminOnly, (user) => () => createTestCaller(user).email.deliverability.getSettings());
    });
    describe('listBlockedContacts', () => {
      testPermissions(adminOnly, (user) => () => createTestCaller(user).email.deliverability.listBlockedContacts());
    });
    describe('syncBlockedContacts', () => {
      testPermissions(adminOnly, (user) => () => createTestCaller(user).email.deliverability.syncBlockedContacts());
    });
    describe('getEmailDeliverability', () => {
      testPermissions(
        adminOnly,
        (user) => () => createTestCaller(user).email.deliverability.getEmailDeliverability({ email: blockedUserEmail })
      );
    });
    describe('listEmailEvents', () => {
      testPermissions(adminOnly, (user) => () => createTestCaller(user).email.deliverability.listEmailEvents({ email: blockedUserEmail }));
    });
    describe('unblockContact', () => {
      // Only the refusals: the admin path is covered below (it depends on the writes flag).
      testPermissions(
        adminOnly.filter((testCase) => !testCase.expectedOutput),
        (user) => () => createTestCaller(user).email.deliverability.unblockContact({ email: blockedUserEmail })
      );
    });
  });

  describe('syncBlockedContacts', () => {
    it('mirrors the Brevo blocklist and traces a blocked event dated with the Brevo date on the matching account', async () => {
      vi.mocked(listAllBlockedContacts).mockResolvedValue([brevoContact(blockedUserEmail)]);

      const result = await createTestCaller(testUsers.admin).email.deliverability.syncBlockedContacts();

      expect(result).toStrictEqual({ added: 1, removed: 0, skipped: false, total: 1 });
      const rows = await kdb.selectFrom('email_blocked_contacts').select(['email', 'reason_code', 'blocked_at']).execute();
      expect(rows).toStrictEqual([{ blocked_at: blockedAt, email: blockedUserEmail, reason_code: 'hardBounce' }]);
      expect(await listEvents('user_email_blocked')).toStrictEqual([
        {
          author_id: null,
          context_id: blockedUserId,
          context_type: 'user',
          created_at: blockedAt,
          data: { email: blockedUserEmail, reason_code: 'hardBounce' },
          type: 'user_email_blocked',
        },
      ]);
    });

    it('is replayable: a second sync with the same list creates no duplicate event', async () => {
      vi.mocked(listAllBlockedContacts).mockResolvedValue([brevoContact(blockedUserEmail)]);
      const caller = createTestCaller(testUsers.admin);

      await caller.email.deliverability.syncBlockedContacts();
      const result = await caller.email.deliverability.syncBlockedContacts();

      expect(result).toStrictEqual({ added: 0, removed: 0, skipped: false, total: 1 });
      expect(await listEvents('user_email_blocked')).toHaveLength(1);
    });

    it('removes contacts unblocked outside FCU and traces an external unblock event', async () => {
      vi.mocked(listAllBlockedContacts).mockResolvedValue([brevoContact(blockedUserEmail)]);
      const caller = createTestCaller(testUsers.admin);
      await caller.email.deliverability.syncBlockedContacts();

      vi.mocked(listAllBlockedContacts).mockResolvedValue([]);
      const result = await caller.email.deliverability.syncBlockedContacts();

      expect(result).toStrictEqual({ added: 0, removed: 1, skipped: false, total: 0 });
      expect(await kdb.selectFrom('email_blocked_contacts').select('email').execute()).toStrictEqual([]);
      expect(await listEvents('user_email_unblocked')).toMatchObject([
        { author_id: null, context_id: blockedUserId, context_type: 'user', data: { email: blockedUserEmail, source: 'external' } },
      ]);
    });
  });

  describe('getEmailDeliverability', () => {
    it('returns the blocked status of an address (case-insensitive match)', async () => {
      vi.mocked(listAllBlockedContacts).mockResolvedValue([brevoContact(blockedUserEmail)]);
      await createTestCaller(testUsers.admin).email.deliverability.syncBlockedContacts();

      const result = await createTestCaller(testUsers.admin).email.deliverability.getEmailDeliverability({
        email: blockedUserEmail.toUpperCase(),
      });

      expect(result).toMatchObject({
        blocked: { blocked_at: blockedAt, reason_code: 'hardBounce' },
        configured: true,
        writesEnabled: false,
      });
    });
  });

  describe('unblockContact', () => {
    it('refuses when Brevo writes are disabled on this instance', async () => {
      const callRoute = () => createTestCaller(testUsers.admin).email.deliverability.unblockContact({ email: blockedUserEmail });

      await expect(callRoute).rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(unblockContact).not.toHaveBeenCalled();
    });

    it('unblocks at Brevo, removes the mirror row and traces an admin unblock event', async () => {
      vi.mocked(listAllBlockedContacts).mockResolvedValue([brevoContact(blockedUserEmail)]);
      await createTestCaller(testUsers.admin).email.deliverability.syncBlockedContacts();
      serverConfig.BREVO_ALLOW_WRITES = true;

      const result = await createTestCaller(testUsers.admin).email.deliverability.unblockContact({ email: blockedUserEmail });

      expect(result).toStrictEqual({ wasBlocked: true });
      expect(unblockContact).toHaveBeenCalledWith(blockedUserEmail);
      expect(await kdb.selectFrom('email_blocked_contacts').select('email').execute()).toStrictEqual([]);
      expect(await listEvents('user_email_unblocked')).toMatchObject([
        {
          author_id: testUsers.admin.id,
          context_id: blockedUserId,
          context_type: 'user',
          data: { email: blockedUserEmail, source: 'admin' },
        },
      ]);
    });
  });
});
