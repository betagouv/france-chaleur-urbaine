import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { businessRules } from '@/modules/app/business-rules';
import { sendEmailTemplate } from '@/modules/email';
import { sharedStore } from '@/modules/security/server/rate-limit';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedDemandeChaleurRenouvelable } from '@/tests/fixtures';
import { createTestCaller, testUsers } from '@/tests/trpc-helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import { accompagnementStatusDisplays, RACCORDEMENT_NOT_VALIDATED_DISPLAY, raccordementStatusDisplays } from '../constants';

const email = 'marie.dupont@example.fr';

type RaccordementSeed = {
  address: string;
  /** Explicit: the recap sorts by created_at and consecutive inserts could share the same timestamp. */
  createdAt: string;
  status: DEMANDE_STATUS;
  validated: boolean;
  email?: string;
  deleted?: boolean;
};

const seedRaccordementDemand = (values: RaccordementSeed) =>
  kdb
    .insertInto('demands')
    .values({
      created_at: new Date(values.createdAt),
      deleted_at: values.deleted ? new Date() : null,
      legacy_values: JSON.stringify({ Adresse: values.address, Mail: values.email ?? email, Prénom: 'Marie', Status: values.status }),
      validated: values.validated,
    })
    .execute();

describe('demandTracking.request', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.mocked(sendEmailTemplate).mockClear();
    // `request` is rate-limited per IP: every test caller shares the same mock IP
    sharedStore.resetAll();
  });

  it('sends nothing and resolves when no demand matches the email', async () => {
    await expect(createTestCaller(null).demandTracking.request({ email })).resolves.toBeUndefined();

    expect(sendEmailTemplate).not.toHaveBeenCalled();
  });

  it('sends one recap with every matching demand, open first then closed, with public wording only', async () => {
    await seedRaccordementDemand({ address: '1 rue Close', createdAt: '2026-01-01', status: DEMANDE_STATUS.DONE, validated: true });
    await seedRaccordementDemand({
      address: '2 rue Ouverte',
      createdAt: '2026-02-01',
      status: DEMANDE_STATUS.RECONTACTED,
      validated: true,
    });
    await seedRaccordementDemand({
      address: '3 rue Non validée',
      createdAt: '2026-03-01',
      status: DEMANDE_STATUS.TO_PROCESS,
      validated: false,
    });
    await seedRaccordementDemand({
      address: '4 rue Supprimée',
      createdAt: '2026-04-01',
      deleted: true,
      status: DEMANDE_STATUS.TO_PROCESS,
      validated: true,
    });
    await seedRaccordementDemand({
      address: '5 rue Autre',
      createdAt: '2026-04-02',
      email: 'autre@example.fr',
      status: DEMANDE_STATUS.TO_PROCESS,
      validated: true,
    });
    await seedDemandeChaleurRenouvelable({
      address: '6 rue ENR',
      created_at: new Date('2026-05-01'),
      email: 'Marie.Dupont@Example.fr',
      first_name: 'Marie',
      status: 'Non pertinent',
    });

    await createTestCaller(testUsers.professionnel).demandTracking.request({ email: ' Marie.Dupont@example.fr ' });

    expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual([
      [
        'demands.demandeur.suivi-demande',
        { email },
        {
          demands: [
            { address: '3 rue Non validée', status: RACCORDEMENT_NOT_VALIDATED_DISPLAY, type: 'raccordement' },
            { address: '2 rue Ouverte', status: raccordementStatusDisplays[DEMANDE_STATUS.RECONTACTED], type: 'raccordement' },
            { address: '6 rue ENR', status: accompagnementStatusDisplays['Non pertinent'], type: 'accompagnement' },
            { address: '1 rue Close', status: raccordementStatusDisplays[DEMANDE_STATUS.DONE], type: 'raccordement' },
          ],
          firstName: 'Marie',
        },
      ],
    ]);
  });

  it('rejects with TOO_MANY_REQUESTS beyond the hourly cap, without sending more emails', async () => {
    await seedRaccordementDemand({ address: '1 rue Ouverte', createdAt: '2026-01-01', status: DEMANDE_STATUS.TO_PROCESS, validated: true });
    const cap = businessRules.demandTrackingEmailsPerHour.value;

    for (let attempt = 0; attempt < cap; attempt++) {
      await createTestCaller(null).demandTracking.request({ email });
    }
    await expect(createTestCaller(null).demandTracking.request({ email })).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });

    expect(sendEmailTemplate).toHaveBeenCalledTimes(cap);
  });

  it('rejects an invalid email', async () => {
    await expect(createTestCaller(null).demandTracking.request({ email: 'pas-un-email' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});
