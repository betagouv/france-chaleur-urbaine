import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { kdb, sql } from '@/server/db/kysely';
import type { EligibilityType } from '@/server/services/addresseInformation';
import {
  cleanDatabase,
  createLineGeometry,
  createPolygonGeometry,
  seedCommune,
  seedDepartement,
  seedProEligibilityTestsAddress,
  seedRegion,
  seedReseauDeChaleur,
  seedZoneEtReseauEnConstruction,
} from '@/tests/fixtures';
import type { TestCase } from '@/tests/trpc-helpers';

import {
  autoAssignNetworkFromEligibility,
  computeNetworkDistance,
  countNetworkDemands,
  reassignDemandsOfDeletedNetworks,
  resolveDemandAssignment,
} from './eligibility';

const PARIS = { lat: 48.8566, lon: 2.3522 };

describe('computeNetworkDistance()', () => {
  let demandId: string;

  beforeEach(async () => {
    await cleanDatabase();

    const [demand] = await kdb
      .insertInto('demands')
      .values({ legacy_values: JSON.stringify({}) })
      .returningAll()
      .execute();
    demandId = demand.id;

    await seedProEligibilityTestsAddress({ demand_id: demandId, source_address: '10 Rue de Rivoli 75001 Paris' });
  });

  it('returns the rounded distance for an existing network with trace', async () => {
    await seedReseauDeChaleur({
      geom: createLineGeometry(PARIS.lon, PARIS.lat, 200),
      has_trace: true,
      id_fcu: 100,
      ouvert_aux_raccordements: true,
    });

    const result = await computeNetworkDistance(demandId, 100, 'reseau_de_chaleur');

    expect(result).toStrictEqual(132);
  });

  it('returns null for an existing network without trace', async () => {
    await seedReseauDeChaleur({
      geom: createLineGeometry(PARIS.lon, PARIS.lat, 200),
      has_trace: false,
      id_fcu: 101,
      ouvert_aux_raccordements: true,
    });

    const result = await computeNetworkDistance(demandId, 101, 'reseau_de_chaleur');

    expect(result).toBeNull();
  });

  it('returns the rounded distance for a future network (line)', async () => {
    await seedZoneEtReseauEnConstruction({
      geom: createLineGeometry(PARIS.lon, PARIS.lat, 150),
      id_fcu: 200,
      is_zone: false,
      ouvert_aux_raccordements: true,
    });

    const result = await computeNetworkDistance(demandId, 200, 'reseau_en_construction');

    expect(result).toStrictEqual(99);
  });

  it('returns 0 when the point is inside a future zone (polygon)', async () => {
    await seedZoneEtReseauEnConstruction({
      geom: createPolygonGeometry(PARIS.lon, PARIS.lat, 500),
      id_fcu: 201,
      is_zone: true,
      ouvert_aux_raccordements: true,
    });

    const result = await computeNetworkDistance(demandId, 201, 'reseau_en_construction');

    expect(result).toStrictEqual(0);
  });

  it('throws NOT_FOUND when the network does not exist', async () => {
    await expect(computeNetworkDistance(demandId, 999, 'reseau_de_chaleur')).rejects.toThrow(
      new TRPCError({ code: 'NOT_FOUND', message: 'Réseau ou demande introuvable' })
    );
  });
});

