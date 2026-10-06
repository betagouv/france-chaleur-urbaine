import type { Insertable } from 'kysely';
import type { User } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
  type DemandeChaleurRenouvelable,
} from '@/modules/chaleur-renouvelable/constants';
import { getBatEnrBatimentsSelectionContextByBanId } from '@/modules/chaleur-renouvelable/server/service';
import { fcrLegacyValueKeys } from '@/modules/demands/constants';
import { sendEmailTemplate } from '@/modules/email';
import { kdb, sql } from '@/server/db/kysely';
import type { DB } from '@/server/db/kysely/database';
import { cleanDatabase, seedCcrtExperimentationTerritory, seedTableUser } from '@/tests/fixtures';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { fetchJSON } from '@/utils/network';

const demandCollection = vi.hoisted(() => ({ isEnabled: true }));

vi.mock('@/modules/chaleur-renouvelable/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/chaleur-renouvelable/constants')>()),
  get IS_CCRT_DEMAND_ENABLED() {
    return demandCollection.isEnabled;
  },
}));

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

async function seedDepartmentPermission(userId: string, departmentCode: string) {
  await kdb
    .insertInto('user_permissions')
    .values({
      resource_id: departmentCode,
      type: 'departement',
      user_id: userId,
    })
    .execute();
}

async function seedRnicLookupBuilding() {
  await sql`
    INSERT INTO bdnb_batenr (adresse, batiment_construction_id, batiment_groupe_id, geom)
    VALUES (
      '10 rue du test 13001 Marseille',
      'CONSTRUCTION-123',
      'GROUPE-RNIC-123',
      ST_Multi(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(5.3698, 43.2965), 4326), 2154), 5))
    )
    ON CONFLICT DO NOTHING
  `.execute(kdb);
}

