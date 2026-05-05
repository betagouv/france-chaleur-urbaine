import { TRPCError } from '@trpc/server';
import type { User } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PendingAssignmentChange } from '@/modules/demands/types';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, createLineGeometry, seedProEligibilityTestsAddress, seedReseauDeChaleur, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { changeDemandAssignment, rejectDemandAssignmentChangeRequest } from './admin-operations';
import { cancelDemandAssignmentChangeRequest, requestDemandAssignmentChange } from './gestionnaire-operations';

const PARIS = { lat: 48.8566, lon: 2.3522 };
const adminId = testUsers.admin.id!;
const gestionnaireId = testUsers.gestionnaire.id!;

async function seedAffectedDemand({
  networkIdFcu,
  networkType,
}: {
  networkIdFcu: number | null;
  networkType: 'reseau_de_chaleur' | 'reseau_en_construction' | null;
}) {
  const [demand] = await kdb
    .insertInto('demands')
    .values({
      legacy_values: JSON.stringify({}),
      network_id: networkIdFcu,
      network_type: networkType,
    })
    .returningAll()
    .execute();
  await seedProEligibilityTestsAddress({ demand_id: demand.id, source_address: '10 Rue de Rivoli 75001 Paris' });
  return demand;
}

async function setupNetwork(idFcu: number) {
  await seedReseauDeChaleur({
    geom: createLineGeometry(PARIS.lon, PARIS.lat, 200),
    has_trace: true,
    id_fcu: idFcu,
    ouvert_aux_raccordements: true,
    tags: [],
  });
}

async function getPending(demandId: string): Promise<PendingAssignmentChange | null> {
  const row = await kdb.selectFrom('demands').select('pending_assignment_change').where('id', '=', demandId).executeTakeFirstOrThrow();
  return (row.pending_assignment_change as PendingAssignmentChange | null) ?? null;
}

async function getLastEvent(demandId: string, type: string) {
  return await kdb
    .selectFrom('events')
    .selectAll()
    .where('context_id', '=', demandId)
    .where('context_type', '=', 'demand')
    .where('type', '=', type as any)
    .orderBy('created_at', 'desc')
    .executeTakeFirst();
}

