import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateDemandInput } from '@/modules/demands/constants';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedProEligibilityTestsAddress, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';

// Mock external dependencies
vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/services/addresseInformation', () => ({
  getDetailedEligibilityStatus: vi.fn().mockResolvedValue({
    basedOnIris: false,
    city: 'Paris',
    closestNetwork: null,
    closestNetworkDistance: null,
    eligibleDistance: 50,
    futurNetwork: null,
    futurNetworkDistance: null,
    gestionnaires: ['Paris'],
    id_fcu: 7501,
    inPDP: false,
    inZDP: false,
    isEligible: true,
    nearestNetwork: {
      'Identifiant reseau': '7501C',
      id_fcu: 7501,
      nom_reseau: 'CPCU',
    },
    nearestNetworkDistance: 45,
    reseaux: [],
    type: 'reseau_existant_proche',
  }),
}));

vi.mock('@/server/services/api-adresse', () => ({
  getBANAddressFromAddress: vi.fn().mockResolvedValue({
    address: '10 Rue de Rivoli 75001 Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    result_city: 'Paris',
    result_label: '10 Rue de Rivoli 75001 Paris',
    result_score: 0.95,
    result_status: 'ok' as const,
  }),
  getBANAddressFromCoordinates: vi.fn().mockResolvedValue({
    address: '48.8566,2.3522',
    latitude: 48.8566,
    longitude: 2.3522,
    result_city: 'Paris',
    result_label: '10 Rue de Rivoli 75001 Paris',
    result_score: 0.95,
    result_status: 'ok' as const,
  }),
}));

import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
// Import after mocks
import * as demandsService from './demands-service';

const testUserId = uuid(100);

const createValidDemandInput = (overrides: Partial<CreateDemandInput> = {}): CreateDemandInput => ({
  address: '10 Rue de Rivoli 75001 Paris',
  city: 'Paris',
  company: '',
  companyType: '',
  coords: { lat: 48.8566, lon: 2.3522 },
  demandCompanyName: '',
  demandCompanyType: '',
  department: 'Paris',
  eligibility: { distance: 45, inPDP: false, isEligible: true },
  email: 'test@example.com',
  firstName: 'Jean',
  heatingEnergy: 'gaz',
  heatingType: 'collectif',
  lastName: 'Dupont',
  phone: '',
  postcode: '75001',
  region: 'Île-de-France',
  structure: 'Copropriété',
  termOfUse: true,
  ...overrides,
});

