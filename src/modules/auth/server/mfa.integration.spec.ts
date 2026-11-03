import { generate } from 'otplib';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { businessRules } from '@/modules/app/business-rules';
import { sendEmailTemplate } from '@/modules/email';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

import { getMfaEnrollment, MFA_INVALID_CODE_MESSAGE, MFA_LOCKED_MESSAGE, verifyMfaCode } from './mfa';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

const getTotpColumns = (userId: string) =>
  kdb
    .selectFrom('users')
    .select(['totp_secret', 'totp_enrolled_at', 'totp_last_used_step', 'totp_failed_attempts', 'totp_locked_until'])
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();

const getUserEvents = (userId: string) =>
  kdb.selectFrom('events').select(['type', 'author_id', 'data']).where('context_id', '=', userId).orderBy('created_at').execute();

const enrollAdmin = async (userId: string) => {
  const enrollment = await getMfaEnrollment(userId);
  await verifyMfaCode(userId, await generate({ secret: enrollment!.secret }));
  return enrollment!.secret;
};

describe('mfa', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.mocked(sendEmailTemplate).mockClear();
  });

  describe('getMfaEnrollment', () => {
    it('creates a pending secret on first call and returns the same one afterwards', async () => {
      await seedTableUser([testUsers.admin]);

      const first = await getMfaEnrollment(testUsers.admin.id);
      const second = await getMfaEnrollment(testUsers.admin.id);

      expect(first).not.toBeNull();
      expect(second).toStrictEqual(first);
      expect(first?.qrCodeDataUrl.startsWith('data:image/png;base64,')).toStrictEqual(true);
      expect(await getTotpColumns(testUsers.admin.id)).toStrictEqual({
        totp_enrolled_at: null,
        totp_failed_attempts: 0,
        totp_last_used_step: null,
        totp_locked_until: null,
        totp_secret: expect.any(String),
      });
    });

    it('returns null once the enrollment is confirmed', async () => {
      await seedTableUser([testUsers.admin]);
      await enrollAdmin(testUsers.admin.id);

      expect(await getMfaEnrollment(testUsers.admin.id)).toBeNull();
    });
  });

  describe('verifyMfaCode', () => {
    it('confirms the enrollment with the first valid code, records the time step, an event and an email', async () => {
      await seedTableUser([testUsers.admin]);
      const enrollment = await getMfaEnrollment(testUsers.admin.id);

      const user = await verifyMfaCode(testUsers.admin.id, await generate({ secret: enrollment!.secret }));

      expect(user).toStrictEqual({ active: true, email: testUsers.admin.email, id: testUsers.admin.id, role: 'admin' });
      expect(await getTotpColumns(testUsers.admin.id)).toStrictEqual({
        totp_enrolled_at: expect.any(Date),
        totp_failed_attempts: 0,
        totp_last_used_step: Math.floor(Date.now() / 1000 / 30),
        totp_locked_until: null,
        totp_secret: expect.any(String),
      });
      expect(await getUserEvents(testUsers.admin.id)).toStrictEqual([
        { author_id: testUsers.admin.id, data: {}, type: 'user_mfa_enrolled' },
      ]);
      expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual([
        ['auth.utilisateur.double-authentification-activee', expect.objectContaining({ email: testUsers.admin.email })],
      ]);
    });

    it('rejects a wrong code, a replayed code and a user without secret', async () => {
      await seedTableUser([testUsers.admin, testUsers.gestionnaire]);
      const enrollment = await getMfaEnrollment(testUsers.admin.id);
      const code = await generate({ secret: enrollment!.secret });

      await expect(verifyMfaCode(testUsers.admin.id, '000000')).rejects.toThrow(MFA_INVALID_CODE_MESSAGE);
      await verifyMfaCode(testUsers.admin.id, code);
      await expect(verifyMfaCode(testUsers.admin.id, code)).rejects.toThrow(MFA_INVALID_CODE_MESSAGE);
      await expect(verifyMfaCode(testUsers.gestionnaire.id, code)).rejects.toThrow(MFA_INVALID_CODE_MESSAGE);
      expect(await getUserEvents(testUsers.admin.id)).toStrictEqual([
        { author_id: testUsers.admin.id, data: { locked: false }, type: 'user_mfa_failed' },
        { author_id: testUsers.admin.id, data: {}, type: 'user_mfa_enrolled' },
        { author_id: testUsers.admin.id, data: { locked: false }, type: 'user_mfa_failed' },
      ]);
    });

    it('locks the check after too many wrong codes, even for a valid one, and a valid code resets the counter', async () => {
      await seedTableUser([testUsers.admin]);
      const secret = await enrollAdmin(testUsers.admin.id);

      for (let attempt = 1; attempt < businessRules.adminMfaFailedAttemptsLimit.value; attempt++) {
        await expect(verifyMfaCode(testUsers.admin.id, '000000')).rejects.toThrow(MFA_INVALID_CODE_MESSAGE);
      }
      expect(await getTotpColumns(testUsers.admin.id)).toMatchObject({
        totp_failed_attempts: businessRules.adminMfaFailedAttemptsLimit.value - 1,
        totp_locked_until: null,
      });

      await expect(verifyMfaCode(testUsers.admin.id, '000000')).rejects.toThrow(MFA_INVALID_CODE_MESSAGE);
      expect(await getTotpColumns(testUsers.admin.id)).toMatchObject({ totp_failed_attempts: 0, totp_locked_until: expect.any(Date) });
      await expect(verifyMfaCode(testUsers.admin.id, await generate({ secret }))).rejects.toThrow(MFA_LOCKED_MESSAGE);
      expect(
        (await getUserEvents(testUsers.admin.id)).filter((event) => event.type === 'user_mfa_failed').map((event) => event.data)
      ).toStrictEqual([
        ...Array.from({ length: businessRules.adminMfaFailedAttemptsLimit.value - 1 }, () => ({ locked: false })),
        { locked: true },
      ]);

      // lock expired: a valid code goes through and clears everything
      await kdb
        .updateTable('users')
        .set({ totp_locked_until: new Date(Date.now() - 1000) })
        .where('id', '=', testUsers.admin.id)
        .execute();
      await verifyMfaCode(testUsers.admin.id, await generate({ epoch: Date.now() / 1000 + 30, secret }));
      expect(await getTotpColumns(testUsers.admin.id)).toMatchObject({ totp_failed_attempts: 0, totp_locked_until: null });
    });

    it('rejects a deactivated account', async () => {
      await seedTableUser([testUsers.admin]);
      const enrollment = await getMfaEnrollment(testUsers.admin.id);
      await kdb.updateTable('users').set({ active: false }).where('id', '=', testUsers.admin.id).execute();

      await expect(verifyMfaCode(testUsers.admin.id, await generate({ secret: enrollment!.secret }))).rejects.toThrow(
        MFA_INVALID_CODE_MESSAGE
      );
    });
  });

  describe('auth.resetUserMfa', () => {
    const permissionCases: TestCaseBoolean[] = [
      { expectedOutput: false, input: null },
      { expectedOutput: false, input: testUsers.particulier },
      { expectedOutput: false, input: testUsers.gestionnaire },
      { expectedOutput: true, input: testUsers.admin },
    ];

    permissionCases.forEach(({ input: caller, expectedOutput }) => {
      it(`${expectedOutput ? 'allows' : 'forbids'} ${caller?.role ?? 'anonymous'}`, async () => {
        await seedTableUser([testUsers.admin, testUsers.gestionnaire, testUsers.particulier]);
        const callRoute = () => createTestCaller(caller).auth.resetUserMfa({ userId: testUsers.gestionnaire.id });

        if (expectedOutput) {
          await expect(callRoute()).resolves.toBeUndefined();
        } else {
          await expect(callRoute()).rejects.toMatchObject(forbiddenError);
        }
      });
    });

    it('drops the second factor, traces the action with the target email and notifies the target', async () => {
      await seedTableUser([testUsers.admin, { ...testUsers.gestionnaire, role: 'admin' }]);
      await enrollAdmin(testUsers.gestionnaire.id);
      vi.mocked(sendEmailTemplate).mockClear();

      await createTestCaller(testUsers.admin).auth.resetUserMfa({ userId: testUsers.gestionnaire.id });

      expect(await getTotpColumns(testUsers.gestionnaire.id)).toStrictEqual({
        totp_enrolled_at: null,
        totp_failed_attempts: 0,
        totp_last_used_step: null,
        totp_locked_until: null,
        totp_secret: null,
      });
      expect(await getUserEvents(testUsers.gestionnaire.id)).toStrictEqual([
        { author_id: testUsers.gestionnaire.id, data: {}, type: 'user_mfa_enrolled' },
        { author_id: testUsers.admin.id, data: { user_email: testUsers.gestionnaire.email }, type: 'user_mfa_reset' },
      ]);
      expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual([
        ['auth.utilisateur.double-authentification-reinitialisee', { email: testUsers.gestionnaire.email, id: testUsers.gestionnaire.id }],
      ]);
    });

    it('answers NOT_FOUND for an unknown user', async () => {
      await seedTableUser([testUsers.admin]);

      await expect(
        createTestCaller(testUsers.admin).auth.resetUserMfa({ userId: '00000000-0000-4000-8000-000000000999' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });
});
