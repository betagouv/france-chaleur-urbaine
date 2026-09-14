import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmailTemplate } from '@/modules/email';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedProEligibilityTestsAddress, seedTableUser } from '@/tests/fixtures';
import { createMockContext, testUsers } from '@/tests/trpc-helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { updateDemandByAdmin } from './admin-operations';
import { updateDemandByGestionnaire } from './gestionnaire-operations';

const adminUserId = testUsers.admin.id!;
const gestionnaireUserId = testUsers.gestionnaire.id!;
const networkId = 7501;

const sentEmail = vi.mocked(sendEmailTemplate);

async function seedDemand(status = DEMANDE_STATUS.TO_PROCESS) {
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
      validated: true,
    })
    .returningAll()
    .execute();
  await seedProEligibilityTestsAddress({ demand_id: demand.id, source_address: '10 Rue de Rivoli 75001 Paris' });
  return demand;
}

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
    ]);
    await kdb
      .insertInto('user_permissions')
      .values({
        resource_id: String(networkId),
        type: 'reseau_de_chaleur',
        user_id: gestionnaireUserId,
      })
      .execute();
    sentEmail.mockClear();
  });

  it('envoie un email au demandeur quand un admin classe une demande en Non réalisable', async () => {
    const demand = await seedDemand();

    await updateDemandByAdmin(demand.id, { Status: DEMANDE_STATUS.UNREALISABLE }, adminUserId);

    expect(sentEmail.mock.calls).toStrictEqual([
      [
        'demands.demandeur.raccordement-non-realisable',
        { email: 'demandeur@example.fr', id: demand.id },
        { address: '10 Rue de Rivoli 75001 Paris' },
      ],
    ]);
    expect(await getUnrealizableEmailEventCount(demand.id)).toStrictEqual(1);

    const updatedDemand = await kdb.selectFrom('demands').select('deleted_at').where('id', '=', demand.id).executeTakeFirstOrThrow();
    expect(updatedDemand.deleted_at).toStrictEqual(null);
  });

  it('envoie un email au demandeur quand un gestionnaire classe une demande en Non réalisable', async () => {
    const demand = await seedDemand();

    await updateDemandByGestionnaire(createMockContext(testUsers.gestionnaire), demand.id, { Status: DEMANDE_STATUS.UNREALISABLE });

    expect(sentEmail.mock.calls).toStrictEqual([
      [
        'demands.demandeur.raccordement-non-realisable',
        { email: 'demandeur@example.fr', id: demand.id },
        { address: '10 Rue de Rivoli 75001 Paris' },
      ],
    ]);
    expect(await getUnrealizableEmailEventCount(demand.id)).toStrictEqual(1);
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
});
