import type { Insertable } from 'kysely';
import type { User } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DemandeChaleurRenouvelable, DemandeChaleurRenouvelableStatus } from '@/modules/chaleur-renouvelable/constants';
import {
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_ALEC,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_CCR,
} from '@/modules/chaleur-renouvelable/constants';
import { getBatEnrBatimentsSelectionContextByBanId } from '@/modules/chaleur-renouvelable/server/service';
import { sendEmailTemplate } from '@/modules/email';
import { kdb, sql } from '@/server/db/kysely';
import type { DB } from '@/server/db/kysely/database';
import { cleanDatabase } from '@/tests/fixtures';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';
import { fetchJSON } from '@/utils/network';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils/network', () => ({
  fetchJSON: vi.fn(),
}));

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

type BatEnrInsertParams = {
  address: string;
  constructionId: string;
  coordinateX: number;
  coordinateY: number;
};

type DemandChaleurRenouvelableInsert = Insertable<DB['demands_chaleur_renouvelable']>;
const ADMIN_UPDATED_STATUS = 'Étude technico-financière réalisée';
const sentEmailTemplate = vi.mocked(sendEmailTemplate);
const mockedFetchJSON = vi.mocked(fetchJSON);

async function insertBatEnrRow({ address, constructionId, coordinateX, coordinateY }: BatEnrInsertParams) {
  await sql`
    INSERT INTO bdnb_batenr (adresse, batiment_construction_id, batiment_groupe_id, geom)
    VALUES (
      ${address},
      ${constructionId},
      ${constructionId},
      ST_Multi(ST_Buffer(ST_SetSRID(ST_MakePoint(${coordinateX}, ${coordinateY}), 2154), 5))
    )
  `.execute(kdb);
}

function toDemandDatabaseFields(input: DemandeChaleurRenouvelable) {
  return {
    address: input.address,
    average_area: input.averageArea,
    average_residents: input.averageResidents,
    batiment_construction_id: input.batimentConstructionId,
    comments: input.comments,
    demand_concern: input.demandConcern,
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
    organization_name: input.organizationName,
    outdoor_space: input.outdoorSpace,
    phone: input.phone,
    project_status: input.projectStatus,
    radiator_type: input.radiatorType,
    refusal_period: input.refusalPeriod,
    refusal_reason: input.refusalReason,
    simulation_url: input.simulationUrl,
    surface_area: input.surfaceArea,
  };
}

