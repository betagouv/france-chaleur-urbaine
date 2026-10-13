import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import {
  cleanDatabase,
  createLineGeometry,
  seedReseauDeChaleur,
  seedReseauDeFroid,
  seedTableUser,
  seedZoneDeDeveloppementPrioritaire,
  seedZoneEtReseauEnConstruction,
} from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: true, input: testUsers.admin },
];

const paris = { lat: 48.8566, lon: 2.3522 };
const organizationId = uuid(30);

const seedHeatNetwork = (
  id_fcu: number,
  values: { sncu: string | null; gestionnaire: string; withTrace?: boolean; organization_id?: string }
) =>
  seedReseauDeChaleur({
    Gestionnaire: values.gestionnaire,
    geom: values.withTrace === false ? null : createLineGeometry(paris.lon, paris.lat, id_fcu * 100),
    'Identifiant reseau': values.sncu,
    id_fcu,
    livraisons_totale_MWh: id_fcu * 1000,
    nom_reseau: `Réseau ${id_fcu}`,
    organization_id: values.organization_id ?? null,
    ouvert_aux_raccordements: true,
  });

const seedPermission = (userId: string, type: 'reseau_de_chaleur' | 'reseau_en_construction', networkId: number) =>
  kdb
    .insertInto('user_permissions')
    .values({ resource_id: String(networkId), type, user_id: userId })
    .execute();

const seedDemand = (id: string, networkId: number, type: 'reseau_de_chaleur' | 'reseau_en_construction') =>
  kdb
    .insertInto('demands')
    .values({
      id,
      legacy_values: JSON.stringify({ 'Identifiant réseau': 'old', Mail: `${id}@test.local` }),
      network_id: networkId,
      network_type: type,
    })
    .execute();

const seedChangeRequest = (networkId: number) =>
  kdb
    .insertInto('network_change_requests')
    .values({
      contact_email: 'a@test.local',
      contact_first_name: 'A',
      contact_last_name: 'B',
      contact_type: 'exploitant',
      kind: 'autre',
      network_id: networkId,
      network_label: 'Réseau',
      network_type: 'reseau_de_chaleur',
      payload: JSON.stringify({ dansCadreDemandeADEME: false, precisions: 'x' }),
    })
    .execute();

const seedDocument = async (fileId: string, networkId: number) => {
  await kdb
    .insertInto('files')
    .values({
      content: Buffer.from('%PDF'),
      content_type: 'application/pdf',
      filename: 'doc.pdf',
      id: fileId,
      scan_status: 'skipped',
      sha256: fileId,
      size: 4,
    })
    .execute();
  await kdb.insertInto('network_files').values({ file_id: fileId, network_id: networkId, network_type: 'reseau_de_chaleur' }).execute();
};

