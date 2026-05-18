import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import {
  cleanDatabase,
  createLineGeometry,
  createPolygonGeometry,
  seedProEligibilityTestsAddress,
  seedReseauDeChaleur,
  seedZoneEtReseauEnConstruction,
} from '@/tests/fixtures';

import { computeNetworkDistance } from './eligibility';

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
      tags: [],
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
      tags: [],
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
      tags: [],
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
      tags: [],
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
