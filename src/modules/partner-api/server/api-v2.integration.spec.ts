import type { InsertObject } from 'kysely';
import type { NextApiRequest, NextApiResponse } from 'next';
import { beforeAll, describe, expect, it } from 'vitest';

import { createCredential, createOrganization } from '@/modules/organizations/server/service';
import type { DB } from '@/server/db/kysely';
import { kdb } from '@/server/db/kysely';
import { requiredAuthenticationError } from '@/server/helpers/server';
import { cleanDatabase, seedReseauDeChaleur, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';

import type { DemandDTO } from '../schema';
import { authenticatePartner, type PartnerAuth } from './authentication';
import { listDemands, patchDemand } from './handlers';

const ADMIN_ID = uuid(900);
const NETWORK_A = 700; // réseau rattaché à l'organisation
const NETWORK_B = 800; // réseau NON rattaché

const DEMAND_VISIBLE_OLD = uuid(1);
const DEMAND_VISIBLE_NEW = uuid(2);
const DEMAND_OTHER_ORG = uuid(3);
const DEMAND_NOT_VALIDATED = uuid(4);

const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_OLD = new Date('2026-01-10T00:00:00.000Z');
const UPDATED_NEW = new Date('2026-06-15T00:00:00.000Z');

const ORGANIZATION_NAME = 'CRM Partenaire';

let auth: PartnerAuth;
let token: string;

// L'API v2 est une route REST (hors tRPC) : on appelle les handlers avec des req/res Next mockés.
const mockRequest = (over: Partial<NextApiRequest>) => ({ body: {}, headers: {}, query: {}, ...over }) as unknown as NextApiRequest;

const createMockResponse = () => {
  const state = { body: undefined as unknown, statusCode: 200 };
  const response = {
    json: (body: unknown) => {
      state.body = body;
      return response;
    },
    status: (statusCode: number) => {
      state.statusCode = statusCode;
      return response;
    },
  };
  return { response: response as unknown as NextApiResponse, state };
};

const DEMAND_DEFAULTS = {
  created_at: CREATED_AT,
  legacy_values: JSON.stringify({ Status: 'À traiter' }),
  network_id: NETWORK_A,
  network_type: 'reseau_de_chaleur',
  updated_at: UPDATED_OLD,
  validated: true,
} satisfies InsertObject<DB, 'demands'>;

const seedDemand = (overrides: Partial<InsertObject<DB, 'demands'>>) =>
  kdb
    .insertInto('demands')
    .values({ ...DEMAND_DEFAULTS, ...overrides })
    .execute();

/** DTO attendu pour une demande seedée au minimum : tout à null sauf le réseau affecté et le statut. */
const expectedDemande = (over: Pick<DemandDTO, 'id' | 'date_creation' | 'date_modification'> & Partial<DemandDTO>): DemandDTO => ({
  batiment: {
    energie_chauffage: null,
    etablissement: null,
    nombre_logements: null,
    surface_m2: null,
    type_chauffage: null,
    type_structure: null,
  },
  commentaire: null,
  contact: { email: null, nom: null, prenom: null, telephone: null },
  eligibilite: { dans_pdp: false, distance_reseau_m: null, eligible: false },
  localisation: {
    adresse: null,
    code_postal: null,
    commune_code: null,
    commune_label: null,
    departement_code: null,
    departement_label: null,
    latitude: null,
    longitude: null,
    region_code: null,
    region_label: null,
  },
  reseau: { id_fcu: NETWORK_A, identifiant_sncu: '7501C', nom: 'Réseau Test', type: 'reseau_de_chaleur' },
  statut: 'a_traiter',
  ...over,
});

describe('API v2 partenaire (/api/v2/demands)', () => {
  beforeAll(async () => {
    await cleanDatabase();
    // cleanDatabase ne purge pas les tables organisations → on le fait ici (credentials d'abord : FK).
    await kdb.deleteFrom('organization_api_credentials').execute();
    await kdb.deleteFrom('organizations').execute();

    await seedTableUser([{ email: 'admin@test.local', id: ADMIN_ID, role: 'admin' }]);

    const organization = await createOrganization({ name: ORGANIZATION_NAME }, ADMIN_ID);
    const credential = await createCredential(organization.id, 'CRM token');
    token = credential.token;
    auth = { credentialId: credential.id, organizationId: organization.id, organizationName: ORGANIZATION_NAME };

    // Réseaux indépendants entre eux → en parallèle (le rattaché référence l'org déjà créée).
    await Promise.all([
      seedReseauDeChaleur({
        'Identifiant reseau': '7501C',
        id_fcu: NETWORK_A,
        nom_reseau: 'Réseau Test',
        organization_id: organization.id,
        ouvert_aux_raccordements: true,
      }),
      seedReseauDeChaleur({
        'Identifiant reseau': '8802C',
        id_fcu: NETWORK_B,
        nom_reseau: 'Réseau Autre',
        organization_id: null,
        ouvert_aux_raccordements: true,
      }),
    ]);

    // Demandes indépendantes (pas de FK entre elles) → en parallèle.
    // 2 visibles (réseau rattaché, validées) + 2 exclues (autre org / non validée).
    await Promise.all([
      seedDemand({
        id: DEMAND_VISIBLE_OLD,
        legacy_values: JSON.stringify({ Mail: 'prospect@example.com', Status: 'À traiter' }),
        updated_at: UPDATED_OLD,
      }),
      seedDemand({ id: DEMAND_VISIBLE_NEW, updated_at: UPDATED_NEW }),
      seedDemand({ id: DEMAND_OTHER_ORG, network_id: NETWORK_B, updated_at: UPDATED_NEW }),
      seedDemand({ id: DEMAND_NOT_VALIDATED, updated_at: UPDATED_NEW, validated: false }),
    ]);
  });

  describe('authentification', () => {
    it("résout l'organisation pour un token valide", async () => {
      const result = await authenticatePartner(mockRequest({ headers: { authorization: `Bearer ${token}` } }));
      expect(result).toStrictEqual(auth);
    });

    it('rejette une requête sans token (401)', async () => {
      await expect(authenticatePartner(mockRequest({ headers: {} }))).rejects.toBe(requiredAuthenticationError);
    });

    it('rejette un token invalide (401)', async () => {
      await expect(authenticatePartner(mockRequest({ headers: { authorization: 'Bearer fcu_invalide' } }))).rejects.toBe(
        requiredAuthenticationError
      );
    });
  });

  describe('listing des demandes', () => {
    it("ne renvoie que les demandes validées des réseaux de l'organisation, triées par date de modification croissante", async () => {
      const result = await listDemands(mockRequest({ query: {} }), createMockResponse().response, auth);

      expect(result).toStrictEqual([
        expectedDemande({
          contact: { email: 'prospect@example.com', nom: null, prenom: null, telephone: null },
          date_creation: '2026-01-01T00:00:00.000Z',
          date_modification: '2026-01-10T00:00:00.000Z',
          id: DEMAND_VISIBLE_OLD,
        }),
        expectedDemande({
          date_creation: '2026-01-01T00:00:00.000Z',
          date_modification: '2026-06-15T00:00:00.000Z',
          id: DEMAND_VISIBLE_NEW,
        }),
      ]);
    });
  });

  describe('filtre updated_since', () => {
    it('ne renvoie que les demandes modifiées depuis la borne (inclusive)', async () => {
      const result = await listDemands(
        mockRequest({ query: { updated_since: '2026-06-15T00:00:00.000Z' } }),
        createMockResponse().response,
        auth
      );

      expect(result).toStrictEqual([
        expectedDemande({
          date_creation: '2026-01-01T00:00:00.000Z',
          date_modification: '2026-06-15T00:00:00.000Z',
          id: DEMAND_VISIBLE_NEW,
        }),
      ]);
    });
  });

  describe("mise à jour d'une demande (PATCH)", () => {
    it('met à jour le statut et le commentaire, et renvoie le DTO relu en base', async () => {
      const result = await patchDemand(
        mockRequest({ body: { commentaire: 'RDV pris', statut: 'recontacte' }, query: { id: DEMAND_VISIBLE_OLD } }),
        createMockResponse().response,
        auth
      );

      expect(result).not.toBeNull();
      expect(result).toStrictEqual(
        expectedDemande({
          commentaire: 'RDV pris',
          contact: { email: 'prospect@example.com', nom: null, prenom: null, telephone: null },
          date_creation: '2026-01-01T00:00:00.000Z',
          date_modification: result?.date_modification ?? '', // horodatage courant (now()), non déterministe
          id: DEMAND_VISIBLE_OLD,
          statut: 'recontacte',
        })
      );
    });

    it("renvoie 404 (sans divulgation) pour une demande hors périmètre de l'organisation", async () => {
      const { response, state } = createMockResponse();

      const result = await patchDemand(mockRequest({ body: { statut: 'recontacte' }, query: { id: DEMAND_OTHER_ORG } }), response, auth);

      expect(result).toBeNull();
      expect(state.statusCode).toBe(404);
    });
  });
});