async function seedOriginDemand(status = DEMANDE_STATUS.UNREALISABLE) {
  return await kdb
    .insertInto('demands')
    .values({
      legacy_values: JSON.stringify({
        Adresse: '10 rue du test 13001 Marseille',
        'Date de la demande': '2026-09-01T12:00:00.000Z',
        Logement: 18,
        Mail: 'contact@example.com',
        Status: status,
      }),
      validated: true,
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();
}

function buildCcrtExperimentationDemandInput(overrides: Partial<DemandeChaleurRenouvelable> = {}) {
  return {
    address: '10 rue du test 13001 Marseille',
    alternativeHeatingSolutions: ['PAC géothermique', 'Chaudière à bois', 'PAC air-eau collective'],
    annualHeatingConsumption: 820.5,
    averageArea: 72,
    averageResidents: 2,
    batimentConstructionId: 'CONSTRUCTION-123',
    comments: 'Besoin de préciser le calendrier du projet.',
    demandConcern: 'Une copropriété',
    dpe: 'C',
    email: 'contact@example.com',
    firstName: 'Claire',
    geoAddress: {
      city: 'Marseille',
      cityCode: '13055',
      context: '13, Bouches-du-Rhône, Provence-Alpes-Côte d’Azur',
      coordinates: [5.3698, 43.2965],
      postcode: '13001',
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
    originDemandId: null,
    outdoorSpace: 'jardinCours',
    phone: '0605040302',
    projectStatus: ['Début de réflexion', 'Audit énergétique déjà réalisé'],
    radiatorType: 'radiateur-eau',
    refusalPeriod: null,
    refusalReason: null,
    simulationUrl: '/chaleur-renouvelable/resultat?adresse=10+rue+du+test&typeLogement=immeuble_chauffage_collectif',
    surfaceArea: null,
    ...overrides,
  } satisfies DemandeChaleurRenouvelable;
}

describe('batEnrRouter', () => {
  beforeEach(async () => {
    demandCollection.isEnabled = true;
    await cleanDatabase();
    await seedCcrtExperimentationTerritory();
    vi.clearAllMocks();
    mockedFetchJSON.mockReset();
  });

  describe('batEnr.createDemandeChaleurRenouvelable', () => {
    it.each([
      ['previous refusal', { isPublicAdvisorSelected: true }],
      ['ineligible heat network', { heatNetworkEligibility: { distance: 450, inPDP: false, isEligible: false } }],
    ] as const)('skips CCRT collection without side effects for %s when suspended', async (_, overrides) => {
      demandCollection.isEnabled = false;

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(buildCcrtExperimentationDemandInput(overrides));

      expect(result).toStrictEqual({ demandSubmissionResult: null, id: null });

      expect(await kdb.selectFrom('demands').select(['id']).execute()).toStrictEqual([]);
      expect(await kdb.selectFrom('demands_chaleur_renouvelable').select(['id']).execute()).toStrictEqual([]);
      expect(sentEmailTemplate).not.toHaveBeenCalled();
      expect(mockedFetchJSON).not.toHaveBeenCalled();
    });

    it('crée une demande classique hors expérimentation quand le réseau de chaleur est éligible', async () => {
      demandCollection.isEnabled = false;
      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(
        buildCcrtExperimentationDemandInput({
          address: '10 rue du test 75001 Paris',
          geoAddress: {
            city: 'Paris',
            cityCode: '75056',
            context: '75, Paris, Île-de-France',
            coordinates: [2.3522, 48.8566],
            postcode: '75001',
          },
        })
      );

      const createdDemandesChaleurRenouvelable = await kdb.selectFrom('demands_chaleur_renouvelable').select(['id']).execute();
      const createdDemand = await kdb.selectFrom('demands').select(['id', 'legacy_values']).executeTakeFirstOrThrow();

      expect({
        createdDemandesChaleurRenouvelable,
        result,
        sentEmailKeys: sentEmailTemplate.mock.calls.map(([emailKey]) => emailKey),
      }).toStrictEqual({
        createdDemandesChaleurRenouvelable: [],
        result: {
          demandSubmissionResult: {
            address: '10 rue du test 75001 Paris',
            createdAt: result.demandSubmissionResult?.createdAt,
            distance: result.demandSubmissionResult?.distance,
            email: 'contact@example.com',
            id: createdDemand.id,
            isEligible: true,
            isExisting: false,
            networkName: result.demandSubmissionResult?.networkName,
            status: DEMANDE_STATUS.TO_PROCESS,
          },
          id: null,
        },
        sentEmailKeys: ['demands.demandeur.confirmation-demande'],
      });
      expect(createdDemand.legacy_values[fcrLegacyValueKeys.alternativeHeatingSolutions]).toStrictEqual([
        'PAC géothermique',
        'Chaudière à bois',
        'PAC air-eau collective',
      ]);
      expect(createdDemand.legacy_values[fcrLegacyValueKeys.simulationUrl]).toBe(
        '/chaleur-renouvelable/resultat?adresse=10+rue+du+test&typeLogement=immeuble_chauffage_collectif'
      );
      expect(mockedFetchJSON).toHaveBeenCalledTimes(0);
    });

    it('oriente vers France Rénov hors expérimentation quand le réseau de chaleur n’est pas éligible', async () => {
      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(
        buildCcrtExperimentationDemandInput({
          address: '10 rue du test 75001 Paris',
          geoAddress: {
            city: 'Paris',
            cityCode: '75056',
            context: '75, Paris, Île-de-France',
            coordinates: [2.3522, 48.8566],
            postcode: '75001',
          },
          heatNetworkEligibility: {
            distance: 450,
            inPDP: false,
            isEligible: false,
          },
        })
      );

      const createdDemandesChaleurRenouvelable = await kdb.selectFrom('demands_chaleur_renouvelable').select(['id']).execute();
      const createdDemands = await kdb.selectFrom('demands').select(['id']).execute();

      expect({
        createdDemandesChaleurRenouvelable,
        createdDemands,
        result,
        sentEmailCallCount: sentEmailTemplate.mock.calls.length,
      }).toStrictEqual({
        createdDemandesChaleurRenouvelable: [],
        createdDemands: [],
        result: {
          demandSubmissionResult: null,
          id: null,
        },
        sentEmailCallCount: 0,
      });
    });

    it('crée une demande classique en expérimentation pour un immeuble collectif éligible au réseau de chaleur', async () => {
      demandCollection.isEnabled = false;
      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(buildCcrtExperimentationDemandInput());

      const createdDemandesChaleurRenouvelable = await kdb.selectFrom('demands_chaleur_renouvelable').select(['id']).execute();
      const createdDemand = await kdb.selectFrom('demands').select(['id']).executeTakeFirstOrThrow();

      expect({
        createdDemandesChaleurRenouvelable,
        result,
        sentEmailKeys: sentEmailTemplate.mock.calls.map(([emailKey]) => emailKey),
      }).toStrictEqual({
        createdDemandesChaleurRenouvelable: [],
        result: {
          demandSubmissionResult: {
            address: '10 rue du test 13001 Marseille',
            createdAt: result.demandSubmissionResult?.createdAt,
            distance: result.demandSubmissionResult?.distance,
            email: 'contact@example.com',
            id: createdDemand.id,
            isEligible: true,
            isExisting: false,
            networkName: result.demandSubmissionResult?.networkName,
            status: DEMANDE_STATUS.TO_PROCESS,
          },
          id: null,
        },
        sentEmailKeys: ['demands.demandeur.confirmation-demande'],
      });
    });

    it('oriente vers France Rénov hors expérimentation quand le réseau de chaleur est éligible mais déjà refusé', async () => {
      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(
        buildCcrtExperimentationDemandInput({
          geoAddress: {
            city: 'Paris',
            cityCode: '75056',
            context: '75, Paris, Île-de-France',
            coordinates: [2.3522, 48.8566],
            postcode: '75001',
          },
          isPublicAdvisorSelected: true,
          refusalPeriod: 'Il y a moins de 3 mois',
          refusalReason: 'Coût du raccordement trop élevé',
        })
      );

      const createdDemandesChaleurRenouvelable = await kdb.selectFrom('demands_chaleur_renouvelable').select(['id']).execute();
      const createdDemands = await kdb.selectFrom('demands').select(['id']).execute();

      expect({
        createdDemandesChaleurRenouvelable,
        createdDemands,
        result,
        sentEmailCallCount: sentEmailTemplate.mock.calls.length,
      }).toStrictEqual({
        createdDemandesChaleurRenouvelable: [],
        createdDemands: [],
        result: {
          demandSubmissionResult: null,
          id: null,
        },
        sentEmailCallCount: 0,
      });
    });

    it('crée une demande chaleur renouvelable en expérimentation quand le réseau de chaleur est éligible mais déjà refusé', async () => {
      const ccrtMatchingId = testUsers.ccrt.id!;
      await seedTableUser([{ email: testUsers.ccrt.email, id: ccrtMatchingId, role: 'ccrt' }]);
      await seedDepartmentPermission(ccrtMatchingId, '13');

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(
        buildCcrtExperimentationDemandInput({
          isPublicAdvisorSelected: true,
          refusalPeriod: 'Il y a moins de 3 mois',
          refusalReason: 'Coût du raccordement trop élevé',
        })
      );

      const createdDemandeChaleurRenouvelable = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['id', 'is_public_advisor_selected', 'refusal_period', 'refusal_reason'])
        .where('id', '=', result.id ?? '')
        .executeTakeFirstOrThrow();
      const createdDemands = await kdb.selectFrom('demands').select(['id']).execute();

      expect({
        createdDemandeChaleurRenouvelable,
        createdDemands,
        result,
        sentEmailKeys: sentEmailTemplate.mock.calls.map(([emailKey]) => emailKey),
      }).toStrictEqual({
        createdDemandeChaleurRenouvelable: {
          id: result.id,
          is_public_advisor_selected: true,
          refusal_period: 'Il y a moins de 3 mois',
          refusal_reason: 'Coût du raccordement trop élevé',
        },
        createdDemands: [],
        result: {
          demandSubmissionResult: null,
          id: result.id,
        },
        sentEmailKeys: ['demands.demandeur.confirmation-demande-chaleur-renouvelable'],
      });
    });

    it('crée une demande chaleur renouvelable liée depuis le lien email même quand le réseau est éligible', async () => {
      const originDemand = await seedOriginDemand();

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(
        buildCcrtExperimentationDemandInput({
          originDemandId: originDemand.id,
        })
      );

      const createdDemandeChaleurRenouvelable = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['id', 'is_public_advisor_selected', 'origin_demand_id'])
        .where('id', '=', result.id ?? '')
        .executeTakeFirstOrThrow();
      const createdDemands = await kdb.selectFrom('demands').select(['id']).where('id', '<>', originDemand.id).execute();

      expect({
        createdDemandeChaleurRenouvelable,
        createdDemands,
        result,
      }).toStrictEqual({
        createdDemandeChaleurRenouvelable: {
          id: result.id,
          is_public_advisor_selected: false,
          origin_demand_id: originDemand.id,
        },
        createdDemands: [],
        result: {
          demandSubmissionResult: null,
          id: result.id,
        },
      });
    });

    it('crée une demande chaleur renouvelable en expérimentation pour un immeuble collectif non éligible au réseau de chaleur', async () => {
      const ccrtMatchingId = testUsers.ccrt.id!;
      const ccrtOtherDepartmentId = '00000000-0000-0000-0000-000000000207';
      await seedTableUser([
        { email: testUsers.ccrt.email, id: ccrtMatchingId, role: 'ccrt' },
        { email: 'ccrt-other@test.local', id: ccrtOtherDepartmentId, role: 'ccrt' },
      ]);
      await Promise.all([seedDepartmentPermission(ccrtMatchingId, '13'), seedDepartmentPermission(ccrtOtherDepartmentId, '75')]);

      await seedRnicLookupBuilding();
      mockedFetchJSON.mockResolvedValue({
        data: [
          {
            latitude: 43.2965,
            longitude: 5.3698,
            nom_usage_copropriete: 'COPRO TEST',
            numero_immatriculation: 'AA1234567',
            siret_representant_legal: '12345678900012',
          },
        ],
      });

      const input = buildCcrtExperimentationDemandInput({
        heatNetworkEligibility: {
          distance: 450,
          inPDP: false,
          isEligible: false,
        },
      });

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(input);

      const createdDemandeChaleurRenouvelable = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select([
          'address',
          'alternative_heating_solutions',
          'annual_heating_consumption',
          'departement_code',
          'email',
          'first_name',
          'heating_energy',
          'housing_count',
          'housing_type',
          'is_public_advisor_selected',
          'last_name',
          'rnic_nom_copropriete',
          'rnic_numero_immatriculation',
          'rnic_siret_representant_legal',
          'simulation_url',
          'status',
          'validated',
        ])
        .where('id', '=', result.id ?? '')
        .executeTakeFirstOrThrow();
      const createdDemands = await kdb.selectFrom('demands').select(['id']).execute();

      expect({
        createdDemandeChaleurRenouvelable,
        createdDemands,
        result,
      }).toStrictEqual({
        createdDemandeChaleurRenouvelable: {
          address: '10 rue du test 13001 Marseille',
          alternative_heating_solutions: ['PAC géothermique', 'Chaudière à bois', 'PAC air-eau collective'],
          annual_heating_consumption: 820.5,
          departement_code: '13',
          email: 'contact@example.com',
          first_name: 'Claire',
          heating_energy: 'Gaz',
          housing_count: 18,
          housing_type: 'immeuble_chauffage_collectif',
          is_public_advisor_selected: false,
          last_name: 'Test',
          rnic_nom_copropriete: 'COPRO TEST',
          rnic_numero_immatriculation: 'AA1234567',
          rnic_siret_representant_legal: '12345678900012',
          simulation_url: '/chaleur-renouvelable/resultat?adresse=10+rue+du+test&typeLogement=immeuble_chauffage_collectif',
          status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
          validated: false,
        },
        createdDemands: [],
        result: {
          demandSubmissionResult: null,
          id: result.id,
        },
      });
      expect(sentEmailTemplate).toHaveBeenCalledTimes(1);
      expect(sentEmailTemplate).toHaveBeenCalledWith(
        'demands.demandeur.confirmation-demande-chaleur-renouvelable',
        { email: 'contact@example.com' },
        { demand: input }
      );
    });

    it('enregistre la demande chaleur renouvelable même si le RNIC est indisponible', async () => {
      await seedRnicLookupBuilding();
      mockedFetchJSON.mockRejectedValue(new Error('RNIC unavailable'));

      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(
        buildCcrtExperimentationDemandInput({
          heatNetworkEligibility: {
            distance: 450,
            inPDP: false,
            isEligible: false,
          },
        })
      );

      const createdDemandeChaleurRenouvelable = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select([
          'address',
          'email',
          'housing_count',
          'rnic_nom_copropriete',
          'rnic_numero_immatriculation',
          'rnic_siret_representant_legal',
          'simulation_url',
        ])
        .where('id', '=', result.id ?? '')
        .executeTakeFirstOrThrow();
      const createdDemands = await kdb.selectFrom('demands').select(['id']).execute();

      expect({
        createdDemandeChaleurRenouvelable,
        createdDemands,
        result,
      }).toStrictEqual({
        createdDemandeChaleurRenouvelable: {
          address: '10 rue du test 13001 Marseille',
          email: 'contact@example.com',
          housing_count: 18,
          rnic_nom_copropriete: null,
          rnic_numero_immatriculation: null,
          rnic_siret_representant_legal: null,
          simulation_url: '/chaleur-renouvelable/resultat?adresse=10+rue+du+test&typeLogement=immeuble_chauffage_collectif',
        },
        createdDemands: [],
        result: {
          demandSubmissionResult: null,
          id: result.id,
        },
      });
      expect(mockedFetchJSON).toHaveBeenCalledTimes(1);
      expect(sentEmailTemplate).toHaveBeenCalledTimes(1);
      expect(sentEmailTemplate).toHaveBeenCalledWith(
        'demands.demandeur.confirmation-demande-chaleur-renouvelable',
        { email: 'contact@example.com' },
        { demand: expect.objectContaining({ email: 'contact@example.com' }) }
      );
    });

    it('oriente vers France Rénov en expérimentation si le bâtiment n’est pas un immeuble au chauffage collectif', async () => {
      const result = await createTestCaller(null).batEnr.createDemandeChaleurRenouvelable(
        buildCcrtExperimentationDemandInput({
          heatNetworkEligibility: {
            distance: 450,
            inPDP: false,
            isEligible: false,
          },
          housingType: 'maison_individuelle',
        })
      );

      const createdDemandesChaleurRenouvelable = await kdb.selectFrom('demands_chaleur_renouvelable').select(['id']).execute();
      const createdDemands = await kdb.selectFrom('demands').select(['id']).execute();

      expect({
        createdDemandesChaleurRenouvelable,
        createdDemands,
        result,
        sentEmailCallCount: sentEmailTemplate.mock.calls.length,
      }).toStrictEqual({
        createdDemandesChaleurRenouvelable: [],
        createdDemands: [],
        result: {
          demandSubmissionResult: null,
          id: null,
        },
        sentEmailCallCount: 0,
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
        annual_heating_consumption: null,
        average_area: 70,
        average_residents: 2,
        batiment_construction_id: null,
        comments: null,
        created_at: olderDate,
        demand_concern: null,
        departement_code: '13',
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
        annual_heating_consumption: 950.25,
        average_area: 80,
        average_residents: 3,
        batiment_construction_id: 'BATIMENT-RECENT',
        comments: 'Demande à traiter rapidement',
        created_at: newerDate,
        demand_concern: 'Un bâtiment tertiaire',
        departement_code: '75',
        dpe: 'D',
        email: 'newer@example.com',
        first_name: 'Récent',
        heating_energy: 'Électricité',
        hot_water_system_type: 'Indépendant',
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
            alternative_heating_solutions: [],
            assigned_to: null,
            created_at: newerDate.toISOString(),
            id: newerDemand.id,
            project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
            rnic_nom_copropriete: null,
            rnic_numero_immatriculation: null,
            rnic_siret_representant_legal: null,
            status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
            updated_at: newerDate.toISOString(),
            validated: false,
          },
          {
            ...olderDemandInput,
            alternative_heating_solutions: [],
            assigned_to: null,
            created_at: olderDate.toISOString(),
            id: olderDemand.id,
            project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
            rnic_nom_copropriete: null,
            rnic_numero_immatriculation: null,
            rnic_siret_representant_legal: null,
            status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
            updated_at: olderDate.toISOString(),
            validated: false,
          },
        ],
      });
    });
  });

  describe('batEnr.ccrt.listDemandesChaleurRenouvelable', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
      { allowed: true, label: 'autorise CCRT', user: testUsers.ccrt },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      if (user?.id) {
        await seedTableUser([{ email: user.email, id: user.id, role: user.role }]);
        await seedDepartmentPermission(user.id, '13');
      }

      const caller = createTestCaller(user);
      const callRoute = () => caller.batEnr.ccrt.listDemandesChaleurRenouvelable();

      if (allowed) {
        await expect(callRoute()).resolves.toStrictEqual({
          count: 0,
          items: [],
          trackingContext: {
            departements: user?.id ? ['13'] : [],
            structure_ccrt: null,
          },
        });
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });

    it('liste uniquement les demandes des départements autorisés au CCRT', async () => {
      const ccrtId = testUsers.ccrt.id!;
      const matchingDate = new Date('2026-01-03T10:00:00.000Z');
      const otherDate = new Date('2026-01-04T10:00:00.000Z');
      await seedTableUser([{ email: testUsers.ccrt.email, id: ccrtId, role: 'ccrt' }]);
      await seedDepartmentPermission(ccrtId, '13');
      const matchingDemandInput = {
        address: '1 rue autorisée',
        annual_heating_consumption: 640.75,
        average_area: 70,
        average_residents: 2,
        created_at: matchingDate,
        departement_code: '13',
        dpe: 'E',
        email: 'matching@example.com',
        first_name: 'Autorisée',
        heating_energy: 'Gaz',
        housing_count: 12,
        housing_type: 'immeuble_chauffage_collectif',
        is_public_advisor_selected: false,
        last_name: 'Contact',
        occupant_status: 'Copropriétaire',
        outdoor_space: 'jardinCours',
        phone: '',
        project_status: ['Début de réflexion'],
        simulation_url: 'https://example.com/matching',
        updated_at: matchingDate,
        validated: true,
      } satisfies DemandChaleurRenouvelableInsert;
      const otherDemandInput = {
        ...matchingDemandInput,
        address: '2 rue non autorisée',
        created_at: otherDate,
        departement_code: '75',
        email: 'other@example.com',
        first_name: 'Non autorisée',
        simulation_url: 'https://example.com/other',
        updated_at: otherDate,
      } satisfies DemandChaleurRenouvelableInsert;
      const [matchingDemand] = await Promise.all([
        kdb.insertInto('demands_chaleur_renouvelable').values(matchingDemandInput).returning(['id']).executeTakeFirstOrThrow(),
        kdb.insertInto('demands_chaleur_renouvelable').values(otherDemandInput).returning(['id']).executeTakeFirstOrThrow(),
      ]);

      const result = await createTestCaller(testUsers.ccrt).batEnr.ccrt.listDemandesChaleurRenouvelable();

      expect(result).toStrictEqual({
        count: 1,
        items: [
          {
            ...matchingDemandInput,
            alternative_heating_solutions: [],
            assigned_to: null,
            batiment_construction_id: null,
            comments: null,
            created_at: matchingDate.toISOString(),
            demand_concern: null,
            hot_water_system_type: null,
            id: matchingDemand.id,
            organization_name: null,
            project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
            radiator_type: null,
            refusal_period: null,
            refusal_reason: null,
            rnic_nom_copropriete: null,
            rnic_numero_immatriculation: null,
            rnic_siret_representant_legal: null,
            status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
            surface_area: null,
            updated_at: matchingDate.toISOString(),
            validated: true,
          },
        ],
        trackingContext: {
          departements: ['13'],
          structure_ccrt: null,
        },
      });
    });

    it('renvoie une liste vide pour un CCRT sans permission départementale', async () => {
      await seedTableUser([{ email: testUsers.ccrt.email, id: testUsers.ccrt.id, role: 'ccrt' }]);
      await kdb
        .insertInto('demands_chaleur_renouvelable')
        .values({
          address: '1 rue du test',
          average_area: 70,
          average_residents: 2,
          departement_code: '13',
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
        .execute();

      await expect(createTestCaller(testUsers.ccrt).batEnr.ccrt.listDemandesChaleurRenouvelable()).resolves.toStrictEqual({
        count: 0,
        items: [],
        trackingContext: {
          departements: [],
          structure_ccrt: null,
        },
      });
    });

    it('masque les demandes non validées dans l’espace CCRT', async () => {
      await seedTableUser([{ email: testUsers.ccrt.email, id: testUsers.ccrt.id, role: 'ccrt' }]);
      await seedDepartmentPermission(testUsers.ccrt.id!, '13');
      await kdb
        .insertInto('demands_chaleur_renouvelable')
        .values({
          address: '1 rue du test',
          average_area: 70,
          average_residents: 2,
          departement_code: '13',
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
          validated: false,
        })
        .execute();

      await expect(createTestCaller(testUsers.ccrt).batEnr.ccrt.listDemandesChaleurRenouvelable()).resolves.toStrictEqual({
        count: 0,
        items: [],
        trackingContext: {
          departements: ['13'],
          structure_ccrt: null,
        },
      });
    });
  });

  describe('batEnr.ccrt.updateDemandeChaleurRenouvelable', () => {
    it('permet à un CCRT de mettre à jour une demande validée sur son département', async () => {
      await seedTableUser([{ email: testUsers.ccrt.email, id: testUsers.ccrt.id, role: 'ccrt' }]);
      await seedDepartmentPermission(testUsers.ccrt.id!, '13');
      const demand = await kdb
        .insertInto('demands_chaleur_renouvelable')
        .values({
          address: '1 rue du test',
          average_area: 70,
          average_residents: 2,
          departement_code: '13',
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
          validated: true,
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      const result = await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({
        demandId: demand.id,
        trigger: 'contact',
        values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT },
      });

      expect(result).toMatchObject({
        id: demand.id,
        project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
        status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
      });
    });

    it('refuse la mise à jour CCRT hors permission départementale', async () => {
      await seedTableUser([{ email: testUsers.ccrt.email, id: testUsers.ccrt.id, role: 'ccrt' }]);
      await seedDepartmentPermission(testUsers.ccrt.id!, '75');
      const demand = await kdb
        .insertInto('demands_chaleur_renouvelable')
        .values({
          address: '1 rue du test',
          average_area: 70,
          average_residents: 2,
          departement_code: '13',
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
          validated: true,
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      await expect(
        createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({
          demandId: demand.id,
          values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT },
        })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('batEnr.admin.validateDemandeChaleurRenouvelable', () => {
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
          departement_code: '13',
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
      const callRoute = () => caller.batEnr.admin.validateDemandeChaleurRenouvelable({ demandId: demand.id });

      if (allowed) {
        const result = await callRoute();

        expect({ id: result.id, validated: result.validated }).toStrictEqual({ id: demand.id, validated: true });
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });

    it('valide la demande et notifie le CCRT du département correspondant', async () => {
      const ccrtMatchingId = testUsers.ccrt.id!;
      const ccrtOtherDepartmentId = '00000000-0000-0000-0000-000000000208';
      await seedTableUser([
        { email: testUsers.ccrt.email, id: ccrtMatchingId, role: 'ccrt' },
        { email: 'ccrt-other@test.local', id: ccrtOtherDepartmentId, role: 'ccrt' },
      ]);
      await Promise.all([seedDepartmentPermission(ccrtMatchingId, '13'), seedDepartmentPermission(ccrtOtherDepartmentId, '75')]);
      const demand = await kdb
        .insertInto('demands_chaleur_renouvelable')
        .values({
          address: '1 rue du test',
          annual_heating_consumption: 820.5,
          average_area: 70,
          average_residents: 2,
          batiment_construction_id: 'CONSTRUCTION-123',
          comments: 'Besoin de préciser le calendrier du projet.',
          demand_concern: 'Une copropriété',
          departement_code: '13',
          dpe: 'E',
          email: 'test@example.com',
          first_name: 'Test',
          heating_energy: 'Gaz',
          hot_water_system_type: 'Collectif',
          housing_count: 12,
          housing_type: 'immeuble_chauffage_collectif',
          is_public_advisor_selected: true,
          last_name: 'Contact',
          occupant_status: 'Copropriétaire',
          organization_name: 'Copro test',
          outdoor_space: 'jardinCours',
          phone: '0605040302',
          project_status: ['Début de réflexion'],
          radiator_type: 'radiateur-eau',
          refusal_period: 'Il y a moins de 3 mois',
          refusal_reason: 'Coût du raccordement trop élevé',
          simulation_url: 'https://example.com/test',
          surface_area: 840,
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      await createTestCaller(testUsers.admin).batEnr.admin.validateDemandeChaleurRenouvelable({ demandId: demand.id });

      const updatedDemand = await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select(['validated'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow();
      const ccrtList = await createTestCaller(testUsers.ccrt).batEnr.ccrt.listDemandesChaleurRenouvelable();

      expect({ ccrtListCount: ccrtList.count, updatedDemand }).toStrictEqual({
        ccrtListCount: 1,
        updatedDemand: { validated: true },
      });
      expect(sentEmailTemplate).toHaveBeenCalledTimes(1);
      expect(sentEmailTemplate).toHaveBeenCalledWith(
        'demands.ccrt.nouvelle-demande-chaleur-renouvelable',
        { email: testUsers.ccrt.email, id: ccrtMatchingId },
        expect.objectContaining({
          demand: expect.objectContaining({ email: 'test@example.com' }),
          demandId: demand.id,
          status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
        })
      );
    });

    it('ne notifie pas deux fois une demande déjà validée', async () => {
      const ccrtMatchingId = testUsers.ccrt.id!;
      await seedTableUser([{ email: testUsers.ccrt.email, id: ccrtMatchingId, role: 'ccrt' }]);
      await seedDepartmentPermission(ccrtMatchingId, '13');
      const demand = await kdb
        .insertInto('demands_chaleur_renouvelable')
        .values({
          address: '1 rue du test',
          average_area: 70,
          average_residents: 2,
          departement_code: '13',
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
          validated: true,
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      const result = await createTestCaller(testUsers.admin).batEnr.admin.validateDemandeChaleurRenouvelable({ demandId: demand.id });

      expect({ id: result.id, sentEmailCallCount: sentEmailTemplate.mock.calls.length, validated: result.validated }).toStrictEqual({
        id: demand.id,
        sentEmailCallCount: 0,
        validated: true,
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
