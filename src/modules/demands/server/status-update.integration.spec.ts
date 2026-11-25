import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmailTemplate } from '@/modules/email';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedDemandeChaleurRenouvelable, seedProEligibilityTestsAddress, seedTableUser } from '@/tests/fixtures';
import { createMockContext, testUsers } from '@/tests/trpc-helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { demandLockReasons, type UnrealizableReason } from '../constants';
import { updateDemandByAdmin } from './admin-operations';
import { listDemands, updateDemandByGestionnaire } from './gestionnaire-operations';

const adminUserId = testUsers.admin.id!;
const gestionnaireUserId = testUsers.gestionnaire.id!;
const collectiviteUserId = testUsers.collectivite.id!;
const networkId = 7501;

const unrealizableUpdate = {
  Status: DEMANDE_STATUS.UNREALISABLE,
  unrealizable_detail: 'Réseau à 450 m',
  unrealizable_reason: 'batiment_trop_eloigne',
} as const;

const unrealizableEmailCall = (demandId: string) => [
  'demands.demandeur.raccordement-non-realisable',
  { email: 'demandeur@example.fr', id: demandId },
  { address: '10 Rue de Rivoli 75001 Paris', originDemandId: demandId },
];

const sentEmail = vi.mocked(sendEmailTemplate);

async function seedDemand(status: DEMANDE_STATUS = DEMANDE_STATUS.TO_PROCESS, unrealizableReason: UnrealizableReason | null = null) {
  const [demand] = await kdb
    .insertInto('demands')
    .values({
      deleted_at: null,
      legacy_values: JSON.stringify({
        Adresse: '10 Rue de Rivoli 75001 Paris',
        'Date de la demande': '2026-09-01T12:00:00.000Z',
        Logement: 25,
        Mail: 'demandeur@example.fr',
        Status: status,
      }),
      network_id: networkId,
      network_type: 'reseau_de_chaleur',
      unrealizable_detail: unrealizableReason ? 'Précision initiale' : null,
      unrealizable_reason: unrealizableReason,
      validated: true,
    })
    .returningAll()
    .execute();
  await seedProEligibilityTestsAddress({ demand_id: demand.id, source_address: '10 Rue de Rivoli 75001 Paris' });
  return demand;
}

const getUnrealizableReason = (demandId: string) =>
  kdb.selectFrom('demands').select(['unrealizable_detail', 'unrealizable_reason']).where('id', '=', demandId).executeTakeFirstOrThrow();

async function getUnrealizableEmailEventCount(demandId: string) {
  const result = await kdb
    .selectFrom('events')
    .select(kdb.fn.count<number>('id').as('count'))
    .where('context_id', '=', demandId)
    .where('context_type', '=', 'demand')
    .where('type', '=', 'demand_unrealizable_email_sent')
    .executeTakeFirstOrThrow();

  return result.count;
}

