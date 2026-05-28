import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase } from '@/tests/fixtures';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('batEnrRouter', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('batEnr.admin.listDemandesChaleurRenouvelable', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.batEnr.admin.listDemandesChaleurRenouvelable();

      if (allowed) {
        await expect(callRoute()).resolves.toStrictEqual({ count: 0, items: [] });
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });

    it('liste les demandes chaleur renouvelable par date décroissante', async () => {
      const olderDate = new Date('2026-01-02T10:00:00.000Z');
      const newerDate = new Date('2026-01-03T10:00:00.000Z');
      const [olderDemand, newerDemand] = await Promise.all([
        kdb
          .insertInto('demands_chaleur_renouvelable')
          .values({
            address: '1 rue ancienne',
            average_area: 70,
            average_residents: 2,
            created_at: olderDate,
            dpe: 'E',
            email: 'older@example.com',
            first_name: 'Ancien',
            heating_energy: 'Gaz',
            housing_count: 12,
            housing_type: 'immeuble_chauffage_collectif',
            last_name: 'Contact',
            occupant_status: 'Copropriétaire',
            outdoor_space: 'shared',
            phone: '',
            project_status: ['Début de réflexion'],
            simulation_url: 'https://example.com/older',
            updated_at: olderDate,
          })
          .returning(['id'])
          .executeTakeFirstOrThrow(),
        kdb
          .insertInto('demands_chaleur_renouvelable')
          .values({
            address: '2 rue récente',
            average_area: 80,
            average_residents: 3,
            created_at: newerDate,
            dpe: 'D',
            email: 'newer@example.com',
            first_name: 'Récent',
            heating_energy: 'Électricité',
            housing_count: 24,
            housing_type: 'maison_individuelle',
            last_name: 'Contact',
            occupant_status: 'Propriétaire occupant',
            outdoor_space: 'private',
            phone: '0605040302',
            project_status: ['Audit énergétique déjà réalisé'],
            simulation_url: 'https://example.com/newer',
            updated_at: newerDate,
          })
          .returning(['id'])
          .executeTakeFirstOrThrow(),
      ]);

      const result = await createTestCaller(testUsers.admin).batEnr.admin.listDemandesChaleurRenouvelable();

      expect(result).toStrictEqual({
        count: 2,
        items: [
          {
            address: '2 rue récente',
            assigned_to: null,
            average_area: 80,
            average_residents: 3,
            created_at: newerDate.toISOString(),
            dpe: 'D',
            email: 'newer@example.com',
            first_name: 'Récent',
            heating_energy: 'Électricité',
            housing_count: 24,
            housing_type: 'maison_individuelle',
            id: newerDemand.id,
            last_name: 'Contact',
            occupant_status: 'Propriétaire occupant',
            outdoor_space: 'private',
            phone: '0605040302',
            project_status: ['Audit énergétique déjà réalisé'],
            simulation_url: 'https://example.com/newer',
            status: 'En attente de prise en charge',
            updated_at: newerDate.toISOString(),
          },
          {
            address: '1 rue ancienne',
            assigned_to: null,
            average_area: 70,
            average_residents: 2,
            created_at: olderDate.toISOString(),
            dpe: 'E',
            email: 'older@example.com',
            first_name: 'Ancien',
            heating_energy: 'Gaz',
            housing_count: 12,
            housing_type: 'immeuble_chauffage_collectif',
            id: olderDemand.id,
            last_name: 'Contact',
            occupant_status: 'Copropriétaire',
            outdoor_space: 'shared',
            phone: '',
            project_status: ['Début de réflexion'],
            simulation_url: 'https://example.com/older',
            status: 'En attente de prise en charge',
            updated_at: olderDate.toISOString(),
          },
        ],
      });
    });
  });

  describe('batEnr.admin.updateDemandeChaleurRenouvelable', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const demand = await kdb
        .insertInto('demands_chaleur_renouvelable')
        .values({
          address: '1 rue du test',
          average_area: 70,
          average_residents: 2,
          dpe: 'E',
          email: 'test@example.com',
          first_name: 'Test',
          heating_energy: 'Gaz',
          housing_count: 12,
          housing_type: 'immeuble_chauffage_collectif',
          last_name: 'Contact',
          occupant_status: 'Copropriétaire',
          outdoor_space: 'shared',
          phone: '',
          project_status: ['Début de réflexion'],
          simulation_url: 'https://example.com/test',
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      const caller = createTestCaller(user);
      const callRoute = () =>
        caller.batEnr.admin.updateDemandeChaleurRenouvelable({
          demandId: demand.id,
          values: { assignedTo: 'Gestionnaire test', status: 'Étude en cours' },
        });

      if (allowed) {
        await expect(callRoute()).resolves.toMatchObject({
          assigned_to: 'Gestionnaire test',
          id: demand.id,
          status: 'Étude en cours',
        });
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });

    it('met à jour le statut et l’affectation', async () => {
      const demand = await kdb
        .insertInto('demands_chaleur_renouvelable')
        .values({
          address: '1 rue du test',
          average_area: 70,
          average_residents: 2,
          dpe: 'E',
          email: 'test@example.com',
          first_name: 'Test',
          heating_energy: 'Gaz',
          housing_count: 12,
          housing_type: 'immeuble_chauffage_collectif',
          last_name: 'Contact',
          occupant_status: 'Copropriétaire',
          outdoor_space: 'shared',
          phone: '',
          project_status: ['Début de réflexion'],
          simulation_url: 'https://example.com/test',
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      await createTestCaller(testUsers.admin).batEnr.admin.updateDemandeChaleurRenouvelable({
        demandId: demand.id,
        values: { assignedTo: 'Gestionnaire test', status: 'Étude en cours' },
      });

      const updatedDemand = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['assigned_to', 'status'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow();

      expect(updatedDemand).toStrictEqual({
        assigned_to: 'Gestionnaire test',
        status: 'Étude en cours',
      });
    });
  });
});
