import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateDemandInput } from '@/modules/demands/constants';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';

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

vi.mock('@/modules/ban/server/service', () => ({
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

import * as adminOperationsService from './admin-operations';
import { createDemand } from './creation-user';

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

describe('admin-operations', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([{ id: testUserId }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('removeDemand()', () => {
    it('soft-delete une demande (deleted_at renseigné)', async () => {
      const input = createValidDemandInput();
      const created = await createDemand(input, { userId: testUserId });

      await adminOperationsService.removeDemand(created.id, testUserId);

      const demandInDb = await kdb.selectFrom('demands').selectAll().where('id', '=', created.id).executeTakeFirst();

      expect(demandInDb).toBeDefined();
      expect(demandInDb?.deleted_at).toBeInstanceOf(Date);
    });

    it('crée un événement demand_deleted', async () => {
      const input = createValidDemandInput();
      const created = await createDemand(input, { userId: testUserId });

      await adminOperationsService.removeDemand(created.id, testUserId);

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
