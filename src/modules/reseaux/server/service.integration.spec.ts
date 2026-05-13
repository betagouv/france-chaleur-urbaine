import { beforeAll, describe, expect, it } from 'vitest';

import { cleanDatabase, seedReseauDeChaleur, seedZoneEtReseauEnConstruction } from '@/tests/fixtures';
import type { TestCase } from '@/tests/trpc-helpers';

import { type NetworkSearchResult, searchNetworks } from './service';

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

    await seedReseauDeChaleur({
      Gestionnaire: chaleurNord.gestionnaire,
      'Identifiant reseau': chaleurNord.identifiant_reseau,
      id_fcu: chaleurNord.id_fcu,
      nom_reseau: chaleurNord.nom_reseau,
      ouvert_aux_raccordements: true,
      tags: [],
    });
    await seedReseauDeChaleur({
      Gestionnaire: chaleurSud.gestionnaire,
      'Identifiant reseau': chaleurSud.identifiant_reseau,
      id_fcu: chaleurSud.id_fcu,
      nom_reseau: chaleurSud.nom_reseau,
      ouvert_aux_raccordements: true,
      tags: [],
    });

    await seedZoneEtReseauEnConstruction({
      gestionnaire: futurEst.gestionnaire,
      id_fcu: futurEst.id_fcu,
      is_zone: false,
      nom_reseau: futurEst.nom_reseau,
      ouvert_aux_raccordements: false,
      tags: [],
    });
    await seedZoneEtReseauEnConstruction({
      gestionnaire: zoneOuest.gestionnaire,
      id_fcu: zoneOuest.id_fcu,
      is_zone: true,
      nom_reseau: zoneOuest.nom_reseau,
      ouvert_aux_raccordements: false,
      tags: [],
    });
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
