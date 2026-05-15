import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { kdb } from '@/server/db/kysely';
import type { EligibilityType } from '@/server/services/addresseInformation';
import {
  cleanDatabase,
  createLineGeometry,
  createPolygonGeometry,
  seedProEligibilityTestsAddress,
  seedReseauDeChaleur,
  seedZoneEtReseauEnConstruction,
} from '@/tests/fixtures';

import { autoAssignNetworkFromEligibility, computeNetworkDistance } from './eligibility';

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
});