describe('désaffectation / réaffectation flow', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([
      { id: adminId, role: 'admin' },
      { id: gestionnaireId, role: 'gestionnaire' },
    ]);
  });

  describe('admin: changeDemandAssignment()', () => {
    it('désaffecte une demande (null, null) et trace un événement avec new.network_id null', async () => {
      await setupNetwork(100);
      const demand = await seedAffectedDemand({ networkIdFcu: 100, networkType: 'reseau_de_chaleur' });

      const result = await changeDemandAssignment(demand.id, null, null, adminId);

      expect(result).toStrictEqual({ distance: null });

      const updated = await kdb
        .selectFrom('demands')
        .select(['network_id', 'network_type', 'legacy_values'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow();
      expect(updated.network_id).toBeNull();
      expect(updated.network_type).toBeNull();
      expect(updated.legacy_values['Nom réseau']).toBeNull();
      expect(updated.legacy_values['Identifiant réseau']).toBeNull();
      expect(updated.legacy_values['Distance au réseau']).toBeNull();

      const event = await getLastEvent(demand.id, 'demand_assignment_changed');
      expect(event).toBeDefined();
      expect((event!.data as any).new.network_id).toBeNull();
      expect((event!.data as any).new.network_type).toBeNull();
      expect((event!.data as any).old.network_id).toBe(100);
    });

    it('efface le pending_assignment_change lors de la désaffectation admin', async () => {
      await setupNetwork(100);
      const demand = await seedAffectedDemand({ networkIdFcu: 100, networkType: 'reseau_de_chaleur' });
      await requestDemandAssignmentChange(demand.id, null, null, 'please unassign', gestionnaireId);

      expect(await getPending(demand.id)).not.toBeNull();

      await changeDemandAssignment(demand.id, null, null, adminId);

      expect(await getPending(demand.id)).toBeNull();
    });
  });

  describe('admin: rejectDemandAssignmentChangeRequest()', () => {
    it('rejette le pending sans toucher à l affectation courante', async () => {
      await setupNetwork(100);
      const demand = await seedAffectedDemand({ networkIdFcu: 100, networkType: 'reseau_de_chaleur' });
      await requestDemandAssignmentChange(demand.id, null, null, 'please unassign', gestionnaireId);

      await rejectDemandAssignmentChangeRequest(demand.id, adminId);

      expect(await getPending(demand.id)).toBeNull();
      const row = await kdb
        .selectFrom('demands')
        .select(['network_id', 'network_type'])
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow();
      expect(row.network_id).toBe(100);
      expect(row.network_type).toBe('reseau_de_chaleur');

      const event = await getLastEvent(demand.id, 'demand_assignment_change_request_rejected');
      expect(event).toBeDefined();
    });

    it('throws BAD_REQUEST si aucun pending', async () => {
      const demand = await seedAffectedDemand({ networkIdFcu: null, networkType: null });

      await expect(rejectDemandAssignmentChangeRequest(demand.id, adminId)).rejects.toThrow(
        new TRPCError({ code: 'BAD_REQUEST', message: 'Aucune demande de réaffectation en attente' })
      );
    });
  });

  describe('gestionnaire: requestDemandAssignmentChange() — désaffectation', () => {
    it('stocke un pending avec network_id/type null + event demand_assignment_change_requested', async () => {
      await setupNetwork(100);
      const demand = await seedAffectedDemand({ networkIdFcu: 100, networkType: 'reseau_de_chaleur' });

      await requestDemandAssignmentChange(demand.id, null, null, 'comment désaffectation', gestionnaireId);

      const pending = await getPending(demand.id);
      expect(pending).toMatchObject({
        author_id: gestionnaireId,
        comment: 'comment désaffectation',
        distance: null,
        network_id: null,
        network_type: null,
      });

      const event = await getLastEvent(demand.id, 'demand_assignment_change_requested');
      expect(event).toBeDefined();
      expect((event!.data as any).new.network_id).toBeNull();
      expect((event!.data as any).new.network_type).toBeNull();
      expect((event!.data as any).comment).toBe('comment désaffectation');
    });

    it('throws BAD_REQUEST si la demande est déjà sans réseau affecté', async () => {
      const demand = await seedAffectedDemand({ networkIdFcu: null, networkType: null });

      await expect(requestDemandAssignmentChange(demand.id, null, null, null, gestionnaireId)).rejects.toThrow(
        new TRPCError({ code: 'BAD_REQUEST', message: 'La demande est déjà sans réseau affecté' })
      );
    });

    it('throws CONFLICT si un pending existe déjà', async () => {
      await setupNetwork(100);
      const demand = await seedAffectedDemand({ networkIdFcu: 100, networkType: 'reseau_de_chaleur' });
      await requestDemandAssignmentChange(demand.id, null, null, null, gestionnaireId);

      await expect(requestDemandAssignmentChange(demand.id, null, null, null, gestionnaireId)).rejects.toThrow(
        new TRPCError({ code: 'CONFLICT', message: 'Une demande de réaffectation est déjà en attente' })
      );
    });
  });

  describe('gestionnaire: cancelDemandAssignmentChangeRequest()', () => {
    it('annule son propre pending de désaffectation', async () => {
      await setupNetwork(100);
      const demand = await seedAffectedDemand({ networkIdFcu: 100, networkType: 'reseau_de_chaleur' });
      await requestDemandAssignmentChange(demand.id, null, null, 'comment', gestionnaireId);

      await cancelDemandAssignmentChangeRequest(demand.id, gestionnaireId);

      expect(await getPending(demand.id)).toBeNull();
      const event = await getLastEvent(demand.id, 'demand_assignment_change_request_cancelled');
      expect(event).toBeDefined();
    });

    it("expose l'email de l'auteur du pending dans la liste", async () => {
      await setupNetwork(100);
      const demand = await seedAffectedDemand({ networkIdFcu: 100, networkType: 'reseau_de_chaleur' });
      await requestDemandAssignmentChange(demand.id, null, null, 'comment', gestionnaireId);

      const demands = await createTestCaller(testUsers.admin).demands.gestionnaire.list();
      const listed = demands.find((d) => d.id === demand.id);
      expect(listed?.pending_assignment_author_email).toBe(`user-${gestionnaireId}@test.local`);
    });

    it('refuse l annulation par un autre utilisateur (FORBIDDEN)', async () => {
      const otherUserId = uuid(500);
      await seedTableUser([{ id: otherUserId, role: 'gestionnaire' }]);
      await setupNetwork(100);
      const demand = await seedAffectedDemand({ networkIdFcu: 100, networkType: 'reseau_de_chaleur' });
      await requestDemandAssignmentChange(demand.id, null, null, null, gestionnaireId);

      await expect(cancelDemandAssignmentChangeRequest(demand.id, otherUserId)).rejects.toThrow(
        new TRPCError({ code: 'FORBIDDEN', message: "Seul l'auteur peut annuler sa demande de réaffectation" })
      );
    });
  });

  describe('tRPC routes (validation + permissions)', () => {
    it('admin.changeAssignment: BAD_REQUEST si networkIdFcu set mais networkType null', async () => {
      const demand = await seedAffectedDemand({ networkIdFcu: null, networkType: null });

      await expect(
        createTestCaller(testUsers.admin).demands.admin.changeAssignment({
          demandId: demand.id,
          networkIdFcu: 100,
          networkType: null,
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('admin.changeAssignment: BAD_REQUEST si networkType set mais networkIdFcu null', async () => {
      const demand = await seedAffectedDemand({ networkIdFcu: null, networkType: null });

      await expect(
        createTestCaller(testUsers.admin).demands.admin.changeAssignment({
          demandId: demand.id,
          networkIdFcu: null,
          networkType: 'reseau_de_chaleur',
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('gestionnaire.requestAssignmentChange: BAD_REQUEST si networkIdFcu/networkType incohérents', async () => {
      const demand = await seedAffectedDemand({ networkIdFcu: null, networkType: null });

      await expect(
        createTestCaller(testUsers.admin).demands.gestionnaire.requestAssignmentChange({
          comment: null,
          demandId: demand.id,
          networkIdFcu: 100,
          networkType: null,
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('admin.changeAssignment: refuse un utilisateur non admin', async () => {
      const demand = await seedAffectedDemand({ networkIdFcu: null, networkType: null });

      await expect(
        createTestCaller(testUsers.gestionnaire).demands.admin.changeAssignment({
          demandId: demand.id,
          networkIdFcu: null,
          networkType: null,
        })
      ).rejects.toMatchObject(forbiddenError);
    });
  });

  describe('routes territoire (collectivite / alec)', () => {
    let demandId: string;

    beforeEach(async () => {
      await seedTableUser([
        { id: testUsers.collectivite.id, role: 'collectivite' },
        { id: testUsers.alec.id, role: 'alec' },
        { id: testUsers.particulier.id, role: 'particulier' },
      ]);
      await setupNetwork(100);
      const demand = await seedAffectedDemand({ networkIdFcu: 100, networkType: 'reseau_de_chaleur' });
      demandId = demand.id;
    });

    const requestUnassignment = (user: Partial<User>, comment: string | null = null) =>
      createTestCaller(user).demands.gestionnaire.requestAssignmentChange({
        comment,
        demandId,
        networkIdFcu: null,
        networkType: null,
      });

    it.each([
      ['collectivite', testUsers.collectivite],
      ['alec', testUsers.alec],
    ] as const)('gestionnaire.requestAssignmentChange: %s peut demander une désaffectation', async (_role, user) => {
      await requestUnassignment(user, 'mauvaise affectation');

      expect(await getPending(demandId)).toMatchObject({ author_id: user.id, comment: 'mauvaise affectation' });
    });

    it('gestionnaire.requestAssignmentChange: refuse un particulier (FORBIDDEN)', async () => {
      await expect(requestUnassignment(testUsers.particulier)).rejects.toMatchObject(forbiddenError);
    });

    it('gestionnaire.cancelAssignmentChangeRequest: collectivite peut annuler son propre pending', async () => {
      await requestDemandAssignmentChange(demandId, null, null, 'comment', testUsers.collectivite.id!);

      await createTestCaller(testUsers.collectivite).demands.gestionnaire.cancelAssignmentChangeRequest({ demandId });

      expect(await getPending(demandId)).toBeNull();
    });
  });
});
