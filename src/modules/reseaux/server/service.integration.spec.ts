import { beforeAll, describe, expect, it } from 'vitest';

import { cleanDatabase, seedReseauDeChaleur, seedReseauDeFroid, seedZoneEtReseauEnConstruction } from '@/tests/fixtures';
import type { TestCase } from '@/tests/trpc-helpers';

import {
  type ContributionNetworkSearchResult,
  type NetworkSearchResult,
  searchHeatNetworksForContribution,
  searchNetworkOperators,
  searchNetworks,
} from './service';

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

// Extension de Chaleur Nord : porte le SNCU de son RC parent (copie maintenue par la sync)
const futurEst: NetworkSearchResult = {
  gestionnaire: 'IDEX',
  id_fcu: 2001,
  identifiant_reseau: '1101C',
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
        'Identifiant reseau': futurEst.identifiant_reseau,
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
    { expectedOutput: [chaleurNord, futurEst], input: '1101C', label: 'matche le RC et son extension par le SNCU partagé' },
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

describe('searchHeatNetworksForContribution()', () => {
  const classedHeatNetwork: ContributionNetworkSearchResult = {
    gestionnaire: 'Dalkia',
    id_fcu: 4001,
    identifiant_reseau: '3301C',
    is_classe: true,
    localisation: 'Bordeaux, Mérignac',
    maitre_ouvrage: 'Bordeaux Métropole',
    nom_reseau: 'Contribution chaleur classée',
  };

  const unclassedHeatNetwork: ContributionNetworkSearchResult = {
    gestionnaire: 'ENGIE Solutions',
    id_fcu: 4002,
    identifiant_reseau: '3302C',
    is_classe: false,
    localisation: 'Pessac',
    maitre_ouvrage: 'Ville de Pessac',
    nom_reseau: 'Contribution chaleur non classée',
  };

  beforeAll(async () => {
    await cleanDatabase();

    await Promise.all([
      seedReseauDeChaleur({
        communes: ['Bordeaux', 'Mérignac'],
        Gestionnaire: classedHeatNetwork.gestionnaire,
        'Identifiant reseau': classedHeatNetwork.identifiant_reseau,
        id_fcu: classedHeatNetwork.id_fcu,
        MO: classedHeatNetwork.maitre_ouvrage,
        nom_reseau: classedHeatNetwork.nom_reseau,
        ouvert_aux_raccordements: true,
        'reseaux classes': true,
      }),
      seedReseauDeChaleur({
        communes: ['Pessac'],
        Gestionnaire: unclassedHeatNetwork.gestionnaire,
        'Identifiant reseau': unclassedHeatNetwork.identifiant_reseau,
        id_fcu: unclassedHeatNetwork.id_fcu,
        MO: unclassedHeatNetwork.maitre_ouvrage,
        nom_reseau: unclassedHeatNetwork.nom_reseau,
        ouvert_aux_raccordements: true,
        'reseaux classes': false,
      }),
      seedReseauDeFroid({
        communes: ['Bordeaux'],
        Gestionnaire: 'Dalkia',
        'Identifiant reseau': '3303F',
        id_fcu: 4003,
        MO: 'Bordeaux Métropole',
        nom_reseau: 'Contribution froid',
      }),
      seedZoneEtReseauEnConstruction({
        gestionnaire: 'IDEX',
        id_fcu: 4004,
        is_zone: false,
        nom_reseau: 'Contribution futur réseau',
        ouvert_aux_raccordements: false,
      }),
    ]);
  });

  const cases: TestCase<string, ContributionNetworkSearchResult[]>[] = [
    {
      expectedOutput: [classedHeatNetwork, unclassedHeatNetwork],
      input: '330',
      label: 'matche uniquement les réseaux de chaleur par identifiant SNCU',
    },
    { expectedOutput: [classedHeatNetwork], input: '3301c', label: 'matche un identifiant SNCU sans tenir compte de la casse' },
    { expectedOutput: [], input: 'Contribution', label: 'ne cherche pas dans le nom du réseau' },
    { expectedOutput: [], input: '4004', label: 'ignore les réseaux en construction' },
  ];

  it.each(cases)('$label', async ({ input, expectedOutput }) => {
    expect(await searchHeatNetworksForContribution(input)).toStrictEqual(expectedOutput);
  });
});
