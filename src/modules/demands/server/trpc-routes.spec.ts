import { describe, expect, it } from 'vitest';

import { createTestCaller, testUsers } from '@/tests/trpc-helpers';

describe('demandsRouter', () => {
  describe('demands.admin', () => {
    describe('list', () => {
      it('refuse les utilisateurs non authentifiés', async () => {
        const caller = createTestCaller(null);
        await expect(caller.demands.admin.list()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      });

      it('refuse les particuliers', async () => {
        const caller = createTestCaller(testUsers.particulier);
        await expect(caller.demands.admin.list()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      });

      it('refuse les gestionnaires', async () => {
        const caller = createTestCaller(testUsers.gestionnaire);
        await expect(caller.demands.admin.list()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      });

      it('autorise les administrateurs', async () => {
        const caller = createTestCaller(testUsers.admin);
        await expect(caller.demands.admin.list()).resolves.toBeDefined();
      });
    });

    describe('getTagsStats', () => {
      it('refuse les non-admins', async () => {
        const caller = createTestCaller(testUsers.gestionnaire);
        await expect(caller.demands.admin.getTagsStats()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      });

      it('autorise les administrateurs', async () => {
        const caller = createTestCaller(testUsers.admin);
        await expect(caller.demands.admin.getTagsStats()).resolves.toBeDefined();
      });
    });
  });

  describe('demands.gestionnaire', () => {
    describe('list', () => {
      it('refuse les utilisateurs non authentifiés', async () => {
        const caller = createTestCaller(null);
        await expect(caller.demands.gestionnaire.list()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      });

      it('refuse les particuliers', async () => {
        const caller = createTestCaller(testUsers.particulier);
        await expect(caller.demands.gestionnaire.list()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      });

      it('refuse les professionnels', async () => {
        const caller = createTestCaller(testUsers.professionnel);
        await expect(caller.demands.gestionnaire.list()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      });

      it('autorise les gestionnaires', async () => {
        const caller = createTestCaller(testUsers.gestionnaire);
        await expect(caller.demands.gestionnaire.list()).resolves.toBeDefined();
      });
    });

    describe('listEmails', () => {
      it('refuse les particuliers', async () => {
        const caller = createTestCaller(testUsers.particulier);
        await expect(caller.demands.gestionnaire.listEmails({ demand_id: 'test-id' })).rejects.toMatchObject({
          code: 'FORBIDDEN',
        });
      });

      it('autorise les gestionnaires', async () => {
        const caller = createTestCaller(testUsers.gestionnaire);
        // Will fail on business logic (demand not found) but passes permission check
        await expect(caller.demands.gestionnaire.listEmails({ demand_id: 'test-id' })).rejects.not.toMatchObject({
          code: 'FORBIDDEN',
        });
      });

      it('autorise les administrateurs', async () => {
        const caller = createTestCaller(testUsers.admin);
        await expect(caller.demands.gestionnaire.listEmails({ demand_id: 'test-id' })).rejects.not.toMatchObject({
          code: 'FORBIDDEN',
        });
      });
    });
  });

  describe('demands.user', () => {
    describe('list', () => {
      it('refuse les utilisateurs non authentifiés', async () => {
        const caller = createTestCaller(null);
        await expect(caller.demands.user.list()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      });

      it('autorise les particuliers', async () => {
        const caller = createTestCaller(testUsers.particulier);
        await expect(caller.demands.user.list()).resolves.toBeDefined();
      });

      it('autorise les professionnels', async () => {
        const caller = createTestCaller(testUsers.professionnel);
        await expect(caller.demands.user.list()).resolves.toBeDefined();
      });

      it('autorise les gestionnaires', async () => {
        const caller = createTestCaller(testUsers.gestionnaire);
        await expect(caller.demands.user.list()).resolves.toBeDefined();
      });

      it('autorise les administrateurs', async () => {
        const caller = createTestCaller(testUsers.admin);
        await expect(caller.demands.user.list()).resolves.toBeDefined();
      });
    });

    describe('createBatch', () => {
      it('refuse les utilisateurs non authentifiés', async () => {
        const caller = createTestCaller(null);
        await expect(caller.demands.user.createBatch({ addresses: [], termOfUse: true })).rejects.toMatchObject({
          code: 'FORBIDDEN',
        });
      });

      it('autorise les particuliers', async () => {
        const caller = createTestCaller(testUsers.particulier);
        // Validation error (not permission error) proves permissions passed
        await expect(caller.demands.user.createBatch({ addresses: [], termOfUse: true })).rejects.toMatchObject({
          code: 'BAD_REQUEST',
        });
      });
    });

    describe('create (public)', () => {
      it('autorise les utilisateurs non authentifiés', async () => {
        const caller = createTestCaller(null);
        // Will fail on validation but not on permissions
        await expect(caller.demands.user.create({} as any)).rejects.not.toMatchObject({ code: 'FORBIDDEN' });
      });
    });
  });
});
