import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import { uuid } from '@/tests/helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/modules/events/server/service', () => ({
  createEvent: vi.fn().mockResolvedValue(undefined),
}));

import { sendUnrealizableDemandEmailIfNeeded } from './unrealizable-email';

const demandId = uuid(301);
const sentEmail = vi.mocked(sendEmailTemplate);
const createdEvent = vi.mocked(createEvent);

function createDemand(status?: DEMANDE_STATUS) {
  return {
    id: demandId,
    legacy_values: {
      Adresse: '10 Rue de Rivoli 75001 Paris',
      'Date de la demande': '2026-09-01T12:00:00.000Z',
      Logement: 25,
      Mail: 'demandeur@example.fr',
      ...(status ? { Status: status } : {}),
    },
  } satisfies Parameters<typeof sendUnrealizableDemandEmailIfNeeded>[0]['currentDemand'];
}

describe('sendUnrealizableDemandEmailIfNeeded', () => {
  beforeEach(() => {
    sentEmail.mockClear();
    createdEvent.mockClear();
  });

  it('envoie l’email et trace l’événement lors du passage en Non réalisable', async () => {
    await sendUnrealizableDemandEmailIfNeeded({
      currentDemand: createDemand(DEMANDE_STATUS.TO_PROCESS),
      nextStatus: DEMANDE_STATUS.UNREALISABLE,
    });

    expect(sentEmail.mock.calls).toStrictEqual([
      [
        'demands.demandeur.raccordement-non-realisable',
        { email: 'demandeur@example.fr', id: demandId },
        { address: '10 Rue de Rivoli 75001 Paris' },
      ],
    ]);
    expect(createdEvent.mock.calls).toStrictEqual([
      [
        {
          context_id: demandId,
          context_type: 'demand',
          data: null,
          type: 'demand_unrealizable_email_sent',
        },
      ],
    ]);
  });

  it('n’envoie rien si le statut cible n’est pas Non réalisable', async () => {
    await sendUnrealizableDemandEmailIfNeeded({
      currentDemand: createDemand(DEMANDE_STATUS.TO_PROCESS),
      nextStatus: DEMANDE_STATUS.RECONTACTED,
    });

    expect(sentEmail.mock.calls).toStrictEqual([]);
    expect(createdEvent.mock.calls).toStrictEqual([]);
  });

  it('n’envoie rien si la demande était déjà Non réalisable', async () => {
    await sendUnrealizableDemandEmailIfNeeded({
      currentDemand: createDemand(DEMANDE_STATUS.UNREALISABLE),
      nextStatus: DEMANDE_STATUS.UNREALISABLE,
    });

    expect(sentEmail.mock.calls).toStrictEqual([]);
    expect(createdEvent.mock.calls).toStrictEqual([]);
  });
});
