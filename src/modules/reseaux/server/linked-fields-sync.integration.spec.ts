import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedReseauDeChaleur, seedZoneDeDeveloppementPrioritaire, seedZoneEtReseauEnConstruction } from '@/tests/fixtures';

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
});
