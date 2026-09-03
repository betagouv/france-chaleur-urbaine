import type { Insertable } from 'kysely';
import type { User } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
  type DemandeChaleurRenouvelable,
} from '@/modules/chaleur-renouvelable/constants';
import { getBatEnrBatimentsSelectionContextByBanId } from '@/modules/chaleur-renouvelable/server/service';
import { sendEmailTemplate } from '@/modules/email';
import { kdb, sql } from '@/server/db/kysely';
import type { DB } from '@/server/db/kysely/database';
import { cleanDatabase } from '@/tests/fixtures';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { fetchJSON } from '@/utils/network';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/modules/pro-eligibility-tests/server/service', async () => {
  const { seedProEligibilityTestsAddress } = await import('@/tests/fixtures');

  return {
    createEligibilityTestAddress: vi.fn(
      async ({ address, demand_id }: { address: string; demand_id: string; latitude: number; longitude: number }) => {
        await seedProEligibilityTestsAddress({
          demand_id,
          source_address: address,
        });
      }
    ),
  };
});

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
const ADMIN_UPDATED_PROJECT_STATE = 'Installation ENR votée en AG';
const ADMIN_UPDATED_STATUS = 'Etude d’opportunité réalisée';
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

describe('batEnrRouter', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  describe('batEnr.createDemandeChaleurRenouvelable', () => {
    it('ne crée pas de demande chaleur renouvelable quand le formulaire est orienté vers le conseiller public', async () => {
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
        outdoorSpace: 'jardinCours',
        phone: '0605040302',
        projectStatus: ['Début de réflexion', 'Audit énergétique déjà réalisé'],
        radiatorType: 'radiateur-eau',
        refusalPeriod: 'Il y a moins de 3 mois',
        refusalReason: 'Coût du raccordement trop élevé',
        simulationUrl: 'https://example.com/simulation',
        surfaceArea: null,
      } satisfies DemandeChaleurRenouvelable;

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(input);

      const createdDemandes = await kdb.selectFrom('demands_chaleur_renouvelable').select(['id']).execute();

      expect({
        createdDemandes,
        result,
        sentEmailCallCount: sentEmailTemplate.mock.calls.length,
      }).toStrictEqual({
        createdDemandes: [],
        result: {
          demandSubmissionResult: null,
          id: null,
        },
        sentEmailCallCount: 0,
      });
    });

    it('crée une demande de raccordement quand le bâtiment est raccordable à un réseau de chaleur', async () => {
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
        geoAddress: {
          city: 'Paris',
          context: '75, Paris, Île-de-France',
          coordinates: [2.3522, 48.8566],
          postcode: '75001',
        },
        heatingEnergy: 'Gaz',
        heatNetworkEligibility: {
          distance: 120,
          inPDP: true,
          isEligible: true,
        },
        hotWaterSystemType: 'Collectif',
        housingCount: 18,
        housingType: 'immeuble_chauffage_collectif',
        isPublicAdvisorSelected: false,
        lastName: 'Test',
        occupantStatus: 'Syndicat de copropriété',
        organizationName: 'Syndicat test',
        outdoorSpace: 'jardinCours',
        phone: '0605040302',
        projectStatus: ['Début de réflexion', 'Audit énergétique déjà réalisé'],
        radiatorType: 'radiateur-eau',
        refusalPeriod: null,
        refusalReason: null,
        simulationUrl: 'https://example.com/simulation',
        surfaceArea: null,
      } satisfies DemandeChaleurRenouvelable;

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(input);

      const createdDemand = await kdb
        .selectFrom('demands')
        .select(['id', 'legacy_values'])
        .where('id', '=', result.demandSubmissionResult?.id ?? '')
        .executeTakeFirstOrThrow();

      expect(result).toStrictEqual({
        demandSubmissionResult: {
          address: '10 rue du test',
          createdAt: createdDemand.legacy_values['Date de la demande'],
          distance: 45,
          email: 'contact@example.com',
          id: createdDemand.id,
          isEligible: true,
          isExisting: false,
          networkName: 'CPCU',
          status: DEMANDE_STATUS.TO_PROCESS,
        },
        id: null,
      });
      expect({
        Adresse: createdDemand.legacy_values.Adresse,
        'Code Postal': createdDemand.legacy_values['Code Postal'],
        Departement: createdDemand.legacy_values.Departement,
        'Distance au réseau': createdDemand.legacy_values['Distance au réseau'],
        Latitude: createdDemand.legacy_values.Latitude,
        Longitude: createdDemand.legacy_values.Longitude,
        Mail: createdDemand.legacy_values.Mail,
        'Mode de chauffage': createdDemand.legacy_values['Mode de chauffage'],
        Nom: createdDemand.legacy_values.Nom,
        Prénom: createdDemand.legacy_values.Prénom,
        Region: createdDemand.legacy_values.Region,
        Structure: createdDemand.legacy_values.Structure,
        'Type de chauffage': createdDemand.legacy_values['Type de chauffage'],
        Ville: createdDemand.legacy_values.Ville,
        Éligibilité: createdDemand.legacy_values.Éligibilité,
      }).toStrictEqual({
        Adresse: '10 rue du test',
        'Code Postal': '75001',
        Departement: '75',
        'Distance au réseau': 45,
        Latitude: 48.8566,
        Longitude: 2.3522,
        Mail: 'contact@example.com',
        'Mode de chauffage': 'Gaz',
        Nom: 'Test',
        Prénom: 'Claire',
        Region: 'Île-de-France',
        Structure: 'Copropriété',
        'Type de chauffage': 'Collectif',
        Ville: 'Paris',
        Éligibilité: true,
      });
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
        outdoor_space: 'jardinCours',
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
        outdoor_space: 'terrasseBalcon',
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
            project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
            status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
            updated_at: newerDate.toISOString(),
          },
          {
            ...olderDemandInput,
            assigned_to: null,
            created_at: olderDate.toISOString(),
            id: olderDemand.id,
            project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
            status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
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
          outdoor_space: 'jardinCours',
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
          outdoor_space: 'jardinCours',
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
        .select(['assigned_to', 'project_state', 'status'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow();

      expect(updatedDemand).toStrictEqual({
        assigned_to: 'Gestionnaire test',
        project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
        status: ADMIN_UPDATED_STATUS,
      });
    });

    it("met à jour l'état du projet quand le statut de validation le permet", async () => {
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
          outdoor_space: 'jardinCours',
          phone: '',
          project_status: ['Début de réflexion'],
          simulation_url: 'https://example.com/test',
          status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION,
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      await createTestCaller(testUsers.admin).batEnr.admin.updateDemandeChaleurRenouvelable({
        demandId: demand.id,
        values: { projectState: ADMIN_UPDATED_PROJECT_STATE },
      });

      const updatedDemand = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['project_state', 'status'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow();

      expect(updatedDemand).toStrictEqual({
        project_state: ADMIN_UPDATED_PROJECT_STATE,
        status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION,
      });
    });

    it("réinitialise l'état du projet quand le statut sort de la validation", async () => {
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
          outdoor_space: 'jardinCours',
          phone: '',
          project_state: ADMIN_UPDATED_PROJECT_STATE,
          project_status: ['Début de réflexion'],
          simulation_url: 'https://example.com/test',
          status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION,
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      await createTestCaller(testUsers.admin).batEnr.admin.updateDemandeChaleurRenouvelable({
        demandId: demand.id,
        values: { status: ADMIN_UPDATED_STATUS },
      });

      const updatedDemand = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['project_state', 'status'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow();

      expect(updatedDemand).toStrictEqual({
        project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
        status: ADMIN_UPDATED_STATUS,
      });
    });

    it("refuse de modifier l'état du projet sans statut de validation", async () => {
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
          outdoor_space: 'jardinCours',
          phone: '',
          project_status: ['Début de réflexion'],
          simulation_url: 'https://example.com/test',
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      const callRoute = () =>
        createTestCaller(testUsers.admin).batEnr.admin.updateDemandeChaleurRenouvelable({
          demandId: demand.id,
          values: { projectState: ADMIN_UPDATED_PROJECT_STATE },
        });

      await expect(callRoute).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });
  });
});
