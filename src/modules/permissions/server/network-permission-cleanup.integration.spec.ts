import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

import { getUsersWithNetworkPermission, removeNetworkPermissionFromAllUsers } from './service';

const adminId = uuid(200);
const user1 = { email: 'a-gestionnaire@test.local', id: uuid(210) };
const user2 = { email: 'b-gestionnaire@test.local', id: uuid(211) };
const user3 = { email: 'c-other@test.local', id: uuid(212) };

const NETWORK_ID = '9001';
const OTHER_NETWORK_ID = '8002';

const seedPermissions = async () => {
  await kdb.deleteFrom('user_permissions').execute();
  await kdb
    .insertInto('user_permissions')
    .values([
      { resource_id: NETWORK_ID, type: 'reseau_de_chaleur', user_id: user1.id },
      { resource_id: NETWORK_ID, type: 'reseau_de_chaleur', user_id: user2.id },
      { resource_id: OTHER_NETWORK_ID, type: 'reseau_de_chaleur', user_id: user2.id },
      { resource_id: NETWORK_ID, type: 'reseau_en_construction', user_id: user3.id },
    ])
    .execute();
};

const permissionsOf = async (userId: string) =>
  kdb.selectFrom('user_permissions').select(['type', 'resource_id']).where('user_id', '=', userId).orderBy('resource_id').execute();

describe('suppression de réseau → nettoyage des permissions', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedTableUser([
      { email: 'admin@test.local', id: adminId, role: 'admin' },
      { email: user1.email, id: user1.id, role: 'gestionnaire' },
      { email: user2.email, id: user2.id, role: 'gestionnaire' },
      { email: user3.email, id: user3.id, role: 'gestionnaire' },
    ]);
  });

  beforeEach(async () => {
    await seedPermissions();
  });

  describe('getUsersWithNetworkPermission', () => {
    it('ne renvoie que les utilisateurs liés au réseau (triés par email)', async () => {
      const result = await getUsersWithNetworkPermission('reseau_de_chaleur', NETWORK_ID);
      expect(result).toStrictEqual([
        { email: user1.email, id: user1.id },
        { email: user2.email, id: user2.id },
      ]);
    });

    it('distingue le type de permission (chaleur vs en construction)', async () => {
      const result = await getUsersWithNetworkPermission('reseau_en_construction', NETWORK_ID);
      expect(result).toStrictEqual([{ email: user3.email, id: user3.id }]);
    });
  });

  describe('removeNetworkPermissionFromAllUsers', () => {
    it('retire uniquement la permission du réseau ciblé, en conservant les autres', async () => {
      await removeNetworkPermissionFromAllUsers('reseau_de_chaleur', NETWORK_ID, adminId);

      expect(await permissionsOf(user1.id)).toStrictEqual([]);
      expect(await permissionsOf(user2.id)).toStrictEqual([{ resource_id: OTHER_NETWORK_ID, type: 'reseau_de_chaleur' }]);
      expect(await permissionsOf(user3.id)).toStrictEqual([{ resource_id: NETWORK_ID, type: 'reseau_en_construction' }]);
      expect(await getUsersWithNetworkPermission('reseau_de_chaleur', NETWORK_ID)).toStrictEqual([]);
    });
  });

  describe('route reseaux.getNetworkLinkedUsers', () => {
    it('renvoie les utilisateurs liés pour un réseau de chaleur', async () => {
      const result = await createTestCaller(testUsers.admin).reseaux.getNetworkLinkedUsers({
        id: Number(NETWORK_ID),
        type: 'reseaux_de_chaleur',
      });
      expect(result).toStrictEqual([
        { email: user1.email, id: user1.id },
        { email: user2.email, id: user2.id },
      ]);
    });

    it('renvoie un tableau vide pour un type sans permissions (froid)', async () => {
      const result = await createTestCaller(testUsers.admin).reseaux.getNetworkLinkedUsers({
        id: Number(NETWORK_ID),
        type: 'reseaux_de_froid',
      });
      expect(result).toStrictEqual([]);
    });

    it('refuse un utilisateur non admin', async () => {
      await expect(
        createTestCaller(testUsers.gestionnaire).reseaux.getNetworkLinkedUsers({ id: Number(NETWORK_ID), type: 'reseaux_de_chaleur' })
      ).rejects.toMatchObject(forbiddenError);
    });
  });
});
