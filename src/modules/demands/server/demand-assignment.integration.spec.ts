import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { CreateDemandInput } from '@/modules/demands/constants';
import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb, sql } from '@/server/db/kysely';
import { type EligibilityType, getDetailedEligibilityStatus } from '@/server/services/addresseInformation';
import {
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
 * constructions 3001+). `eligId` = id_fcu du réseau résolu par l'éligibilité (jamais l'id du PDP).
 * `assignment` = affectation finale attendue (affecté si eligible OU distance < 500m).
 */
const cases: { type: EligibilityType; eligId: number | null; assignment: NetworkAssignment }[] = [
  { assignment: { network_id: 2001, network_type: 'reseau_de_chaleur' }, eligId: 2001, type: 'dans_pdp_reseau_existant' },
  { assignment: { network_id: 3001, network_type: 'reseau_en_construction' }, eligId: 3001, type: 'dans_pdp_reseau_futur' },
  { assignment: { network_id: 2002, network_type: 'reseau_de_chaleur' }, eligId: 2002, type: 'reseau_existant_tres_proche' },
  { assignment: { network_id: 3003, network_type: 'reseau_en_construction' }, eligId: 3003, type: 'reseau_futur_tres_proche' },
  { assignment: { network_id: 3002, network_type: 'reseau_en_construction' }, eligId: 3002, type: 'dans_zone_reseau_futur' },
  { assignment: { network_id: 2002, network_type: 'reseau_de_chaleur' }, eligId: 2002, type: 'reseau_existant_proche' },
  { assignment: { network_id: 3003, network_type: 'reseau_en_construction' }, eligId: 3003, type: 'reseau_futur_proche' },
  // 759m ≥ 500m → non affecté
  { assignment: { network_id: null, network_type: null }, eligId: 2002, type: 'reseau_existant_loin' },
  // 956m ≥ 500m → non affecté
  { assignment: { network_id: null, network_type: null }, eligId: 3003, type: 'reseau_futur_loin' },
  // réseau sans tracé → non affecté
  { assignment: { network_id: null, network_type: null }, eligId: 2003, type: 'dans_ville_reseau_existant_sans_trace' },
  { assignment: { network_id: null, network_type: null }, eligId: null, type: 'trop_eloigne' },
];

const demandInputAt = (type: EligibilityType, coords: { lat: number; lon: number }): CreateDemandInput => ({
  address: `adresse ${type}`,
  city: 'Marseille',
  company: '',
  companyType: '',
  coords,
  demandCompanyName: '',
  demandCompanyType: '',
  department: 'Bouches-du-Rhône',
  eligibility: { distance: null, inPDP: false, isEligible: true },
  email: 'test@example.com',
  firstName: 'Jean',
  heatingEnergy: 'gaz',
  heatingType: 'collectif',
  lastName: 'Dupont',
  phone: '',
  postcode: '13000',
  region: "Provence-Alpes-Côte d'Azur",
  structure: 'Copropriété',
  termOfUse: true,
});

const getAssignment = (demandId: string): Promise<NetworkAssignment> =>
  kdb.selectFrom('demands').select(['network_id', 'network_type']).where('id', '=', demandId).executeTakeFirstOrThrow();

describe('création de demande → affectation réseau', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedEligibilityTestsData();
    await seedTableUser([{ id: testUserId }]);
  });

  describe("calcul d'éligibilité : id_fcu = réseau résolu (jamais l'id du PDP)", () => {
    it.each(cases)('$type', async ({ type, eligId }) => {
      const { lat, lon } = getTestPointCoordinates(type);
      const eligibility = await getDetailedEligibilityStatus(lat, lon);
      expect({ id_fcu: eligibility.id_fcu, type: eligibility.type }).toStrictEqual({ id_fcu: eligId, type });
    });
  });

  describe('affectation — contexte formulaire (éligibilité recalculée à la création)', () => {
    it.each(cases)('$type', async ({ type, assignment }) => {
      const coords = getTestPointCoordinates(type);
      const { id } = await createDemand(demandInputAt(type, coords), { userId: testUserId });
      expect(await getAssignment(id)).toStrictEqual(assignment);
    });
  });

  describe('affectation — contexte test en masse (adresse de test réutilisée)', () => {
    it.each(cases)('$type', async ({ type, assignment }) => {
      const coords = getTestPointCoordinates(type);
      const historyEntry = await getAddressEligibilityHistoryEntry(coords.lat, coords.lon);
      const testAddress = await seedProEligibilityTestsAddress({
        eligibility_history: JSON.stringify([historyEntry]),
        geom: sql`st_transform(st_point(${coords.lon}, ${coords.lat}, 4326), 2154)`,
        source_address: `masse ${type}`,
      });
      const { id } = await createDemand(demandInputAt(type, coords), {
        pro_eligibility_tests_addresse_id: testAddress.id,
        userId: testUserId,
      });
      expect(await getAssignment(id)).toStrictEqual(assignment);
    });
  });
});
