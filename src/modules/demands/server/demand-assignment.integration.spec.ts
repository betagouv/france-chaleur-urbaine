import { beforeAll, describe, expect, it, vi } from 'vitest';

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
import { eligibilityScenarios } from '@/tests/fixtures/eligibility';
import { uuid } from '@/tests/helpers';
import { pick } from '@/utils/objects';

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

const getAssignment = (demandId: string) =>
  kdb.selectFrom('demands').select(['network_id', 'network_type']).where('id', '=', demandId).executeTakeFirstOrThrow();

describe('création de demande → affectation réseau', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedEligibilityTestsData();
    await seedTableUser([{ id: testUserId }]);
  });

  describe("calcul d'éligibilité : id_fcu = réseau résolu (jamais l'id du PDP)", () => {
    const scenarios = eligibilityScenarios.map((scenario) => ({ ...scenario, label: scenario.name ?? scenario.type }));

    it.each(scenarios)('$label', async ({ label, type, eligibility }) => {
      const { lat, lon } = getTestPointCoordinates(label);
      const result = await getDetailedEligibilityStatus(lat, lon);
      expect(pick(result, ['distance', 'eligible', 'id_fcu', 'type'])).toStrictEqual({ ...eligibility, type });
    });
  });

  describe('affectation réseau finale (par contexte de création)', () => {
    const scenarios = creationContexts.flatMap((context) =>
      eligibilityScenarios.map((scenario) => ({ context, label: scenario.name ?? scenario.type, ...scenario }))
    );

    it.each(scenarios)('$context — $label', async ({ context, label, type, assignment }) => {
      const coords = getTestPointCoordinates(label);
      const { id } = await createDemandInContext(context, type, coords);
      expect(await getAssignment(id)).toStrictEqual(assignment);
    });
  });
});