describe('batEnrRouter', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  describe('batEnr.createDemandeChaleurRenouvelable', () => {
    it('crée une demande avec les informations du formulaire et de la simulation', async () => {
      const input = {
        address: '10 rue du test',
        averageArea: 72,
        averageResidents: 2,
        batimentConstructionId: 'CONSTRUCTION-123',
        comments: 'Besoin de préciser le calendrier du projet.',
        demandConcern: 'Une copropriété',
        dpe: 'C',
        email: 'contact@example.com',
        firstName: 'Claire',
        heatingEnergy: 'Gaz',
        hotWaterSystemType: 'Collectif',
        housingCount: 18,
        housingType: 'immeuble_chauffage_collectif',
        isPublicAdvisorSelected: true,
        lastName: 'Test',
        occupantStatus: 'Syndicat de copropriété',
        organizationName: 'Syndicat test',
        outdoorSpace: 'shared',
        phone: '0605040302',
        projectStatus: ['Début de réflexion', 'Audit énergétique déjà réalisé'],
        radiatorType: 'radiateur-eau',
        refusalPeriod: 'Il y a moins de 3 mois',
        refusalReason: 'Coût du raccordement trop élevé',
        simulationUrl: 'https://example.com/simulation',
        surfaceArea: null,
      } satisfies DemandeChaleurRenouvelable;

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(input);

      const demand = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select([
          'address',
          'average_area',
          'average_residents',
          'batiment_construction_id',
          'comments',
          'demand_concern',
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
          'organization_name',
          'phone',
          'project_status',
          'radiator_type',
          'refusal_period',
          'refusal_reason',
          'simulation_url',
          'status',
          'surface_area',
        ])
        .where('id', '=', result.id)
        .executeTakeFirstOrThrow();

      expect(demand).toStrictEqual({
        ...toDemandDatabaseFields(input),
        status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_CCR,
      });
      expect(sentEmailTemplate).toHaveBeenCalledTimes(1);
      expect(sentEmailTemplate).toHaveBeenCalledWith(
        'demands.equipe-fcu.nouvelle-demande-chaleur-renouvelable',
        { email: 'france.chaleur.urbaine@gmail.com' },
        {
          demand: input,
          demandId: result.id,
          status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_CCR,
        }
      );
    });

    const statusTestCases = [
      {
        demandConcern: null,
        expectedStatus: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_ALEC,
        housingType: 'maison_individuelle',
        label: 'maison individuelle → ALEC',
      },
      {
        demandConcern: null,
        expectedStatus: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_ALEC,
        housingType: 'immeuble_chauffage_individuel',
        label: 'chauffage individuel → ALEC',
      },
      {
        demandConcern: 'Une maison individuelle',
        expectedStatus: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_ALEC,
        housingType: 'immeuble_chauffage_collectif',
        label: 'demande concernant une maison individuelle → ALEC',
      },
      {
        demandConcern: 'Une copropriété',
        expectedStatus: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_CCR,
        housingType: 'immeuble_chauffage_collectif',
        label: 'chauffage collectif → CCR',
      },
    ] satisfies readonly {
      demandConcern: DemandeChaleurRenouvelable['demandConcern'];
      expectedStatus: DemandeChaleurRenouvelableStatus;
      housingType: DemandeChaleurRenouvelable['housingType'];
      label: string;
    }[];

    it.each(statusTestCases)('détermine automatiquement le statut initial : $label', async ({
      demandConcern,
      expectedStatus,
      housingType,
    }) => {
      const input = {
        address: '10 rue du test',
        averageArea: 72,
        averageResidents: 2,
        batimentConstructionId: null,
        comments: null,
        demandConcern,
        dpe: 'C',
        email: 'contact@example.com',
        firstName: 'Claire',
        heatingEnergy: 'Gaz',
        hotWaterSystemType: 'Collectif',
        housingCount: 18,
        housingType,
        isPublicAdvisorSelected: false,
        lastName: 'Test',
        occupantStatus: 'Copropriétaire',
        organizationName: null,
        outdoorSpace: 'shared',
        phone: '',
        projectStatus: ['Début de réflexion'],
        radiatorType: 'radiateur-eau',
        refusalPeriod: null,
        refusalReason: null,
        simulationUrl: 'https://example.com/simulation',
        surfaceArea: null,
      } satisfies DemandeChaleurRenouvelable;

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(input);

      const demand = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['status'])
        .where('id', '=', result.id)
        .executeTakeFirstOrThrow();

      expect(demand).toStrictEqual({ status: expectedStatus });
    });
  });

  describe('batEnr.getBatEnrBatimentsSelectionContextByBanId', () => {
    it('préselectionne le premier bâtiment BDNB et charge ses voisins à 200 m sans référence RNB', async () => {
      const constructionIds = ['CONSTRUCTION-REFERENCE', 'CONSTRUCTION-NEAR', 'CONSTRUCTION-FAR'];
      await kdb.deleteFrom('bdnb_batenr').where('batiment_construction_id', 'in', constructionIds).execute();
      await Promise.all([
        insertBatEnrRow({ address: '10 rue du test', constructionId: 'CONSTRUCTION-REFERENCE', coordinateX: 1_000, coordinateY: 1_000 }),
        insertBatEnrRow({ address: '12 rue du test', constructionId: 'CONSTRUCTION-NEAR', coordinateX: 1_100, coordinateY: 1_000 }),
        insertBatEnrRow({ address: '14 rue du test', constructionId: 'CONSTRUCTION-FAR', coordinateX: 1_300, coordinateY: 1_000 }),
      ]);
      mockedFetchJSON.mockImplementation(async (url) => {
        if (String(url).includes('/buildings/address/')) {
          return { results: [] };
        }

        return [{ batiment_construction_id: 'CONSTRUCTION-REFERENCE' }];
      });

      const result = await getBatEnrBatimentsSelectionContextByBanId({ banId: 'BAN-ADDRESS-ID' });

      expect({
        batimentConstructionIds: result.batiments.map((batiment) => batiment.batiment_construction_id),
        preselectedBatimentConstructionId: result.preselectedBatimentConstructionId,
      }).toStrictEqual({
        batimentConstructionIds: ['CONSTRUCTION-REFERENCE', 'CONSTRUCTION-NEAR'],
        preselectedBatimentConstructionId: 'CONSTRUCTION-REFERENCE',
      });
    });

    it('charge les voisins depuis la référence RNB sans appeler l’API BDNB externe', async () => {
      const constructionIds = [
        'RNB-REFERENCE',
        'RNB-NEAR',
        'RNB-FAR',
        'CONSTRUCTION-RNB-REFERENCE',
        'CONSTRUCTION-RNB-NEAR',
        'CONSTRUCTION-RNB-FAR',
      ];
      await kdb.deleteFrom('bdnb_batenr').where('batiment_construction_id', 'in', constructionIds).execute();
      await Promise.all([
        insertBatEnrRow({ address: '20 rue du test', constructionId: 'RNB-REFERENCE', coordinateX: 2_000, coordinateY: 2_000 }),
        insertBatEnrRow({ address: '22 rue du test', constructionId: 'RNB-NEAR', coordinateX: 2_100, coordinateY: 2_000 }),
        insertBatEnrRow({ address: '24 rue du test', constructionId: 'RNB-FAR', coordinateX: 2_300, coordinateY: 2_000 }),
      ]);
      mockedFetchJSON.mockImplementation(async (url) => {
        if (String(url).includes('/buildings/address/')) {
          return {
            results: [
              {
                ext_ids: [{ id: 'RNB-REFERENCE', source: 'bdnb' }],
              },
            ],
          };
        }

        throw new Error('BDNB quota exceeded');
      });

      const result = await getBatEnrBatimentsSelectionContextByBanId({ banId: 'BAN-ADDRESS-ID' });

      expect({
        batimentConstructionIds: result.batiments.map((batiment) => batiment.batiment_construction_id),
        externalApiCallCount: mockedFetchJSON.mock.calls.length,
        preselectedBatimentConstructionId: result.preselectedBatimentConstructionId,
      }).toStrictEqual({
        batimentConstructionIds: ['RNB-REFERENCE', 'RNB-NEAR'],
        externalApiCallCount: 1,
        preselectedBatimentConstructionId: 'RNB-REFERENCE',
      });
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
        comments: null,
        created_at: olderDate,
        demand_concern: null,
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
        organization_name: null,
        outdoor_space: 'shared',
        phone: '',
        project_status: ['Début de réflexion'],
        radiator_type: null,
        refusal_period: null,
        refusal_reason: null,
        simulation_url: 'https://example.com/older',
        surface_area: null,
        updated_at: olderDate,
      } satisfies DemandChaleurRenouvelableInsert;
      const newerDemandInput = {
        address: '2 rue récente',
        average_area: 80,
        average_residents: 3,
        batiment_construction_id: 'BATIMENT-RECENT',
        comments: 'Demande à traiter rapidement',
        created_at: newerDate,
        demand_concern: 'Un bâtiment tertiaire',
        dpe: 'D',
        email: 'newer@example.com',
        first_name: 'Récent',
        heating_energy: 'Électricité',
        hot_water_system_type: 'Collectif',
        housing_count: 24,
        housing_type: 'maison_individuelle',
        is_public_advisor_selected: true,
        last_name: 'Contact',
        occupant_status: 'Propriétaire de maison individuelle',
        organization_name: 'Entreprise récente',
        outdoor_space: 'private',
        phone: '0605040302',
        project_status: ['Audit énergétique déjà réalisé'],
        radiator_type: 'radiateur-eau',
        refusal_period: 'Il y a 3 à 12 mois',
        refusal_reason: 'Bâtiment trop éloigné du réseau',
        simulation_url: 'https://example.com/newer',
        surface_area: 240,
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
          values: { assignedTo: 'Gestionnaire test', status: ADMIN_UPDATED_STATUS },
        });

      if (allowed) {
        await expect(callRoute()).resolves.toMatchObject({
          assigned_to: 'Gestionnaire test',
          id: demand.id,
          status: ADMIN_UPDATED_STATUS,
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
        values: { assignedTo: 'Gestionnaire test', status: ADMIN_UPDATED_STATUS },
      });

      const updatedDemand = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['assigned_to', 'status'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow();

      expect(updatedDemand).toStrictEqual({
        assigned_to: 'Gestionnaire test',
        status: ADMIN_UPDATED_STATUS,
      });
    });
  });
});