describe('reseaux merge', () => {
  beforeEach(async () => {
    await cleanDatabase();
    // not covered by the shared cleanup
    await Promise.all([kdb.deleteFrom('organizations').execute(), kdb.deleteFrom('network_reminders').execute()]);
    await seedTableUser([{ ...testUsers.admin }, { ...testUsers.gestionnaire }, { ...testUsers.collectivite }]);
    await kdb.insertInto('organizations').values({ id: organizationId, name: 'ENGIE' }).execute();
  });

  describe('authorization', () => {
    adminOnly.forEach(({ input: user, expectedOutput: allowed }) => {
      const label = user ? user.role : 'anonymous';
      it(`${label} ${allowed ? 'can' : 'cannot'} preview, search and merge`, async () => {
        await seedHeatNetwork(1, { gestionnaire: 'Dalkia', sncu: '7501C' });
        await seedHeatNetwork(2, { gestionnaire: 'Dalkia', sncu: '7502C' });
        const caller = createTestCaller(user);
        const input = { absorbedIds: [2], choices: {}, keptId: 1, table: 'reseaux_de_chaleur' as const };

        if (allowed) {
          expect(
            (await caller.reseaux.searchNetworksToMerge({ search: '7502', table: 'reseaux_de_chaleur' })).map((network) => network.id_fcu)
          ).toStrictEqual([2]);
          expect((await caller.reseaux.mergePreview({ ids: [1, 2], table: 'reseaux_de_chaleur' })).candidates.length).toStrictEqual(2);
          await expect(caller.reseaux.mergeNetworks(input)).resolves.toBeDefined();
        } else {
          await expect(caller.reseaux.searchNetworksToMerge({ search: '7502', table: 'reseaux_de_chaleur' })).rejects.toMatchObject(
            forbiddenError
          );
          await expect(caller.reseaux.mergePreview({ ids: [1, 2], table: 'reseaux_de_chaleur' })).rejects.toMatchObject(forbiddenError);
          await expect(caller.reseaux.mergeNetworks(input)).rejects.toMatchObject(forbiddenError);
        }
      });
    });
  });

  it('previews the values of each network and everything pointing to it', async () => {
    await seedHeatNetwork(1, { gestionnaire: 'Dalkia', sncu: '7501C' });
    await seedHeatNetwork(2, { gestionnaire: 'ENGIE Solutions', organization_id: organizationId, sncu: '7502C', withTrace: false });
    await seedPermission(testUsers.gestionnaire.id, 'reseau_de_chaleur', 2);
    await seedDemand(uuid(40), 2, 'reseau_de_chaleur');
    await seedChangeRequest(2);
    await seedDocument(uuid(50), 2);
    await kdb.insertInto('network_reminders').values({ network_id: 2, network_type: 'reseau_de_chaleur', type: 'trace' }).execute();
    await seedZoneEtReseauEnConstruction({ id_fcu: 3, nom_reseau: 'Extension', ouvert_aux_raccordements: true, reseau_de_chaleur_id: 2 });
    await seedZoneDeDeveloppementPrioritaire({ id_fcu: 4, reseau_de_chaleur_ids: [2, 9], reseau_en_construction_ids: [] });

    const preview = await createTestCaller(testUsers.admin).reseaux.mergePreview({ ids: [1, 2], table: 'reseaux_de_chaleur' });

    expect(preview.blockers).toStrictEqual([]);
    expect(preview.candidates).toStrictEqual([
      {
        has_geometry: true,
        id_fcu: 1,
        identifiant_reseau: '7501C',
        impacts: { change_requests: 0, demands: 0, documents: 0, extensions: 0, pdps: 0, permissions: [], reminders: 0 },
        is_zone: null,
        nom_reseau: 'Réseau 1',
        values: {
          gestionnaire: 'Dalkia',
          identifiant_reseau: '7501C',
          informations_complementaires: null,
          mo: null,
          nom_reseau: 'Réseau 1',
          notes: null,
          organization: null,
          ouvert_aux_raccordements: 'Oui',
          reseaux_classes: null,
          website_gestionnaire: null,
        },
      },
      {
        has_geometry: false,
        id_fcu: 2,
        identifiant_reseau: '7502C',
        impacts: {
          change_requests: 1,
          demands: 1,
          documents: 1,
          extensions: 1,
          pdps: 1,
          permissions: [testUsers.gestionnaire.email],
          reminders: 1,
        },
        is_zone: null,
        nom_reseau: 'Réseau 2',
        values: {
          gestionnaire: 'ENGIE Solutions',
          identifiant_reseau: '7502C',
          informations_complementaires: null,
          mo: null,
          nom_reseau: 'Réseau 2',
          notes: null,
          organization: 'ENGIE',
          ouvert_aux_raccordements: 'Oui',
          reseaux_classes: null,
          website_gestionnaire: null,
        },
      },
    ]);
  });

  it('merges heat networks: chosen values written, survey values following the SNCU, every reference repointed, traces united', async () => {
    await seedHeatNetwork(1, { gestionnaire: 'Dalkia', sncu: '7501C' });
    await seedHeatNetwork(2, { gestionnaire: 'ENGIE Solutions', organization_id: organizationId, sncu: '7502C' });
    // the gestionnaire holds a permission on both networks: a single one afterwards; the collectivite only on the absorbed
    await seedPermission(testUsers.gestionnaire.id, 'reseau_de_chaleur', 1);
    await seedPermission(testUsers.gestionnaire.id, 'reseau_de_chaleur', 2);
    await seedPermission(testUsers.collectivite.id, 'reseau_de_chaleur', 2);
    await seedDemand(uuid(40), 2, 'reseau_de_chaleur');
    await seedChangeRequest(2);
    await seedDocument(uuid(50), 2);
    await kdb.insertInto('network_reminders').values({ network_id: 2, network_type: 'reseau_de_chaleur', type: 'trace' }).execute();
    await seedZoneEtReseauEnConstruction({ id_fcu: 3, nom_reseau: 'Extension', ouvert_aux_raccordements: true, reseau_de_chaleur_id: 2 });
    await seedZoneDeDeveloppementPrioritaire({ id_fcu: 4, reseau_de_chaleur_ids: [1, 2, 9], reseau_en_construction_ids: [] });
    const caller = createTestCaller(testUsers.admin);

    const impacts = await caller.reseaux.mergeNetworks({
      absorbedIds: [2],
      choices: { gestionnaire: 2, identifiant_reseau: 2, organization: 2 },
      keptId: 1,
      table: 'reseaux_de_chaleur',
    });

    expect(impacts).toStrictEqual({
      change_requests: 1,
      demands: 1,
      documents: 1,
      extensions: 1,
      pdps: 1,
      permissions: [testUsers.collectivite.email, testUsers.gestionnaire.email],
      reminders: 1,
    });
    const kept = await kdb
      .selectFrom('reseaux_de_chaleur')
      .select([
        'id_fcu',
        'Identifiant reseau',
        'nom_reseau',
        'Gestionnaire',
        'gestionnaire_fcu',
        'livraisons_totale_MWh',
        'organization_id',
      ])
      .select((eb) => eb.fn.count<number>('id_fcu').as('count'))
      .select(({ fn }) => fn<number>('ST_NumGeometries', ['geom']).as('traces'))
      .groupBy([
        'id_fcu',
        'Identifiant reseau',
        'nom_reseau',
        'Gestionnaire',
        'gestionnaire_fcu',
        'livraisons_totale_MWh',
        'organization_id',
        'geom',
      ])
      .execute();
    // the kept network carries the chosen SNCU, the survey values of that SNCU, the chosen gestionnaire (equal to the survey
    // one: no FCU correction), the kept name, and both traces
    expect(kept).toStrictEqual([
      {
        count: 1,
        Gestionnaire: 'ENGIE Solutions',
        gestionnaire_fcu: null,
        'Identifiant reseau': '7502C',
        id_fcu: 1,
        livraisons_totale_MWh: 2000,
        nom_reseau: 'Réseau 1',
        organization_id: organizationId,
        traces: 2,
      },
    ]);
    expect(await kdb.selectFrom('user_permissions').select(['user_id', 'resource_id']).orderBy('user_id').execute()).toStrictEqual(
      [testUsers.collectivite.id, testUsers.gestionnaire.id].sort().map((user_id) => ({ resource_id: '1', user_id }))
    );
    expect(await kdb.selectFrom('demands').select(['network_id', 'legacy_values']).execute()).toMatchObject([
      { legacy_values: { 'Identifiant réseau': '7502C', 'Nom réseau': 'Réseau 1' }, network_id: 1 },
    ]);
    expect(await kdb.selectFrom('network_change_requests').select('network_id').execute()).toStrictEqual([{ network_id: 1 }]);
    expect(await kdb.selectFrom('network_files').select('network_id').execute()).toStrictEqual([{ network_id: 1 }]);
    expect(await kdb.selectFrom('network_reminders').select('network_id').execute()).toStrictEqual([{ network_id: 1 }]);
    expect(await kdb.selectFrom('zones_et_reseaux_en_construction').select('reseau_de_chaleur_id').execute()).toStrictEqual([
      { reseau_de_chaleur_id: 1 },
    ]);
    expect(await kdb.selectFrom('zone_de_developpement_prioritaire').select('reseau_de_chaleur_ids').execute()).toStrictEqual([
      { reseau_de_chaleur_ids: [1, 9] },
    ]);
    expect(
      (await kdb.selectFrom('events').select(['type', 'context_id']).orderBy('type').execute()).filter((event) =>
        event.type.startsWith('network_')
      )
    ).toMatchObject([
      { context_id: '2', type: 'network_deleted' },
      { context_id: '1', type: 'network_merged' },
    ]);
    // the tiles are rebuilt
    expect((await kdb.selectFrom('jobs').select('type').where('type', '=', 'build_tiles').execute()).length).toBeGreaterThan(0);
  });

  it('merges cold networks: the survey values follow the chosen SNCU, the kept name stays', async () => {
    await seedReseauDeFroid({
      Gestionnaire: 'Dalkia',
      'Identifiant reseau': '7501F',
      id_fcu: 1,
      livraisons_totale_MWh: 10,
      nom_reseau: 'Froid A',
    });
    await seedReseauDeFroid({
      Gestionnaire: 'ENGIE',
      'Identifiant reseau': '7502F',
      id_fcu: 2,
      livraisons_totale_MWh: 20,
      nom_reseau: 'Froid B',
    });
    const caller = createTestCaller(testUsers.admin);

    await caller.reseaux.mergeNetworks({ absorbedIds: [2], choices: { identifiant_reseau: 2 }, keptId: 1, table: 'reseaux_de_froid' });

    expect(
      await kdb
        .selectFrom('reseaux_de_froid')
        .select(['id_fcu', 'Identifiant reseau', 'nom_reseau', 'Gestionnaire', 'livraisons_totale_MWh'])
        .execute()
    ).toStrictEqual([
      { Gestionnaire: 'Dalkia', 'Identifiant reseau': '7502F', id_fcu: 1, livraisons_totale_MWh: 20, nom_reseau: 'Froid A' },
    ]);
  });

  it('merges construction networks, refuses a zone with a trace and more documents than allowed', async () => {
    await seedZoneEtReseauEnConstruction({
      geom: createLineGeometry(paris.lon, paris.lat, 100),
      id_fcu: 1,
      nom_reseau: 'A',
      ouvert_aux_raccordements: false,
    });
    await seedZoneEtReseauEnConstruction({
      geom: createLineGeometry(paris.lon, paris.lat, 200),
      id_fcu: 2,
      mise_en_service: '2028',
      nom_reseau: 'B',
      ouvert_aux_raccordements: true,
    });
    await seedZoneEtReseauEnConstruction({ id_fcu: 3, is_zone: true, nom_reseau: 'Zone', ouvert_aux_raccordements: false });
    await seedPermission(testUsers.gestionnaire.id, 'reseau_en_construction', 2);
    await seedDemand(uuid(40), 2, 'reseau_en_construction');
    await seedZoneDeDeveloppementPrioritaire({ id_fcu: 4, reseau_de_chaleur_ids: [], reseau_en_construction_ids: [2] });
    const caller = createTestCaller(testUsers.admin);

    expect((await caller.reseaux.mergePreview({ ids: [1, 3], table: 'zones_et_reseaux_en_construction' })).blockers).toStrictEqual([
      'Une zone et un tracé en construction ne se fusionnent pas',
    ]);
    await expect(
      caller.reseaux.mergeNetworks({ absorbedIds: [3], choices: {}, keptId: 1, table: 'zones_et_reseaux_en_construction' })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await caller.reseaux.mergeNetworks({
      absorbedIds: [2],
      choices: { mise_en_service: 2, ouvert_aux_raccordements: 2 },
      keptId: 1,
      table: 'zones_et_reseaux_en_construction',
    });

    expect(
      await kdb
        .selectFrom('zones_et_reseaux_en_construction')
        .select(['id_fcu', 'nom_reseau', 'mise_en_service', 'ouvert_aux_raccordements'])
        .orderBy('id_fcu')
        .execute()
    ).toStrictEqual([
      { id_fcu: 1, mise_en_service: '2028', nom_reseau: 'A', ouvert_aux_raccordements: true },
      { id_fcu: 3, mise_en_service: null, nom_reseau: 'Zone', ouvert_aux_raccordements: false },
    ]);
    expect(await kdb.selectFrom('user_permissions').select('resource_id').execute()).toStrictEqual([{ resource_id: '1' }]);
    expect(await kdb.selectFrom('demands').select('network_id').execute()).toStrictEqual([{ network_id: 1 }]);
    expect(await kdb.selectFrom('zone_de_developpement_prioritaire').select('reseau_en_construction_ids').execute()).toStrictEqual([
      { reseau_en_construction_ids: [1] },
    ]);

    // documents: the cap applies to the merged network
    await seedHeatNetwork(10, { gestionnaire: 'Dalkia', sncu: '7510C' });
    await seedHeatNetwork(11, { gestionnaire: 'Dalkia', sncu: '7511C' });
    await seedDocument(uuid(51), 10);
    await seedDocument(uuid(52), 10);
    await seedDocument(uuid(53), 11);
    await seedDocument(uuid(54), 11);
    expect((await caller.reseaux.mergePreview({ ids: [10, 11], table: 'reseaux_de_chaleur' })).blockers).toStrictEqual([
      '4 documents publiés au total, 3 maximum par réseau : retirez-en avant la fusion',
    ]);
  });
});
