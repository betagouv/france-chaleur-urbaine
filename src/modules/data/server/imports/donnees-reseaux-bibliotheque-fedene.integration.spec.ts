import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getColdNetwork, getNetwork } from '@/modules/reseaux/server/service';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedReseauDeChaleur, seedReseauDeFroid } from '@/tests/fixtures';

import { type ExcelRowBrute, importFedeneRows } from './donnees-reseaux-bibliotheque-fedene';

const logger = { info: vi.fn(), warn: vi.fn() } as any;

const row = (overrides: Partial<ExcelRowBrute>): ExcelRowBrute =>
  ({
    Commune: 'Massy',
    'Coût en € TTC/MWh \nBâtiment tertiaire': 70,
    'Coût en € TTC/MWh \nRésidence 30 lots': 80,
    'Développement réseau': 0.05,
    Gestionnaire: 'Dalkia',
    'Groupe gestionnaire': 'EDF',
    'ID EARCF': '9101C',
    'Livraisons Agriculture MWh': 0,
    'Livraisons Autre MWh': 10,
    'Livraisons Industrie MWh': 20,
    'Livraisons nettes MWh': 1000,
    'Livraisons Résidentiel MWh': 700,
    'Livraisons Tertiaire MWh': 270,
    'Longueur du réseau km (aller)': '[10,20]',
    "Maitre d'Ouvrage": 'Ville de Massy',
    Nom: 'Réseau de Massy',
    'Nombre points de livraison': 42,
    'Part fixe': 0.4,
    'Part variable': 0.6,
    'Prix moyen \n€ TTC/MWh': 75,
    'Production totale MWh': 1200,
    'Rendement de distribution': 0.83,
    ...overrides,
  }) as ExcelRowBrute;

const provenanceColumns = [
  'nom_reseau',
  'nom_reseau_fedene',
  'nom_reseau_fcu',
  'Gestionnaire',
  'gestionnaire_fedene',
  'gestionnaire_fcu',
  'MO',
  'mo_fedene',
  'mo_fcu',
] as const;

