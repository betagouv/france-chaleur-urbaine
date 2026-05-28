import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb, sql } from '@/server/db/kysely';
import { type EligibilityType, getDetailedEligibilityStatus } from '@/server/services/addresseInformation';
import {
  buildDemandInput,
  cleanDatabase,
  getTestPointCoordinates,
  seedEligibilityTestsData,
  seedProEligibilityTestsAddress,
  seedTableUser,
} from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

// On géocode le label via la BAN mais on calcule l'éligibilité réelle (sur les coordonnées fournies)
// contre les données seedées — donc getDetailedEligibilityStatus n'est PAS mocké.
vi.mock('@/modules/ban/server/service', () => ({
  getBANAddressFromAddress: vi.fn().mockResolvedValue({
    address: 'adresse test',
    latitude: 0,
    longitude: 0,
    result_city: 'Marseille',
    result_label: 'adresse test',
    result_score: 0.95,
    result_status: 'ok' as const,
  }),
  getBANAddressFromCoordinates: vi.fn().mockResolvedValue({
    address: 'adresse test',
    latitude: 0,
    longitude: 0,
    result_city: 'Marseille',
    result_label: 'adresse test',
    result_score: 0.95,
    result_status: 'ok' as const,
  }),
}));

import { getAddressEligibilityHistoryEntry } from '@/modules/pro-eligibility-tests/server/service';

import { createDemand } from './creation-user';

const testUserId = uuid(200);

type NetworkAssignment = { network_id: number | null; network_type: NetworkType | null };

/**
 * Vérité-terrain dérivée de la fixture d'éligibilité (ids distincts : PDP 1001, réseaux 2001+,
 * constructions 3001+). `eligibilityIdFcu` = id_fcu du réseau résolu par l'éligibilité (jamais
 * l'id du PDP). `network_assignment` = affectation finale attendue (affecté si eligible OU distance < 500m).
 */
const cases: { type: EligibilityType; eligibilityIdFcu: number | null; network_assignment: NetworkAssignment }[] = [
  { eligibilityIdFcu: 2001, network_assignment: { network_id: 2001, network_type: 'reseau_de_chaleur' }, type: 'dans_pdp_reseau_existant' },
  {
    eligibilityIdFcu: 3001,
    network_assignment: { network_id: 3001, network_type: 'reseau_en_construction' },
    type: 'dans_pdp_reseau_futur',
  },
  {
    eligibilityIdFcu: 2002,
    network_assignment: { network_id: 2002, network_type: 'reseau_de_chaleur' },
    type: 'reseau_existant_tres_proche',
  },
  {
    eligibilityIdFcu: 3003,
    network_assignment: { network_id: 3003, network_type: 'reseau_en_construction' },
    type: 'reseau_futur_tres_proche',
  },
  {
    eligibilityIdFcu: 3002,
    network_assignment: { network_id: 3002, network_type: 'reseau_en_construction' },
    type: 'dans_zone_reseau_futur',
  },
  { eligibilityIdFcu: 2002, network_assignment: { network_id: 2002, network_type: 'reseau_de_chaleur' }, type: 'reseau_existant_proche' },
  { eligibilityIdFcu: 3003, network_assignment: { network_id: 3003, network_type: 'reseau_en_construction' }, type: 'reseau_futur_proche' },
  // 759m ≥ 500m → non affecté
  { eligibilityIdFcu: 2002, network_assignment: { network_id: null, network_type: null }, type: 'reseau_existant_loin' },
  // 956m ≥ 500m → non affecté
  { eligibilityIdFcu: 3003, network_assignment: { network_id: null, network_type: null }, type: 'reseau_futur_loin' },
  // réseau sans tracé → non affecté
  { eligibilityIdFcu: 2003, network_assignment: { network_id: null, network_type: null }, type: 'dans_ville_reseau_existant_sans_trace' },
  { eligibilityIdFcu: null, network_assignment: { network_id: null, network_type: null }, type: 'trop_eloigne' },
];

const creationContexts = ['formulaire', 'test en masse'] as const;
type CreationContext = (typeof creationContexts)[number];

/**
 * Crée une demande selon le contexte source :
 * - `formulaire` : éligibilité recalculée à la création (pas d'adresse de test préexistante) ;
 * - `test en masse` : adresse de test préexistante (historique frais) réutilisée.
 */
const createDemandInContext = async (context: CreationContext, type: EligibilityType, coords: { lat: number; lon: number }) => {
  const input = buildDemandInput({ address: `adresse ${type}`, coords });
  if (context === 'formulaire') {
    return createDemand(input, { userId: testUserId });
  }
  const historyEntry = await getAddressEligibilityHistoryEntry(coords.lat, coords.lon);
  const testAddress = await seedProEligibilityTestsAddress({
    eligibility_history: JSON.stringify([historyEntry]),
    geom: sql`st_transform(st_point(${coords.lon}, ${coords.lat}, 4326), 2154)`,
    source_address: `masse ${type}`,
  });
  return createDemand(input, { pro_eligibility_tests_addresse_id: testAddress.id, userId: testUserId });
};

const getAssignment = (demandId: string): Promise<NetworkAssignment> =>
  kdb.selectFrom('demands').select(['network_id', 'network_type']).where('id', '=', demandId).executeTakeFirstOrThrow();

describe('création de demande → affectation réseau', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedEligibilityTestsData();
    await seedTableUser([{ id: testUserId }]);
  });

  describe("calcul d'éligibilité : id_fcu = réseau résolu (jamais l'id du PDP)", () => {
    it.each(cases)('$type', async ({ type, eligibilityIdFcu }) => {
      const { lat, lon } = getTestPointCoordinates(type);
      const eligibility = await getDetailedEligibilityStatus(lat, lon);
      expect({ id_fcu: eligibility.id_fcu, type: eligibility.type }).toStrictEqual({ id_fcu: eligibilityIdFcu, type });
    });
  });

  describe('affectation réseau finale (par contexte de création)', () => {
    const scenarios = creationContexts.flatMap((context) => cases.map((testCase) => ({ context, ...testCase })));

    it.each(scenarios)('$context — $type', async ({ context, type, network_assignment }) => {
      const coords = getTestPointCoordinates(type);
      const { id } = await createDemandInContext(context, type, coords);
      expect(await getAssignment(id)).toStrictEqual(network_assignment);
    });
  });
});
