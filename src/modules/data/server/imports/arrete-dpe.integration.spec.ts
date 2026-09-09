import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { cleanDatabase, seedReseauDeChaleur, seedReseauDeFroid } from '@/tests/fixtures';

import { type ArreteDpeRow, applyArreteDpe } from './arrete-dpe';

const logger = parentLogger.child({ name: 'arrete-dpe-test' });

const dpeColumns = ['id_fcu', 'Identifiant reseau', 'contenu CO2', 'contenu CO2 ACV', 'Moyenne-annee-DPE', 'Taux EnR&R'] as const;

const rows: ArreteDpeRow[] = [
  {
    annee_reference: 'Moyenne',
    contenu_co2: 0.175,
    contenu_co2_acv: 0.211,
    identifiant: '0102C',
    localisation: 'A',
    nom: 'A',
    taux_enrr: 51.1,
  },
  {
    annee_reference: '2024',
    contenu_co2: 0.015,
    contenu_co2_acv: 0.03,
    identifiant: '1234F',
    localisation: 'B',
    nom: 'B',
    taux_enrr: null,
  },
  { annee_reference: '2024', contenu_co2: 0.1, contenu_co2_acv: 0.2, identifiant: '5555C', localisation: 'C', nom: 'C', taux_enrr: 10 },
];

describe('applyArreteDpe', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await Promise.all([
      seedReseauDeChaleur({
        'contenu CO2': 0.2,
        'contenu CO2 ACV': 0.25,
        'Identifiant reseau': '0102C',
        id_fcu: 1,
        'Moyenne-annee-DPE': '2023',
        ouvert_aux_raccordements: true,
        'Taux EnR&R': 40,
      }),
      seedReseauDeChaleur({
        'contenu CO2': 0.3,
        'contenu CO2 ACV': 0.35,
        'Identifiant reseau': '0999C',
        id_fcu: 2,
        'Moyenne-annee-DPE': '2023',
        ouvert_aux_raccordements: true,
        'Taux EnR&R': 30,
      }),
      seedReseauDeChaleur({ 'Identifiant reseau': null, id_fcu: 3, ouvert_aux_raccordements: true, 'Taux EnR&R': 90 }),
      seedReseauDeFroid({
        'contenu CO2': 0.02,
        'contenu CO2 ACV': 0.04,
        'Identifiant reseau': '1234F',
        id_fcu: 4,
        'Moyenne-annee-DPE': 'Moyenne',
      }),
    ]);
  });

  const readNetworks = async () => ({
    chaleur: await kdb.selectFrom('reseaux_de_chaleur').select(dpeColumns).orderBy('id_fcu').execute(),
    froid: await kdb.selectFrom('reseaux_de_froid').select(dpeColumns).orderBy('id_fcu').execute(),
  });

  it('updates listed networks, resets the others and reports unknown identifiers', async () => {
    const results = await applyArreteDpe(rows, { dryRun: false, logger });

    expect(results.map(({ config, changes }) => ({ label: config.label, ...changes }))).toStrictEqual([
      {
        label: 'chaleur',
        resets: [
          {
            after: { 'contenu CO2': null, 'contenu CO2 ACV': null, 'Moyenne-annee-DPE': null, 'Taux EnR&R': null },
            before: { 'contenu CO2': 0.3, 'contenu CO2 ACV': 0.35, 'Moyenne-annee-DPE': '2023', 'Taux EnR&R': 30 },
            id_fcu: 2,
            identifiant: '0999C',
          },
          {
            after: { 'contenu CO2': null, 'contenu CO2 ACV': null, 'Moyenne-annee-DPE': null, 'Taux EnR&R': null },
            before: { 'contenu CO2': null, 'contenu CO2 ACV': null, 'Moyenne-annee-DPE': null, 'Taux EnR&R': 90 },
            id_fcu: 3,
            identifiant: null,
          },
        ],
        unknownIdentifiants: ['5555C'],
        updates: [
          {
            after: { 'contenu CO2': 0.175, 'contenu CO2 ACV': 0.211, 'Moyenne-annee-DPE': 'Moyenne', 'Taux EnR&R': 51.1 },
            before: { 'contenu CO2': 0.2, 'contenu CO2 ACV': 0.25, 'Moyenne-annee-DPE': '2023', 'Taux EnR&R': 40 },
            id_fcu: 1,
            identifiant: '0102C',
          },
        ],
      },
      {
        label: 'froid',
        resets: [],
        unknownIdentifiants: [],
        updates: [
          {
            after: { 'contenu CO2': 0.015, 'contenu CO2 ACV': 0.03, 'Moyenne-annee-DPE': '2024', 'Taux EnR&R': null },
            before: { 'contenu CO2': 0.02, 'contenu CO2 ACV': 0.04, 'Moyenne-annee-DPE': 'Moyenne', 'Taux EnR&R': null },
            id_fcu: 4,
            identifiant: '1234F',
          },
        ],
      },
    ]);
    expect(await readNetworks()).toStrictEqual({
      chaleur: [
        {
          'contenu CO2': 0.175,
          'contenu CO2 ACV': 0.211,
          'Identifiant reseau': '0102C',
          id_fcu: 1,
          'Moyenne-annee-DPE': 'Moyenne',
          'Taux EnR&R': 51.1,
        },
        {
          'contenu CO2': null,
          'contenu CO2 ACV': null,
          'Identifiant reseau': '0999C',
          id_fcu: 2,
          'Moyenne-annee-DPE': null,
          'Taux EnR&R': null,
        },
        {
          'contenu CO2': null,
          'contenu CO2 ACV': null,
          'Identifiant reseau': null,
          id_fcu: 3,
          'Moyenne-annee-DPE': null,
          'Taux EnR&R': null,
        },
      ],
      froid: [
        {
          'contenu CO2': 0.015,
          'contenu CO2 ACV': 0.03,
          'Identifiant reseau': '1234F',
          id_fcu: 4,
          'Moyenne-annee-DPE': '2024',
          'Taux EnR&R': null,
        },
      ],
    });
  });

  it('does not write anything in dry-run mode', async () => {
    const before = await readNetworks();

    const results = await applyArreteDpe(rows, { dryRun: true, logger });

    expect(results.map(({ changes }) => [changes.updates.length, changes.resets.length])).toStrictEqual([
      [1, 2],
      [1, 0],
    ]);
    expect(await readNetworks()).toStrictEqual(before);
  });
});
