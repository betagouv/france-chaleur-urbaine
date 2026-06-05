import type { Insertable } from 'kysely';
import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';

import type { DemandeChaleurRenouvelable } from '@/modules/chaleur-renouvelable/constants';
import { kdb } from '@/server/db/kysely';
import type { DB } from '@/server/db/kysely/database';
import { cleanDatabase } from '@/tests/fixtures';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

type DemandChaleurRenouvelableInsert = Insertable<DB['demands_chaleur_renouvelable']>;

function toDemandDatabaseFields(input: DemandeChaleurRenouvelable) {
  return {
    address: input.address,
    average_area: input.averageArea,
    average_residents: input.averageResidents,
    batiment_construction_id: input.batimentConstructionId,
    dpe: input.dpe,
    email: input.email,
    first_name: input.firstName,
    heating_energy: input.heatingEnergy,
    hot_water_system_type: input.hotWaterSystemType,
    housing_count: input.housingCount,
    housing_type: input.housingType,
    is_public_advisor_selected: input.isPublicAdvisorSelected,
    last_name: input.lastName,
    occupant_status: input.occupantStatus,
    outdoor_space: input.outdoorSpace,
    phone: input.phone,
    project_status: input.projectStatus,
    radiator_type: input.radiatorType,
    refusal_period: input.refusalPeriod,
    refusal_reason: input.refusalReason,
    simulation_url: input.simulationUrl,
  };
}

describe('batEnrRouter', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('batEnr.createDemandeChaleurRenouvelable', () => {
    it('crée une demande avec les informations du formulaire et de la simulation', async () => {
      const input = {
        address: '10 rue du test',
        averageArea: 72,
        averageResidents: 2,
        batimentConstructionId: 'CONSTRUCTION-123',
        dpe: 'C',
        email: 'contact@example.com',
        firstName: 'Claire',
        heatingEnergy: 'Gaz',
        hotWaterSystemType: 'Collectif',
        housingCount: 18,
        housingType: 'immeuble_chauffage_collectif',
        isPublicAdvisorSelected: true,
        lastName: 'Test',
        occupantStatus: 'Syndic',
        outdoorSpace: 'shared',
        phone: '0605040302',
        projectStatus: ['Début de réflexion', 'Audit énergétique déjà réalisé'],
        radiatorType: 'radiateur-eau',
        refusalPeriod: 'Il y a moins de 3 mois',
        refusalReason: 'Coût du raccordement trop élevé',
        simulationUrl: 'https://example.com/simulation',
      } satisfies DemandeChaleurRenouvelable;

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(input);

      const demand = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select([
          'address',
          'average_area',
          'average_residents',
          'batiment_construction_id',
          'dpe',
          'email',
          'first_name',
          'heating_energy',
          'hot_water_system_type',
          'housing_count',
          'housing_type',
          'is_public_advisor_selected',
          'last_name',
          'occupant_status',
          'outdoor_space',
          'phone',
          'project_status',
          'radiator_type',
          'refusal_period',
          'refusal_reason',
          'simulation_url',
        ])
        .where('id', '=', result.id)
        .executeTakeFirstOrThrow();

      expect(demand).toStrictEqual(toDemandDatabaseFields(input));
    });
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
      const olderDemandInput = {
        address: '1 rue ancienne',
        average_area: 70,
        average_residents: 2,
        batiment_construction_id: null,
        created_at: olderDate,
        dpe: 'E',
        email: 'older@example.com',
        first_name: 'Ancien',
        heating_energy: 'Gaz',
        hot_water_system_type: null,
        housing_count: 12,
        housing_type: 'immeuble_chauffage_collectif',
        is_public_advisor_selected: false,
        last_name: 'Contact',
        occupant_status: 'Copropriétaire',
        outdoor_space: 'shared',
        phone: '',
        project_status: ['Début de réflexion'],
        radiator_type: null,
        refusal_period: null,
        refusal_reason: null,
        simulation_url: 'https://example.com/older',
        updated_at: olderDate,
      } satisfies DemandChaleurRenouvelableInsert;
      const newerDemandInput = {
        address: '2 rue récente',
        average_area: 80,
        average_residents: 3,
        batiment_construction_id: 'BATIMENT-RECENT',
        created_at: newerDate,
        dpe: 'D',
        email: 'newer@example.com',
        first_name: 'Récent',
        heating_energy: 'Électricité',
        hot_water_system_type: 'Collectif',
        housing_count: 24,
        housing_type: 'maison_individuelle',
        is_public_advisor_selected: true,
        last_name: 'Contact',
        occupant_status: 'Propriétaire occupant',
        outdoor_space: 'private',
        phone: '0605040302',
        project_status: ['Audit énergétique déjà réalisé'],
        radiator_type: 'radiateur-eau',
        refusal_period: 'Il y a 3 à 12 mois',
        refusal_reason: 'Bâtiment trop éloigné du réseau',
        simulation_url: 'https://example.com/newer',
        updated_at: newerDate,
      } satisfies DemandChaleurRenouvelableInsert;
      const [olderDemand, newerDemand] = await Promise.all([
        kdb.insertInto('demands_chaleur_renouvelable').values(olderDemandInput).returning(['id']).executeTakeFirstOrThrow(),
        kdb.insertInto('demands_chaleur_renouvelable').values(newerDemandInput).returning(['id']).executeTakeFirstOrThrow(),
      ]);

      const result = await createTestCaller(testUsers.admin).batEnr.admin.listDemandesChaleurRenouvelable();

      expect(result).toStrictEqual({
        count: 2,
        items: [
          {
            ...newerDemandInput,
            assigned_to: null,
            created_at: newerDate.toISOString(),
            id: newerDemand.id,
            status: 'En attente de prise en charge',
            updated_at: newerDate.toISOString(),
          },
          {
            ...olderDemandInput,
            assigned_to: null,
            created_at: olderDate.toISOString(),
            id: olderDemand.id,
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
