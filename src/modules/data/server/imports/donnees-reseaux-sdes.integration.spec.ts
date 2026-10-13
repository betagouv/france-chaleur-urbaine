import { beforeEach, describe, expect, it, vi } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedReseauDeChaleur, seedReseauDeFroid } from '@/tests/fixtures';

import { type DonneesReseauBrutes, importSdesRows } from './donnees-reseaux-sdes';

const logger = { info: vi.fn(), warn: vi.fn() } as any;

const record = (overrides: Partial<DonneesReseauBrutes>): DonneesReseauBrutes =>
  ({
    FILIERE: 'C',
    ID: '9101C',
    PUISSANCE: 12.5,
    PUISSANCE_AUTRE_CHALEUR_RECUPEREE: 0,
    PUISSANCE_AUTRES: 0,
    PUISSANCE_AUTRES_ENR: 0,
    PUISSANCE_BIOGAZ: 0,
    PUISSANCE_BIOMASSE_SOLIDE: 8,
    PUISSANCE_CHALEUR_INDUSTRIEL: 0,
    PUISSANCE_CHARBON: 0,
    PUISSANCE_CHAUDIERES_ELECTRIQUES: 0,
    PUISSANCE_DECHETS_INTERNES: 0,
    PUISSANCE_FIOUL_DOMESTIQUE: 0,
    PUISSANCE_FIOUL_LOURD: 0,
    PUISSANCE_GAZ_NATUREL: 4.5,
    PUISSANCE_GEOTHERMIE: 0,
    PUISSANCE_GPL: 0,
    PUISSANCE_PAC: 0,
    PUISSANCE_SOLAIRE_THERMIQUE: 0,
    PUISSANCE_UIOM: 0,
    ...overrides,
  }) as DonneesReseauBrutes;

describe('SDES import', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedReseauDeChaleur({ 'Identifiant reseau': '9101C', id_fcu: 1, nom_reseau: 'Massy' } as any);
    await seedReseauDeFroid({ 'Identifiant reseau': '9101F', id_fcu: 1, nom_reseau: 'Froid' } as any);
  });

  it('updates the powers of the known networks and reports the unknown ones', async () => {
    const results = await importSdesRows([record({}), record({ FILIERE: 'F', ID: '9101F', PUISSANCE: 3 }), record({ ID: '9999C' })], {
      dryRun: false,
      logger,
    });

    expect(
      await kdb
        .selectFrom('reseaux_de_chaleur')
        .select(['puissance_totale_MW', 'puissance_MW_biomasse_solide', 'puissance_MW_gaz_naturel'])
        .where('id_fcu', '=', 1)
        .executeTakeFirstOrThrow()
    ).toStrictEqual({ puissance_MW_biomasse_solide: 8, puissance_MW_gaz_naturel: 4.5, puissance_totale_MW: 12.5 });
    expect(
      await kdb.selectFrom('reseaux_de_froid').select('puissance_totale_MW').where('id_fcu', '=', 1).executeTakeFirstOrThrow()
    ).toStrictEqual({
      puissance_totale_MW: 3,
    });
    expect({ notFound: results.chaleur.notFoundIds, updated: results.chaleur.updatedCount }).toStrictEqual({
      notFound: ['9999C'],
      updated: 1,
    });
    expect(await kdb.selectFrom('reseaux_de_chaleur').select('id_fcu').where('Identifiant reseau', '=', '9999C').execute()).toStrictEqual(
      []
    );
  });

  it('writes nothing in dry-run', async () => {
    await importSdesRows([record({})], { dryRun: true, logger });

    expect(
      await kdb.selectFrom('reseaux_de_chaleur').select('puissance_totale_MW').where('id_fcu', '=', 1).executeTakeFirstOrThrow()
    ).toStrictEqual({
      puissance_totale_MW: null,
    });
  });
});