describe('autoAssignNetworkFromEligibility()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const makeDemand = async (type: EligibilityType, distance: number | null, idFcu: number | null, eligible: boolean) => {
    const [demand] = await kdb
      .insertInto('demands')
      .values({ legacy_values: JSON.stringify({}) })
      .returningAll()
      .execute();
    const history: ProEligibilityTestHistoryEntry[] = [
      {
        calculated_at: new Date().toISOString(),
        eligibility: { distance, eligible, id_fcu: idFcu, id_sncu: 'X', nom: 'N', type },
        transition: 'initial',
      },
    ];
    await seedProEligibilityTestsAddress({ demand_id: demand.id, eligibility_history: JSON.stringify(history), source_address: 'x' });
    return demand.id;
  };

  const getNetwork = (id: string) =>
    kdb.selectFrom('demands').select(['network_id', 'network_type']).where('id', '=', id).executeTakeFirstOrThrow();

  const cases: {
    label: string;
    type: EligibilityType;
    distance: number | null;
    eligible: boolean;
    idFcu: number;
    expected: { network_id: number | null; network_type: string | null };
  }[] = [
    {
      distance: 50,
      eligible: true,
      expected: { network_id: 16, network_type: 'reseau_de_chaleur' },
      idFcu: 16,
      label: 'réseau très proche → affecté',
      type: 'reseau_existant_tres_proche',
    },
    {
      distance: 400,
      eligible: false,
      expected: { network_id: 10, network_type: 'reseau_de_chaleur' },
      idFcu: 10,
      label: 'réseau loin < 500m → affecté',
      type: 'reseau_existant_loin',
    },
    {
      distance: 500,
      eligible: false,
      expected: { network_id: null, network_type: null },
      idFcu: 11,
      label: 'réseau loin = 500m → non affecté',
      type: 'reseau_existant_loin',
    },
    {
      distance: 700,
      eligible: false,
      expected: { network_id: null, network_type: null },
      idFcu: 12,
      label: 'réseau futur loin > 500m → non affecté',
      type: 'reseau_futur_loin',
    },
    {
      distance: null,
      eligible: true,
      expected: { network_id: 13, network_type: 'reseau_en_construction' },
      idFcu: 13,
      label: 'dans la zone (distance nulle) → affecté',
      type: 'dans_zone_reseau_futur',
    },
    {
      distance: 800,
      eligible: true,
      expected: { network_id: 14, network_type: 'reseau_de_chaleur' },
      idFcu: 14,
      label: 'PDP à 800m → affecté (pas de limite)',
      type: 'dans_pdp_reseau_existant',
    },
    {
      distance: null,
      eligible: false,
      expected: { network_id: null, network_type: null },
      idFcu: 15,
      label: 'réseau sans tracé → non affecté',
      type: 'dans_ville_reseau_existant_sans_trace',
    },
  ];

  it.each(cases)('$label', async ({ type, distance, idFcu, eligible, expected }) => {
    const id = await makeDemand(type, distance, idFcu, eligible);
    await autoAssignNetworkFromEligibility(id);
    expect(await getNetwork(id)).toStrictEqual(expected);
  });

  it('extension liée à un réseau de chaleur → demande portée par le réseau parent, extension conservée', async () => {
    await seedReseauDeChaleur({ id_fcu: 30, ouvert_aux_raccordements: true });
    await seedZoneEtReseauEnConstruction({ id_fcu: 31, ouvert_aux_raccordements: true, reseau_de_chaleur_id: 30 });
    const id = await makeDemand('reseau_futur_tres_proche', 40, 31, true);

    await autoAssignNetworkFromEligibility(id);

    expect(
      await kdb.selectFrom('demands').select(['network_id', 'network_type', 'extension_id']).where('id', '=', id).executeTakeFirstOrThrow()
    ).toStrictEqual({ extension_id: 31, network_id: 30, network_type: 'reseau_de_chaleur' });
  });
});

describe('resolveDemandAssignment()', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedReseauDeChaleur({ id_fcu: 30, ouvert_aux_raccordements: true });
    await Promise.all([
      seedZoneEtReseauEnConstruction({ id_fcu: 31, ouvert_aux_raccordements: true, reseau_de_chaleur_id: 30 }),
      seedZoneEtReseauEnConstruction({ id_fcu: 32, ouvert_aux_raccordements: true }),
    ]);
  });

  const cases: TestCase<Parameters<typeof resolveDemandAssignment>, Awaited<ReturnType<typeof resolveDemandAssignment>>>[] = [
    {
      expectedOutput: { extension_id: null, network_id: 30, network_type: 'reseau_de_chaleur' },
      input: [30, 'reseau_de_chaleur'],
      label: 'réseau existant → lui-même',
    },
    {
      expectedOutput: { extension_id: null, network_id: 32, network_type: 'reseau_en_construction' },
      input: [32, 'reseau_en_construction'],
      label: 'réseau en construction sans lien → lui-même',
    },
    {
      expectedOutput: { extension_id: 31, network_id: 30, network_type: 'reseau_de_chaleur' },
      input: [31, 'reseau_en_construction'],
      label: 'extension liée → réseau parent, extension à part',
    },
    {
      expectedOutput: { extension_id: null, network_id: 99, network_type: 'reseau_en_construction' },
      input: [99, 'reseau_en_construction'],
      label: 'réseau en construction introuvable → lui-même',
    },
  ];
  it.each(cases)('$label', async ({ input, expectedOutput }) => {
    expect(await resolveDemandAssignment(...input)).toStrictEqual(expectedOutput);
  });
});

