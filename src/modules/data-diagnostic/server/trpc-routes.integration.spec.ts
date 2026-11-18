import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { syncLinkedNetworkFields } from '@/modules/reseaux/server/linked-fields-sync';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedReseauDeChaleur, seedTableUser, seedZoneEtReseauEnConstruction } from '@/tests/fixtures';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('dataDiagnosticRouter', () => {
  describe('dataDiagnostic.run', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.dataDiagnostic.run();

      if (allowed) {
        const result = await callRoute();
        expect(result).toMatchObject({
          generatedAt: expect.any(String),
          issues: expect.any(Array),
        });
        for (const issue of result.issues) {
          expect(issue).toMatchObject({
            description: expect.any(String),
            items: expect.any(Array),
            severity: expect.stringMatching(/^(error|warning)$/),
            title: expect.any(String),
            totalCount: expect.any(Number),
            truncated: expect.any(Boolean),
            type: expect.any(String),
          });
        }
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });
  });

  describe('extension.not_consolidated', () => {
    const findIssue = async () =>
      (await createTestCaller(testUsers.admin).dataDiagnostic.run()).issues.find((issue) => issue.type === 'extension.not_consolidated');

    it('signale une extension liée qui porte encore une demande ou une permission, plus après la synchronisation', async () => {
      await cleanDatabase();
      await seedTableUser([testUsers.gestionnaire]);
      await seedReseauDeChaleur({
        'Identifiant reseau': '7501C',
        id_fcu: 100,
        nom_reseau: 'Réseau étendu',
        ouvert_aux_raccordements: true,
      });
      await Promise.all([
        seedZoneEtReseauEnConstruction({ id_fcu: 200, ouvert_aux_raccordements: true, reseau_de_chaleur_id: 100 }),
        // a network under construction without parent keeps its own demands and permissions
        seedZoneEtReseauEnConstruction({ id_fcu: 201, ouvert_aux_raccordements: true }),
      ]);
      await kdb
        .insertInto('demands')
        .values(
          [200, 201].map((networkId) => ({
            legacy_values: JSON.stringify({}),
            network_id: networkId,
            network_type: 'reseau_en_construction',
          }))
        )
        .execute();
      await kdb
        .insertInto('user_permissions')
        .values(
          [200, 201].map((networkId) => ({
            resource_id: String(networkId),
            type: 'reseau_en_construction',
            user_id: testUsers.gestionnaire.id,
          }))
        )
        .execute();

      expect((await findIssue())?.items).toStrictEqual([
        {
          context: '1 demande(s), 1 permission(s)',
          href: '/admin/reseaux?reseauxTab=reseaux-en-construction',
          label: '200 (sans nom)',
        },
      ]);

      await syncLinkedNetworkFields();

      expect(await findIssue()).toBeUndefined();
    });
  });
});
