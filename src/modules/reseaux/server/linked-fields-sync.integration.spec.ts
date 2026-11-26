import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import {
  cleanDatabase,
  seedReseauDeChaleur,
  seedTableUser,
  seedZoneDeDeveloppementPrioritaire,
  seedZoneEtReseauEnConstruction,
} from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import type { TestCase } from '@/tests/trpc-helpers';

import { syncLinkedNetworkFields } from './linked-fields-sync';

const getConstruction = (idFcu: number) =>
  kdb
    .selectFrom('zones_et_reseaux_en_construction')
    .select(['Identifiant reseau', 'gestionnaire', 'MO', 'nom_reseau'])
    .where('id_fcu', '=', idFcu)
    .executeTakeFirstOrThrow();

const getPdp = (idFcu: number) =>
  kdb.selectFrom('zone_de_developpement_prioritaire').select(['Gestionnaire', 'MO']).where('id_fcu', '=', idFcu).executeTakeFirstOrThrow();

describe('syncLinkedNetworkFields()', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await Promise.all([
      seedReseauDeChaleur({
        Gestionnaire: 'Dalkia',
        'Identifiant reseau': '1101C',
        id_fcu: 100,
        MO: 'Métropole de Lyon',
        nom_reseau: 'Réseau de Lyon',
        ouvert_aux_raccordements: true,
      }),
      seedReseauDeChaleur({
        Gestionnaire: 'ENGIE Solutions',
        'Identifiant reseau': '1102C',
        id_fcu: 101,
        MO: 'Ville de Paris',
        ouvert_aux_raccordements: true,
      }),
    ]);
  });

  it("recopie SNCU, nom, gestionnaire et MO du RC parent sur l'extension (miroir strict, valeur divergente écrasée)", async () => {
    await seedZoneEtReseauEnConstruction({
      gestionnaire: 'Valeur divergente',
      id_fcu: 200,
      nom_reseau: 'Nom divergent',
      ouvert_aux_raccordements: true,
      reseau_de_chaleur_id: 100,
    });

    await syncLinkedNetworkFields();

    expect(await getConstruction(200)).toStrictEqual({
      gestionnaire: 'Dalkia',
      'Identifiant reseau': '1101C',
      MO: 'Métropole de Lyon',
      nom_reseau: 'Réseau de Lyon',
    });
  });

  it('remet le SNCU à null quand le lien est retiré mais conserve nom/gestionnaire/MO hérités', async () => {
    await seedZoneEtReseauEnConstruction({
      gestionnaire: 'Valeur conservée',
      'Identifiant reseau': '1101C',
      id_fcu: 201,
      nom_reseau: 'Nom conservé',
      ouvert_aux_raccordements: true,
    });

    await syncLinkedNetworkFields();

    expect(await getConstruction(201)).toStrictEqual({
      gestionnaire: 'Valeur conservée',
      'Identifiant reseau': null,
      MO: null,
      nom_reseau: 'Nom conservé',
    });
  });

  it('remplit les champs vides du PDP quand la valeur liée est unique (lien par SNCU)', async () => {
    await seedZoneDeDeveloppementPrioritaire({
      'Identifiant reseau': '1101C',
      id_fcu: 300,
      reseau_de_chaleur_ids: [],
      reseau_en_construction_ids: [],
    });

    await syncLinkedNetworkFields();

    expect(await getPdp(300)).toStrictEqual({ Gestionnaire: 'Dalkia', MO: 'Métropole de Lyon' });
  });

  it('laisse vide le champ ambigu (plusieurs valeurs liées distinctes) mais remplit le champ non ambigu', async () => {
    await seedReseauDeChaleur({
      Gestionnaire: 'Dalkia',
      'Identifiant reseau': '1103C',
      id_fcu: 102,
      MO: 'Métropole de Grenoble',
      ouvert_aux_raccordements: true,
    });
    // MO ambigus (Lyon / Grenoble), gestionnaires identiques (Dalkia) → dédoublonnés
    await seedZoneDeDeveloppementPrioritaire({
      id_fcu: 301,
      reseau_de_chaleur_ids: [100, 102],
      reseau_en_construction_ids: [],
    });

    await syncLinkedNetworkFields();

    expect(await getPdp(301)).toStrictEqual({ Gestionnaire: 'Dalkia', MO: null });
  });

  it('résout les liens PDP historiques par SNCU en ids et recopie le SNCU du RC lié unique', async () => {
    // 303 : lien historique par SNCU seul → ids à résoudre ; 304 : lien par id → SNCU à recopier
    await seedZoneDeDeveloppementPrioritaire({
      'Identifiant reseau': '1102C',
      id_fcu: 303,
      reseau_de_chaleur_ids: [],
      reseau_en_construction_ids: [],
    });
    await seedZoneDeDeveloppementPrioritaire({ id_fcu: 304, reseau_de_chaleur_ids: [100], reseau_en_construction_ids: [] });

    await syncLinkedNetworkFields();

    const getPdpLink = (idFcu: number) =>
      kdb
        .selectFrom('zone_de_developpement_prioritaire')
        .select(['Identifiant reseau', 'reseau_de_chaleur_ids'])
        .where('id_fcu', '=', idFcu)
        .executeTakeFirstOrThrow();
    expect(await getPdpLink(303)).toStrictEqual({ 'Identifiant reseau': '1102C', reseau_de_chaleur_ids: [101] });
    expect(await getPdpLink(304)).toStrictEqual({ 'Identifiant reseau': '1101C', reseau_de_chaleur_ids: [100] });
  });

  it("n'écrase pas une valeur saisie sur le PDP et complète depuis un réseau en construction lié", async () => {
    await seedZoneEtReseauEnConstruction({
      gestionnaire: 'IDEX',
      id_fcu: 202,
      MO: 'Commune de Nantes',
      ouvert_aux_raccordements: true,
    });
    await seedZoneDeDeveloppementPrioritaire({
      Gestionnaire: 'Valeur saisie',
      id_fcu: 302,
      reseau_de_chaleur_ids: [],
      reseau_en_construction_ids: [202],
    });

    await syncLinkedNetworkFields();

    expect(await getPdp(302)).toStrictEqual({ Gestionnaire: 'Valeur saisie', MO: 'Commune de Nantes' });
  });

  describe('extension liée : ce que traite la même équipe est porté par le RC parent', () => {
    const seedExtension = (idFcu: number, parentIdFcu: number | null, notes: string | null = null) =>
      seedZoneEtReseauEnConstruction({ id_fcu: idFcu, notes, ouvert_aux_raccordements: true, reseau_de_chaleur_id: parentIdFcu });

    const seedDemand = (assignment: {
      extension_id: number | null;
      network_id: number;
      network_type: 'reseau_de_chaleur' | 'reseau_en_construction';
    }) =>
      kdb
        .insertInto('demands')
        .values({ ...assignment, legacy_values: JSON.stringify({}) })
        .returning('id')
        .executeTakeFirstOrThrow();

    const getAssignment = (demandId: string) =>
      kdb.selectFrom('demands').select(['network_id', 'network_type', 'extension_id']).where('id', '=', demandId).executeTakeFirstOrThrow();

    it("rattache au RC parent les demandes d'une extension liée, qui reste leur réseau le plus proche", async () => {
      await Promise.all([seedExtension(200, 100), seedExtension(203, null)]);
      const [extensionDemand, standaloneDemand] = await Promise.all([
        seedDemand({ extension_id: null, network_id: 200, network_type: 'reseau_en_construction' }),
        seedDemand({ extension_id: null, network_id: 203, network_type: 'reseau_en_construction' }),
      ]);

      await syncLinkedNetworkFields();

      expect(await getAssignment(extensionDemand.id)).toStrictEqual({
        extension_id: 200,
        network_id: 100,
        network_type: 'reseau_de_chaleur',
      });
      expect(await getAssignment(standaloneDemand.id)).toStrictEqual({
        extension_id: null,
        network_id: 203,
        network_type: 'reseau_en_construction',
      });
    });

    const linkChangeCases: TestCase<number | null, Awaited<ReturnType<typeof getAssignment>>>[] = [
      {
        expectedOutput: { extension_id: 200, network_id: 100, network_type: 'reseau_de_chaleur' },
        input: 100,
        label: 'lien inchangé → la demande reste sur le RC parent',
      },
      {
        expectedOutput: { extension_id: 200, network_id: 101, network_type: 'reseau_de_chaleur' },
        input: 101,
        label: 'extension liée à un autre RC → la demande suit',
      },
      {
        expectedOutput: { extension_id: null, network_id: 200, network_type: 'reseau_en_construction' },
        input: null,
        label: "lien retiré → la demande revient sur l'extension",
      },
    ];
    it.each(linkChangeCases)('$label', async ({ input: parentIdFcu, expectedOutput }) => {
      await seedExtension(200, parentIdFcu);
      const demand = await seedDemand({ extension_id: 200, network_id: 100, network_type: 'reseau_de_chaleur' });

      await syncLinkedNetworkFields();

      expect(await getAssignment(demand.id)).toStrictEqual(expectedOutput);
    });

    it("remplace les permissions sur l'extension par une permission sur le RC parent, tracée par compte", async () => {
      const extensionOnlyUserId = uuid(1);
      const bothUserId = uuid(2);
      await Promise.all([
        seedExtension(200, 100),
        seedExtension(203, null),
        seedTableUser([
          { email: 'extension@test.local', id: extensionOnlyUserId, role: 'gestionnaire' },
          { email: 'both@test.local', id: bothUserId, role: 'gestionnaire' },
        ]),
      ]);
      await kdb
        .insertInto('user_permissions')
        .values([
          { resource_id: '200', type: 'reseau_en_construction', user_id: extensionOnlyUserId },
          { resource_id: '203', type: 'reseau_en_construction', user_id: extensionOnlyUserId },
          { resource_id: '200', type: 'reseau_en_construction', user_id: bothUserId },
          { resource_id: '100', type: 'reseau_de_chaleur', user_id: bothUserId },
        ])
        .execute();

      await syncLinkedNetworkFields();

      const permissions = await kdb
        .selectFrom('user_permissions')
        .select(['user_id', 'type', 'resource_id'])
        .orderBy('user_id')
        .orderBy('resource_id')
        .execute();
      expect(permissions).toStrictEqual([
        { resource_id: '100', type: 'reseau_de_chaleur', user_id: extensionOnlyUserId },
        { resource_id: '203', type: 'reseau_en_construction', user_id: extensionOnlyUserId },
        { resource_id: '100', type: 'reseau_de_chaleur', user_id: bothUserId },
      ]);

      const events = await kdb
        .selectFrom('events')
        .select(['author_id', 'context_id', 'context_type', 'data', 'type'])
        .orderBy('context_id')
        .execute();
      expect(events).toStrictEqual([
        {
          author_id: null,
          context_id: extensionOnlyUserId,
          context_type: 'user',
          data: {
            added: [{ resource_id: '100', type: 'reseau_de_chaleur' }],
            removed: [{ resource_id: '200', type: 'reseau_en_construction' }],
            user_email: 'extension@test.local',
          },
          type: 'user_permissions_updated',
        },
        {
          author_id: null,
          context_id: bothUserId,
          context_type: 'user',
          data: { added: [], removed: [{ resource_id: '200', type: 'reseau_en_construction' }], user_email: 'both@test.local' },
          type: 'user_permissions_updated',
        },
      ]);
    });

    it("déplace sur le RC parent les rappels de demandes de l'extension, pas ses rappels de tracé", async () => {
      await seedExtension(200, 100);
      await kdb
        .insertInto('network_reminders')
        .values([
          { network_id: 200, network_type: 'reseau_en_construction', note: 'demandes', type: 'demand' },
          { network_id: 200, network_type: 'reseau_en_construction', note: 'tracé', type: 'trace' },
        ])
        .execute();

      await syncLinkedNetworkFields();

      const reminders = await kdb.selectFrom('network_reminders').select(['network_id', 'network_type', 'note']).orderBy('note').execute();
      expect(reminders).toStrictEqual([
        { network_id: 100, network_type: 'reseau_de_chaleur', note: 'demandes' },
        { network_id: 200, network_type: 'reseau_en_construction', note: 'tracé' },
      ]);
    });

    it("ajoute les notes de l'extension à celles du RC parent puis les vide sur l'extension, sans répéter une note déjà présente", async () => {
      await kdb.updateTable('reseaux_de_chaleur').set({ notes: 'Note du réseau' }).where('id_fcu', '=', 100).execute();
      await Promise.all([
        seedExtension(200, 100, "Note de l'extension"),
        // same note as its parent network: entered on both by the team following them
        seedExtension(202, 100, ' Note du réseau\n'),
        // same note on two extensions of a network without notes
        seedExtension(201, 101, 'Seule note'),
        seedExtension(203, 101, 'Seule note'),
      ]);

      await syncLinkedNetworkFields();
      await syncLinkedNetworkFields();

      const [networks, extensions] = await Promise.all([
        kdb.selectFrom('reseaux_de_chaleur').select(['id_fcu', 'notes']).orderBy('id_fcu').execute(),
        kdb.selectFrom('zones_et_reseaux_en_construction').select(['id_fcu', 'notes']).orderBy('id_fcu').execute(),
      ]);
      expect(networks).toStrictEqual([
        { id_fcu: 100, notes: "Note du réseau\n\nNote de l'extension" },
        { id_fcu: 101, notes: 'Seule note' },
      ]);
      expect(extensions).toStrictEqual([
        { id_fcu: 200, notes: null },
        { id_fcu: 201, notes: null },
        { id_fcu: 202, notes: null },
        { id_fcu: 203, notes: null },
      ]);
    });

    it("recopie l'organisation du RC parent sur l'extension", async () => {
      const organizationId = uuid(10);
      await kdb.insertInto('organizations').values({ id: organizationId, name: 'Opérateur' }).execute();
      await kdb.updateTable('reseaux_de_chaleur').set({ organization_id: organizationId }).where('id_fcu', '=', 100).execute();
      await seedExtension(200, 100);

      await syncLinkedNetworkFields();

      const extension = await kdb
        .selectFrom('zones_et_reseaux_en_construction')
        .select('organization_id')
        .where('id_fcu', '=', 200)
        .executeTakeFirstOrThrow();
      expect(extension).toStrictEqual({ organization_id: organizationId });
    });
  });
});
