import { beforeAll, describe, expect, it } from 'vitest';

import { cleanDatabase, seedReseauDeChaleur, seedReseauDeFroid, seedZoneEtReseauEnConstruction } from '@/tests/fixtures';
import type { TestCase } from '@/tests/trpc-helpers';

import { type NetworkSearchResult, searchNetworkOperators, searchNetworks } from './service';

const chaleurNord: NetworkSearchResult = {
  gestionnaire: 'Dalkia',
  id_fcu: 1001,
  identifiant_reseau: '1101C',
  network_type: 'reseau_de_chaleur',
  nom_reseau: 'Chaleur Nord',
};

const chaleurSud: NetworkSearchResult = {
  gestionnaire: 'ENGIE Solutions',
  id_fcu: 1002,
  identifiant_reseau: '1102C',
  network_type: 'reseau_de_chaleur',
  nom_reseau: 'Chaleur Sud',
};

const futurEst: NetworkSearchResult = {
  gestionnaire: 'IDEX',
  id_fcu: 2001,
  identifiant_reseau: null,
  network_type: 'reseau_en_construction',
  nom_reseau: 'Futur réseau Est',
};

const zoneOuest: NetworkSearchResult = {
  gestionnaire: 'Dalkia',
  id_fcu: 2002,
  identifiant_reseau: null,
  network_type: 'reseau_en_construction',
  nom_reseau: 'Zone Ouest',
};

const byIdFcu = (a: NetworkSearchResult, b: NetworkSearchResult) => a.id_fcu - b.id_fcu;

describe('searchNetworks()', () => {
  beforeAll(async () => {
    await cleanDatabase();

    await Promise.all([
      seedReseauDeChaleur({
        Gestionnaire: chaleurNord.gestionnaire,
        'Identifiant reseau': chaleurNord.identifiant_reseau,
        id_fcu: chaleurNord.id_fcu,
        nom_reseau: chaleurNord.nom_reseau,
        ouvert_aux_raccordements: true,
      }),
      seedReseauDeChaleur({
        Gestionnaire: chaleurSud.gestionnaire,
        'Identifiant reseau': chaleurSud.identifiant_reseau,
        id_fcu: chaleurSud.id_fcu,
        nom_reseau: chaleurSud.nom_reseau,
        ouvert_aux_raccordements: true,
      }),
      seedZoneEtReseauEnConstruction({
        gestionnaire: futurEst.gestionnaire,
        id_fcu: futurEst.id_fcu,
        is_zone: false,
        nom_reseau: futurEst.nom_reseau,
        ouvert_aux_raccordements: false,
      }),
      seedZoneEtReseauEnConstruction({
        gestionnaire: zoneOuest.gestionnaire,
        id_fcu: zoneOuest.id_fcu,
        is_zone: true,
        nom_reseau: zoneOuest.nom_reseau,
        ouvert_aux_raccordements: false,
      }),
    ]);
  });

  const cases: TestCase<string, NetworkSearchResult[]>[] = [
    { expectedOutput: [chaleurNord], input: 'Nord', label: 'matche un réseau existant par nom_reseau' },
    { expectedOutput: [chaleurSud], input: '1102C', label: 'matche un réseau existant par Identifiant reseau (SNCU)' },
    { expectedOutput: [chaleurNord], input: '1001', label: 'matche un réseau existant par id_fcu' },
    { expectedOutput: [futurEst], input: 'Futur', label: 'matche un réseau en construction par nom_reseau' },
    { expectedOutput: [futurEst], input: '2001', label: 'matche un réseau en construction par id_fcu' },
    { expectedOutput: [zoneOuest], input: 'Ouest', label: 'inclut les zones (is_zone = true)' },
    { expectedOutput: [chaleurNord, chaleurSud], input: 'Chaleur', label: 'matche sur les deux tables en une seule requête' },
    { expectedOutput: [], input: 'IDEX', label: 'ne cherche pas dans le champ gestionnaire' },
    { expectedOutput: [], input: 'inexistant', label: 'retourne tableau vide sans match' },
  ];

  it.each(cases)('$label', async ({ input, expectedOutput }) => {
    const results = await searchNetworks(input);
    expect(results.sort(byIdFcu)).toStrictEqual(expectedOutput.sort(byIdFcu));
  });
});

describe('searchNetworkOperators()', () => {
  beforeAll(async () => {
    await cleanDatabase();

    // Dalkia appears in chaleur + froid (distinct test); IDEX only in construction.
    await Promise.all([
      seedReseauDeChaleur({
        Gestionnaire: 'Dalkia',
        id_fcu: 3001,
        MO: 'Métropole de Lyon',
        nom_reseau: 'RC A',
        ouvert_aux_raccordements: true,
      }),
      seedReseauDeChaleur({
        Gestionnaire: 'ENGIE Solutions',
        id_fcu: 3002,
        MO: 'Ville de Paris',
        nom_reseau: 'RC B',
        ouvert_aux_raccordements: true,
      }),
      seedReseauDeFroid({ Gestionnaire: 'Dalkia', id_fcu: 3003, MO: 'Région Sud', nom_reseau: 'RF A' }),
      seedZoneEtReseauEnConstruction({
        gestionnaire: 'IDEX',
        id_fcu: 3004,
        is_zone: false,
        MO: 'Commune de Nantes',
        nom_reseau: 'ZC',
        ouvert_aux_raccordements: false,
      }),
    ]);
  });

  const cases = [
    {
      expected: ['Dalkia'],
      field: 'gestionnaire',
      label: 'gestionnaire : insensible à la casse + distinct (chaleur + froid)',
      search: 'dalkia',
    },
    { expected: ['IDEX'], field: 'gestionnaire', label: 'gestionnaire : inclut les réseaux en construction', search: 'idex' },
    { expected: ['Dalkia', 'IDEX'], field: 'gestionnaire', label: 'gestionnaire : multi-résultats triés, toutes tables', search: 'd' },
    { expected: [], field: 'gestionnaire', label: 'gestionnaire : aucun match', search: 'zzz' },
    { expected: ['Métropole de Lyon'], field: 'maitreOuvrage', label: 'MO : match chaleur', search: 'métropole' },
    { expected: ['Région Sud'], field: 'maitreOuvrage', label: 'MO : inclut les réseaux de froid', search: 'région' },
    { expected: ['Commune de Nantes'], field: 'maitreOuvrage', label: 'MO : inclut les réseaux en construction', search: 'nantes' },
    { expected: [], field: 'maitreOuvrage', label: 'MO : ne cherche pas dans le champ gestionnaire', search: 'idex' },
  ] as const;

  it.each(cases)('$label', async ({ field, search, expected }) => {
    expect(await searchNetworkOperators(field, search)).toStrictEqual(expected);
  });
});
