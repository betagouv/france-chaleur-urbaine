import type { User } from 'next-auth';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { createTestCaller, testUsers, unauthorizedError } from '@/tests/trpc-helpers';

import { defaultUserPreferences } from '../constants';
import { getUserPreferences, updateUserPreferences } from './service';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('usersRouter', () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  describe('users.getProfile', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: true, label: 'autorise particulier', user: testUsers.particulier },
      { allowed: true, label: 'autorise professionnel', user: testUsers.professionnel },
      { allowed: true, label: 'autorise gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.users.getProfile();

      if (allowed) {
        // Permission passe mais l'utilisateur n'existe pas en DB -> NOT_FOUND
        await expect(callRoute).rejects.toMatchObject({ code: 'NOT_FOUND' });
      } else {
        await expect(callRoute).rejects.toMatchObject(unauthorizedError);
      }
    });
  });

  describe('users.updateProfile', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: true, label: 'autorise particulier', user: testUsers.particulier },
      { allowed: true, label: 'autorise professionnel', user: testUsers.professionnel },
      { allowed: true, label: 'autorise gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () =>
        caller.users.updateProfile({
          first_name: 'Test',
          last_name: 'User',
          phone: null,
          structure_name: '',
          structure_other: '',
        });

      if (allowed) {
        // Permission passe mais l'utilisateur n'existe pas en DB -> INTERNAL_SERVER_ERROR
        await expect(callRoute).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
      } else {
        await expect(callRoute).rejects.toMatchObject(unauthorizedError);
      }
    });
  });

  describe('user preferences', () => {
    beforeEach(async () => {
      await cleanDatabase();
      await seedTableUser([testUsers.ccrt]);
    });

    it('reads and updates CCRT preferences through the authenticated routes', async () => {
      await expect(createTestCaller(null).users.getPreferences()).rejects.toMatchObject(unauthorizedError);
      await expect(createTestCaller(null).users.updatePreferences({ email_signature: 'Signature' })).rejects.toMatchObject(
        unauthorizedError
      );
      await expect(createTestCaller(testUsers.ccrt).users.getPreferences()).resolves.toStrictEqual(defaultUserPreferences);
      await expect(createTestCaller(testUsers.ccrt).users.updatePreferences({ email_signature: 'Signature' })).resolves.toStrictEqual({
        ...defaultUserPreferences,
        email_signature: 'Signature',
      });
    });

    it('preserves both changes when the signature and notifications are updated concurrently', async () => {
      await Promise.all([
        updateUserPreferences(testUsers.ccrt.id, { email_signature: 'Conseiller CCRT' }),
        updateUserPreferences(testUsers.ccrt.id, { notifications: { pending_demands_reminder: false } }),
      ]);
      await expect(getUserPreferences(testUsers.ccrt.id)).resolves.toStrictEqual({
        email_signature: 'Conseiller CCRT',
        notifications: { new_demands: 'daily', pending_demands_reminder: false },
      });
    });

    it('rolls back preferences and their audit event with the caller transaction', async () => {
      const failure = new Error('Caller transaction failed');
      await expect(
        kdb.transaction().execute(async (transaction) => {
          await updateUserPreferences(testUsers.ccrt.id, { email_signature: 'Signature' }, transaction);
          throw failure;
        })
      ).rejects.toThrow(failure);
      await expect(getUserPreferences(testUsers.ccrt.id)).resolves.toStrictEqual(defaultUserPreferences);
      const events = await kdb.selectFrom('events').select('id').where('type', '=', 'user_preferences_updated').execute();
      expect(events).toStrictEqual([]);
    });
  });
});