describe('reassignDemandsOfDeletedNetworks()', () => {
  const FAR_AWAY = { lat: 45.0, lon: 3.0 };

  const seedDemandOn = async (
    networkId: number,
    networkType: 'reseau_de_chaleur' | 'reseau_en_construction',
    coords: { lat: number; lon: number },
    deletedAt: Date | null = null
  ) => {
    const demand = await kdb
      .insertInto('demands')
      .values({
        deleted_at: deletedAt,
        legacy_values: JSON.stringify({ 'Distance au réseau': 12, 'Identifiant réseau': 'OLD', 'Nom réseau': 'Réseau supprimé' }),
        network_id: networkId,
        network_type: networkType,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    await seedProEligibilityTestsAddress({
      demand_id: demand.id,
      geom: sql`st_transform(st_point(${coords.lon}, ${coords.lat}, 4326), 2154)`,
      source_address: 'x',
    });
    return demand.id;
  };

  const getDemand = (id: string) =>
    kdb
      .selectFrom('demands')
      .select(['network_id', 'network_type', 'extension_id', 'legacy_values'])
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

  beforeEach(async () => {
    await cleanDatabase();
    // the eligibility looks for the nearest commune, then its department and region
    await Promise.all([
      seedCommune({
        geom: createPolygonGeometry(PARIS.lon, PARIS.lat, 5000),
        insee_com: '75056',
        insee_dep: '75',
        insee_reg: '11',
        nom: 'Paris',
      }),
      seedDepartement({ insee_dep: '75', insee_reg: '11', nom: 'Paris' }),
      seedRegion({ insee_reg: '11', nom: 'Île-de-France' }),
    ]);
    await seedReseauDeChaleur({
      geom: createLineGeometry(PARIS.lon, PARIS.lat, 150),
      has_trace: true,
      'Identifiant reseau': '7501C',
      id_fcu: 100,
      nom_reseau: 'Réseau voisin',
      ouvert_aux_raccordements: true,
    });
  });

  it('réaffecte au réseau le plus proche, désaffecte sans réseau proche, laisse les autres demandes', async () => {
    const [nearDemand, farDemand, keptDemand, deletedDemand] = await Promise.all([
      seedDemandOn(999, 'reseau_de_chaleur', PARIS),
      seedDemandOn(998, 'reseau_en_construction', FAR_AWAY),
      seedDemandOn(100, 'reseau_de_chaleur', PARIS),
      seedDemandOn(999, 'reseau_de_chaleur', PARIS, new Date()),
    ]);

    // a dry run counts the demands without touching them
    expect(await reassignDemandsOfDeletedNetworks({ dryRun: true })).toStrictEqual(2);
    expect(await reassignDemandsOfDeletedNetworks()).toStrictEqual(2);

    expect(await Promise.all([nearDemand, farDemand, keptDemand, deletedDemand].map(getDemand))).toStrictEqual([
      {
        extension_id: null,
        legacy_values: { 'Distance au réseau': 99, 'Identifiant réseau': '7501C', 'Nom réseau': 'Réseau voisin' },
        network_id: 100,
        network_type: 'reseau_de_chaleur',
      },
      {
        extension_id: null,
        legacy_values: { 'Distance au réseau': null, 'Identifiant réseau': null, 'Nom réseau': null },
        network_id: null,
        network_type: null,
      },
      {
        extension_id: null,
        legacy_values: { 'Distance au réseau': 12, 'Identifiant réseau': 'OLD', 'Nom réseau': 'Réseau supprimé' },
        network_id: 100,
        network_type: 'reseau_de_chaleur',
      },
      {
        extension_id: null,
        legacy_values: { 'Distance au réseau': 12, 'Identifiant réseau': 'OLD', 'Nom réseau': 'Réseau supprimé' },
        network_id: 999,
        network_type: 'reseau_de_chaleur',
      },
    ]);

    const events = await kdb.selectFrom('events').select(['author_id', 'context_id', 'data', 'type']).orderBy('context_id').execute();
    const oldNetwork = { distance: 12, network_name: 'Réseau supprimé', network_sncu_id: 'OLD' };
    expect(events).toStrictEqual(
      [
        {
          author_id: null,
          context_id: nearDemand,
          data: {
            new: {
              distance: 99,
              network_id: 100,
              network_name: 'Réseau voisin',
              network_sncu_id: '7501C',
              network_type: 'reseau_de_chaleur',
            },
            old: { ...oldNetwork, network_id: 999, network_type: 'reseau_de_chaleur' },
          },
          type: 'demand_assignment_changed',
        },
        {
          author_id: null,
          context_id: farDemand,
          data: {
            new: { distance: null, network_id: null, network_name: null, network_sncu_id: null, network_type: null },
            old: { ...oldNetwork, network_id: 998, network_type: 'reseau_en_construction' },
          },
          type: 'demand_assignment_changed',
        },
      ].sort((first, second) => first.context_id.localeCompare(second.context_id))
    );

    // the address history records the new eligibility, once
    expect(await reassignDemandsOfDeletedNetworks()).toStrictEqual(0);
    const history = await kdb
      .selectFrom('pro_eligibility_tests_addresses')
      .select('eligibility_history')
      .where('demand_id', '=', nearDemand)
      .executeTakeFirstOrThrow();
    expect((history.eligibility_history as ProEligibilityTestHistoryEntry[]).map((entry) => entry.eligibility.id_fcu)).toStrictEqual([
      7501, 100,
    ]);
  });
});

describe('countNetworkDemands()', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedReseauDeChaleur({ id_fcu: 30, ouvert_aux_raccordements: true });
    await seedZoneEtReseauEnConstruction({ id_fcu: 30, ouvert_aux_raccordements: true, reseau_de_chaleur_id: 30 });
    await kdb
      .insertInto('demands')
      .values([
        { legacy_values: JSON.stringify({}), network_id: 30, network_type: 'reseau_de_chaleur' },
        { extension_id: 30, legacy_values: JSON.stringify({}), network_id: 30, network_type: 'reseau_de_chaleur' },
        { deleted_at: new Date(), legacy_values: JSON.stringify({}), network_id: 30, network_type: 'reseau_de_chaleur' },
        { legacy_values: JSON.stringify({}), network_id: 31, network_type: 'reseau_en_construction' },
      ])
      .execute();
  });

  const cases: TestCase<Parameters<typeof countNetworkDemands>, Awaited<ReturnType<typeof countNetworkDemands>>>[] = [
    {
      expectedOutput: { assigned: 2, keptOnParent: 0 },
      input: [30, 'reseau_de_chaleur'],
      label: 'réseau existant → ses demandes non supprimées',
    },
    {
      expectedOutput: { assigned: 0, keptOnParent: 1 },
      input: [30, 'reseau_en_construction'],
      label: 'extension liée → les demandes portées par son réseau parent',
    },
    { expectedOutput: { assigned: 1, keptOnParent: 0 }, input: [31, 'reseau_en_construction'], label: 'réseau en construction sans lien' },
  ];
  it.each(cases)('$label', async ({ input, expectedOutput }) => {
    expect(await countNetworkDemands(...input)).toStrictEqual(expectedOutput);
  });
});