describe('FEDENE import', () => {
  beforeEach(async () => {
    await cleanDatabase();
    // 9101C: the gestionnaire and the name were corrected by FCU (an older survey said « Ancien exploitant »)
    await seedReseauDeChaleur({
      gestionnaire_fcu: 'Exploitant actuel',
      gestionnaire_fedene: 'Ancien exploitant',
      'Identifiant reseau': '9101C',
      id_fcu: 1,
      nom_reseau_fcu: 'Massy (admin)',
      nom_reseau_fedene: 'Massy',
    } as any);
    await seedReseauDeChaleur({ 'Identifiant reseau': '9102C', id_fcu: 2, nom_reseau: 'Absent du fichier' } as any);
    await seedReseauDeFroid({ 'Identifiant reseau': '9101F', id_fcu: 1, nom_reseau: 'Froid' } as any);
  });

  it('writes the survey figures and identity on the network, keeps the FCU corrections and reports the networks missing from the file', async () => {
    const results = await importFedeneRows([row({}), row({ 'ID EARCF': '9101F', Nom: 'Froid enquête' })], { dryRun: false, logger });

    const network = await kdb
      .selectFrom('reseaux_de_chaleur')
      .select([...provenanceColumns, 'livraisons_totale_MWh', 'nb_pdl', 'Rend%', 'Dev_reseau%', 'PF%', 'PM', 'PM_L', 'PM_T', 'PV%'])
      .where('id_fcu', '=', 1)
      .executeTakeFirstOrThrow();
    expect(network).toStrictEqual({
      'Dev_reseau%': 5,
      Gestionnaire: 'Exploitant actuel',
      gestionnaire_fcu: 'Exploitant actuel',
      gestionnaire_fedene: 'Dalkia (EDF)',
      livraisons_totale_MWh: 1000,
      MO: 'Ville de Massy',
      mo_fcu: null,
      mo_fedene: 'Ville de Massy',
      nb_pdl: 42,
      nom_reseau: 'Massy (admin)',
      nom_reseau_fcu: 'Massy (admin)',
      nom_reseau_fedene: 'Réseau de Massy',
      'PF%': 40,
      PM: 75,
      PM_L: 80,
      PM_T: 70,
      'PV%': 60,
      'Rend%': 83,
    });
    expect(
      await kdb.selectFrom('reseaux_de_froid').select(provenanceColumns).where('id_fcu', '=', 1).executeTakeFirstOrThrow()
    ).toStrictEqual({
      Gestionnaire: 'Dalkia (EDF)',
      gestionnaire_fcu: null,
      gestionnaire_fedene: 'Dalkia (EDF)',
      MO: 'Ville de Massy',
      mo_fcu: null,
      mo_fedene: 'Ville de Massy',
      nom_reseau: 'Froid enquête',
      nom_reseau_fcu: null,
      nom_reseau_fedene: 'Froid enquête',
    });
    expect({
      created: results.chaleur.createdCount,
      missingFromExcel: results.chaleur.missingFromExcel,
      updated: results.chaleur.updatedCount,
    }).toStrictEqual({ created: 0, missingFromExcel: ['9102C'], updated: 1 });
  });

  it('proposes to drop a FCU correction that still differs from the survey, refreshed on each import, and drops it itself once matched', async () => {
    await importFedeneRows([row({})], { dryRun: false, logger });
    const [suggestion] = await kdb
      .selectFrom('network_change_requests')
      .select(['kind', 'origin', 'status', 'network_type', 'network_id', 'network_label', 'contact_email', 'contact_type_other', 'payload'])
      .execute();
    expect(suggestion).toStrictEqual({
      contact_email: null,
      contact_type_other: 'Enquête FEDENE',
      kind: 'enquete',
      network_id: 1,
      network_label: '9101C - Massy (admin)',
      network_type: 'reseau_de_chaleur',
      origin: 'import',
      payload: { gestionnaire: 'Dalkia (EDF)', nomReseau: 'Réseau de Massy' },
      status: 'pending',
    });

    // the survey now reports the corrected name: the name correction is dropped, the suggestion only keeps the gestionnaire
    await importFedeneRows([row({ Nom: 'Massy (admin)' })], { dryRun: false, logger });
    expect(
      await kdb.selectFrom('reseaux_de_chaleur').select(['nom_reseau', 'nom_reseau_fcu']).where('id_fcu', '=', 1).executeTakeFirstOrThrow()
    ).toStrictEqual({ nom_reseau: 'Massy (admin)', nom_reseau_fcu: null });
    expect(await kdb.selectFrom('network_change_requests').select(['payload']).execute()).toStrictEqual([
      { payload: { gestionnaire: 'Dalkia (EDF)' } },
    ]);

    // the survey catches up on the gestionnaire too (case aside): no correction left, suggestion removed
    await importFedeneRows([row({ Gestionnaire: 'EXPLOITANT ACTUEL', 'Groupe gestionnaire': null, Nom: 'Massy (admin)' })], {
      dryRun: false,
      logger,
    });
    expect(
      await kdb
        .selectFrom('reseaux_de_chaleur')
        .select(['Gestionnaire', 'gestionnaire_fcu'])
        .where('id_fcu', '=', 1)
        .executeTakeFirstOrThrow()
    ).toStrictEqual({ Gestionnaire: 'EXPLOITANT ACTUEL', gestionnaire_fcu: null });
    expect(await kdb.selectFrom('network_change_requests').select('id').execute()).toStrictEqual([]);
  });

  it('keeps the previous survey value and the FCU correction when the file leaves a value empty', async () => {
    await importFedeneRows([row({ Gestionnaire: undefined, 'Groupe gestionnaire': undefined, Nom: undefined })], { dryRun: false, logger });

    expect(
      await kdb
        .selectFrom('reseaux_de_chaleur')
        .select(['Gestionnaire', 'gestionnaire_fcu', 'gestionnaire_fedene', 'nom_reseau', 'nom_reseau_fcu', 'nom_reseau_fedene'])
        .where('id_fcu', '=', 1)
        .executeTakeFirstOrThrow()
    ).toStrictEqual({
      Gestionnaire: 'Exploitant actuel',
      gestionnaire_fcu: 'Exploitant actuel',
      gestionnaire_fedene: 'Ancien exploitant',
      nom_reseau: 'Massy (admin)',
      nom_reseau_fcu: 'Massy (admin)',
      nom_reseau_fedene: 'Massy',
    });
    expect(await kdb.selectFrom('network_change_requests').select('id').execute()).toStrictEqual([]);
  });

  it('does not propose again a correction the admin kept, until the survey reports another value', async () => {
    await importFedeneRows([row({})], { dryRun: false, logger });
    await kdb
      .updateTable('network_change_requests')
      .set({
        payload: JSON.stringify({
          decisions: { gestionnaire: 'keep_fcu', nomReseau: 'keep_fcu' },
          gestionnaire: 'Dalkia (EDF)',
          nomReseau: 'Réseau de Massy',
        }),
        processed_at: new Date(),
        status: 'processed',
      })
      .execute();

    // same survey values: nothing proposed again
    await importFedeneRows([row({})], { dryRun: false, logger });
    expect(await kdb.selectFrom('network_change_requests').select('status').execute()).toStrictEqual([{ status: 'processed' }]);

    // the survey now reports another gestionnaire: only that field is proposed again
    await importFedeneRows([row({ Gestionnaire: 'Coriance', 'Groupe gestionnaire': null })], { dryRun: false, logger });
    expect(
      await kdb.selectFrom('network_change_requests').select(['status', 'payload']).where('status', '=', 'pending').execute()
    ).toStrictEqual([{ payload: { gestionnaire: 'Coriance' }, status: 'pending' }]);
  });

  it('exposes the FCU correction of the gestionnaire to the public pages', async () => {
    await importFedeneRows([row({}), row({ 'ID EARCF': '9101F', Nom: 'Froid enquête' })], { dryRun: false, logger });

    expect((await getNetwork('9101C'))?.gestionnaire_fcu).toStrictEqual('Exploitant actuel');
    expect((await getColdNetwork('9101F'))?.gestionnaire_fcu).toStrictEqual(null);
  });

  it('creates the networks unknown to the base without geometry, with the survey identity', async () => {
    await importFedeneRows([row({ 'ID EARCF': '9103C', Nom: 'Nouveau réseau' })], { dryRun: false, logger });

    const created = await kdb
      .selectFrom('reseaux_de_chaleur')
      .select([
        'id_fcu',
        'Identifiant reseau',
        'nom_reseau',
        'nom_reseau_fcu',
        'nb_pdl',
        'reseaux classes',
        'ouvert_aux_raccordements',
        'has_trace',
      ])
      .where('Identifiant reseau', '=', '9103C')
      .executeTakeFirstOrThrow();
    expect(created).toStrictEqual({
      has_trace: false,
      'Identifiant reseau': '9103C',
      id_fcu: 3,
      nb_pdl: 42,
      nom_reseau: 'Nouveau réseau',
      nom_reseau_fcu: null,
      ouvert_aux_raccordements: false,
      'reseaux classes': false,
    });
  });

  it('writes nothing in dry-run but reports the changes', async () => {
    const results = await importFedeneRows([row({}), row({ 'ID EARCF': '9103C' })], { dryRun: true, logger });

    expect(results.chaleur.changes.map((change) => `${change.type} ${change.id}`)).toStrictEqual(['UPDATE 9101C', 'CREATE 9103C']);
    expect(await kdb.selectFrom('reseaux_de_chaleur').select('nb_pdl').where('id_fcu', '=', 1).executeTakeFirstOrThrow()).toStrictEqual({
      nb_pdl: null,
    });
    expect(await kdb.selectFrom('reseaux_de_chaleur').select('id_fcu').where('Identifiant reseau', '=', '9103C').execute()).toStrictEqual(
      []
    );
  });
});