describe('demands-service integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([{ id: testUserId }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create()', () => {
    it('crée une demande avec adresse de test, eligibility_history et événement', async () => {
      const input = createValidDemandInput();

      const result = await demandsService.create(input, { userId: testUserId });

      // Verify demand
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      const demandInDb = await kdb.selectFrom('demands').selectAll().where('id', '=', result.id).executeTakeFirst();
      expect(demandInDb).toBeDefined();
      expect(demandInDb?.user_id).toBe(testUserId);

      // Verify test address is created and linked
      const testAddress = await kdb
        .selectFrom('pro_eligibility_tests_addresses')
        .selectAll()
        .where('demand_id', '=', result.id)
        .executeTakeFirst();

      expect(testAddress).toBeDefined();
      expect(testAddress?.demand_id).toBe(result.id);
      expect(testAddress?.source_address).toBe(input.address);

      // Verify eligibility_history
      expect(testAddress?.eligibility_history).toBeDefined();
      const history = testAddress?.eligibility_history as ProEligibilityTestHistoryEntry[];
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].transition).toBe('initial');
      expect(history[0].calculated_at).toBeDefined();

      // Verify event
      const event = await kdb
        .selectFrom('events')
        .selectAll()
        .where('context_id', '=', result.id)
        .where('context_type', '=', 'demand')
        .where('type', '=', 'demand_created')
        .executeTakeFirst();

      expect(event).toBeDefined();
      expect(event?.context_id).toBe(result.id);
    });

    it('stocke les legacy_values avec les bonnes données', async () => {
      const input = createValidDemandInput({
        email: 'marie.martin@test.fr',
        firstName: 'Marie',
        heatingEnergy: 'fioul', // lowercase to match formatHeatingEnergyToAirtable
        lastName: 'Martin',
        structure: 'Tertiaire',
      });

      const result = await demandsService.create(input, { userId: testUserId });

      const demandInDb = await kdb.selectFrom('demands').selectAll().where('id', '=', result.id).executeTakeFirst();

      const legacyValues = demandInDb?.legacy_values as Record<string, unknown>;

      expect(legacyValues.Mail).toBe('marie.martin@test.fr');
      expect(legacyValues.Prénom).toBe('Marie');
      expect(legacyValues.Nom).toBe('Martin');
      expect(legacyValues.Structure).toBe('Tertiaire');
      expect(legacyValues['Mode de chauffage']).toBe('Fioul');
      expect(legacyValues.Adresse).toBe(input.address);
      expect(legacyValues.Ville).toBe('Paris');
    });

    it('crée une demande sans userId (utilisateur anonyme)', async () => {
      const input = createValidDemandInput();

      const result = await demandsService.create(input);

      expect(result).toBeDefined();

      const demandInDb = await kdb.selectFrom('demands').selectAll().where('id', '=', result.id).executeTakeFirst();

      expect(demandInDb?.user_id).toBeNull();
    });

    it('associe une demande à une adresse de test existante', async () => {
      const input = createValidDemandInput();

      // First create a test address without a demand
      const existingTestAddress = await seedProEligibilityTestsAddress({
        source_address: input.address,
      });

      // Create demand with existing test address
      const result = await demandsService.create(input, {
        pro_eligibility_tests_addresse_id: existingTestAddress.id,
        userId: testUserId,
      });

      // Verify the existing test address was linked (not a new one created)
      const linkedAddress = await kdb
        .selectFrom('pro_eligibility_tests_addresses')
        .selectAll()
        .where('id', '=', existingTestAddress.id)
        .executeTakeFirst();

      expect(linkedAddress?.demand_id).toBe(result.id);

      // Verify only one test address exists for this demand
      const allAddresses = await kdb.selectFrom('pro_eligibility_tests_addresses').selectAll().where('demand_id', '=', result.id).execute();

      expect(allAddresses.length).toBe(1);
    });

    it('retourne haut_potentiel=true pour une demande Collectif avec >= 100 logements', async () => {
      const input = createValidDemandInput({
        heatingType: 'collectif', // lowercase to match formatHeatingTypeToAirtable
        nbLogements: 150, // >= 100 satisfies the condition
      });

      const result = await demandsService.create(input, { userId: testUserId });

      // The result is augmented with haut_potentiel
      expect(result.haut_potentiel).toBe(true);
    });

    it('retourne haut_potentiel=true pour une demande Collectif + Tertiaire', async () => {
      const input = createValidDemandInput({
        heatingType: 'collectif', // lowercase - required for haut_potentiel
        structure: 'Tertiaire',
      });

      const result = await demandsService.create(input, { userId: testUserId });

      expect(result.haut_potentiel).toBe(true);
    });

    it('utilise nbLogements fourni au lieu de le récupérer', async () => {
      const input = createValidDemandInput({
        nbLogements: 150,
      });

      const result = await demandsService.create(input, { userId: testUserId });

      const demandInDb = await kdb.selectFrom('demands').selectAll().where('id', '=', result.id).executeTakeFirst();

      const legacyValues = demandInDb?.legacy_values as Record<string, unknown>;
      expect(legacyValues.Logement).toBe(150);
    });
  });

  describe('get()', () => {
    it('récupère une demande avec son adresse de test', async () => {
      const input = createValidDemandInput();
      const created = await demandsService.create(input, { userId: testUserId });

      const result = await demandsService.get(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.testAddress).toBeDefined();
    });

    it('retourne undefined pour une demande inexistante', async () => {
      const result = await demandsService.get(uuid(99999));

      expect(result).toBeUndefined();
    });
  });

  describe('remove()', () => {
    it('supprime une demande de la base de données', async () => {
      const input = createValidDemandInput();
      const created = await demandsService.create(input, { userId: testUserId });

      await demandsService.remove(created.id, testUserId);

      const demandInDb = await kdb.selectFrom('demands').selectAll().where('id', '=', created.id).executeTakeFirst();

      // Hard delete - record should not exist
      expect(demandInDb).toBeUndefined();
    });

    it('crée un événement demand_deleted', async () => {
      const input = createValidDemandInput();
      const created = await demandsService.create(input, { userId: testUserId });

      await demandsService.remove(created.id, testUserId);

      const event = await kdb
        .selectFrom('events')
        .selectAll()
        .where('context_id', '=', created.id)
        .where('context_type', '=', 'demand')
        .where('type', '=', 'demand_deleted')
        .executeTakeFirst();

      expect(event).toBeDefined();
    });
  });
});
