import { describe, expect, it } from 'vitest';

import { createTestCaller, TRPCError, testUsers } from '@/tests/trpc-helpers';

describe('jobsRouter', () => {
  describe('jobs.list', () => {
    describe('Permissions', () => {
      it('refuse les utilisateurs non authentifiés', async () => {
        const caller = createTestCaller(null);

        await expect(caller.jobs.list({})).rejects.toThrow(TRPCError);
        await expect(caller.jobs.list({})).rejects.toMatchObject({
          code: 'FORBIDDEN',
        });
      });

      it('refuse les utilisateurs particuliers', async () => {
        const caller = createTestCaller(testUsers.particulier);

        await expect(caller.jobs.list({})).rejects.toThrow(TRPCError);
        await expect(caller.jobs.list({})).rejects.toMatchObject({
          code: 'FORBIDDEN',
          message: 'Permissions invalides',
        });
      });

      it('refuse les utilisateurs professionnels', async () => {
        const caller = createTestCaller(testUsers.professionnel);

        await expect(caller.jobs.list({})).rejects.toThrow(TRPCError);
        await expect(caller.jobs.list({})).rejects.toMatchObject({
          code: 'FORBIDDEN',
        });
      });

      it('refuse les gestionnaires', async () => {
        const caller = createTestCaller(testUsers.gestionnaire);

        await expect(caller.jobs.list({})).rejects.toThrow(TRPCError);
        await expect(caller.jobs.list({})).rejects.toMatchObject({
          code: 'FORBIDDEN',
        });
      });

      it('autorise les administrateurs', async () => {
        const caller = createTestCaller(testUsers.admin);

        // Ne doit pas throw - l'appel passe la vérification des permissions
        // La query peut échouer pour d'autres raisons (db) mais pas pour les permissions
        await expect(caller.jobs.list({})).resolves.toBeDefined();
      });
    });
  });
});