describe('demand status updates', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([
      { id: adminUserId, role: 'admin' },
      { id: gestionnaireUserId, role: 'gestionnaire' },
      { id: collectiviteUserId, role: 'collectivite' },
    ]);
    await kdb
      .insertInto('user_permissions')
      .values(
        [gestionnaireUserId, collectiviteUserId].map((userId) => ({
          resource_id: String(networkId),
          type: 'reseau_de_chaleur' as const,
          user_id: userId,
        }))
      )
      .execute();
    sentEmail.mockClear();
  });

  it('envoie un email au demandeur quand un admin classe une demande en Non réalisable', async () => {
    const demand = await seedDemand();

    await updateDemandByAdmin(demand.id, unrealizableUpdate, adminUserId);

    expect(sentEmail.mock.calls).toStrictEqual([unrealizableEmailCall(demand.id)]);
    expect(await getUnrealizableEmailEventCount(demand.id)).toStrictEqual(1);
    expect(await getUnrealizableReason(demand.id)).toStrictEqual({
      unrealizable_detail: 'Réseau à 450 m',
      unrealizable_reason: 'batiment_trop_eloigne',
    });

    const updatedDemand = await kdb.selectFrom('demands').select('deleted_at').where('id', '=', demand.id).executeTakeFirstOrThrow();
    expect(updatedDemand.deleted_at).toStrictEqual(null);
  });

  it.each([
    ['gestionnaire', testUsers.gestionnaire],
    ['collectivité ayant la permission sur le réseau', testUsers.collectivite],
  ])('enregistre le motif et envoie un email au demandeur quand un compte %s classe une demande en Non réalisable', async (_, user) => {
    const demand = await seedDemand();

    await updateDemandByGestionnaire(createMockContext(user), demand.id, unrealizableUpdate);

    expect(sentEmail.mock.calls).toStrictEqual([unrealizableEmailCall(demand.id)]);
    expect(await getUnrealizableEmailEventCount(demand.id)).toStrictEqual(1);
    expect(await getUnrealizableReason(demand.id)).toStrictEqual({
      unrealizable_detail: 'Réseau à 450 m',
      unrealizable_reason: 'batiment_trop_eloigne',
    });
  });

  it('refuse le passage en Non réalisable sans motif et laisse la demande inchangée', async () => {
    const demand = await seedDemand();

    await expect(
      updateDemandByGestionnaire(createMockContext(testUsers.gestionnaire), demand.id, { Status: DEMANDE_STATUS.UNREALISABLE })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(updateDemandByAdmin(demand.id, { Status: DEMANDE_STATUS.UNREALISABLE }, adminUserId)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });

    const unchangedDemand = await kdb.selectFrom('demands').select('legacy_values').where('id', '=', demand.id).executeTakeFirstOrThrow();
    expect(unchangedDemand.legacy_values.Status).toStrictEqual(DEMANDE_STATUS.TO_PROCESS);
    expect(sentEmail.mock.calls).toStrictEqual([]);
  });

  it('enregistre le motif sans envoyer d’email pour une demande erronée ou doublon', async () => {
    const demand = await seedDemand();

    await updateDemandByGestionnaire(createMockContext(testUsers.gestionnaire), demand.id, {
      Status: DEMANDE_STATUS.UNREALISABLE,
      unrealizable_detail: '',
      unrealizable_reason: 'demande_erronee',
    });

    expect(sentEmail.mock.calls).toStrictEqual([]);
    expect(await getUnrealizableEmailEventCount(demand.id)).toStrictEqual(0);
    expect(await getUnrealizableReason(demand.id)).toStrictEqual({ unrealizable_detail: null, unrealizable_reason: 'demande_erronee' });
  });

  it('vide le motif quand la demande quitte le statut Non réalisable', async () => {
    const demand = await seedDemand(DEMANDE_STATUS.UNREALISABLE, 'rentabilite_insuffisante');

    await updateDemandByGestionnaire(createMockContext(testUsers.gestionnaire), demand.id, { Status: DEMANDE_STATUS.RECONTACTED });

    expect(await getUnrealizableReason(demand.id)).toStrictEqual({ unrealizable_detail: null, unrealizable_reason: null });
  });

  it('conserve le motif lors d’une mise à jour qui ne change pas le statut', async () => {
    const demand = await seedDemand(DEMANDE_STATUS.UNREALISABLE, 'rentabilite_insuffisante');

    await updateDemandByGestionnaire(createMockContext(testUsers.gestionnaire), demand.id, { comment_gestionnaire: 'TRI à 14 ans' });

    expect(await getUnrealizableReason(demand.id)).toStrictEqual({
      unrealizable_detail: 'Précision initiale',
      unrealizable_reason: 'rentabilite_insuffisante',
    });
  });

  it('n’envoie pas de nouvel email si la demande était déjà Non réalisable', async () => {
    const demand = await seedDemand(DEMANDE_STATUS.UNREALISABLE);

    await updateDemandByAdmin(demand.id, { Status: DEMANDE_STATUS.UNREALISABLE }, adminUserId);

    expect(sentEmail.mock.calls).toStrictEqual([]);
    expect(await getUnrealizableEmailEventCount(demand.id)).toStrictEqual(0);
  });

  it('n’envoie pas d’email lors d’un autre changement de statut', async () => {
    const demand = await seedDemand();

    await updateDemandByAdmin(demand.id, { Status: DEMANDE_STATUS.RECONTACTED }, adminUserId);

    expect(sentEmail.mock.calls).toStrictEqual([]);
    expect(await getUnrealizableEmailEventCount(demand.id)).toStrictEqual(0);
  });

  it('verrouille la modification gestionnaire après création d’une demande chaleur renouvelable liée', async () => {
    const demand = await seedDemand(DEMANDE_STATUS.UNREALISABLE);
    await seedDemandeChaleurRenouvelable({ origin_demand_id: demand.id });

    const context = createMockContext(testUsers.gestionnaire);
    const listedDemands = await listDemands(context);

    expect(listedDemands.find((listedDemand) => listedDemand.id === demand.id)?.lock_reason).toStrictEqual('fcr_demande_created');
    await expect(updateDemandByGestionnaire(context, demand.id, { Status: DEMANDE_STATUS.RECONTACTED })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: demandLockReasons.fcr_demande_created.errorMessage,
    });
  });
});
