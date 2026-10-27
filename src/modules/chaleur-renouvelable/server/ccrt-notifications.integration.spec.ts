import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmailTemplate } from '@/modules/email';
import { defaultUserPreferences, type NotificationPreferences } from '@/modules/users/constants';
import { type Insertable, kdb, type UserPermissions } from '@/server/db/kysely';
import { cleanDatabase, seedDemandeChaleurRenouvelable, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';

import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT, DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS } from '../constants';

const ccrtEmail = vi.hoisted(() => ({ isEnabled: true }));

vi.mock('@/modules/chaleur-renouvelable/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/chaleur-renouvelable/constants')>()),
  get IS_CCRT_EMAIL_ENABLED() {
    return ccrtEmail.isEnabled;
  },
}));
vi.mock('@/modules/email', () => ({ sendEmailTemplate: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/utils/network', () => ({ fetchJSON: vi.fn(), postFetchJSON: vi.fn() }));

import { notifyCcrtOfNewDemands, notifyCcrtOfUnhandledDemands } from './ccrt-notifications';

const sentMail = vi.mocked(sendEmailTemplate);

const DEPARTEMENT = '13';
const OTHER_DEPARTEMENT = '75';

const ccrtMatching = uuid(101); // perm departement:13, actif, daily + rappel → reçoit tout
const ccrtOtherDepartement = uuid(102); // perm departement:75 → ne reçoit rien
const collectiviteTerritory = uuid(103); // perm departement:13 mais rôle collectivité → ne reçoit rien
const ccrtInactive = uuid(104); // perm matchante mais active=false → ne reçoit rien
const ccrtOptedOutNew = uuid(105); // perm matchante, new_demands=none, rappel=true → reçoit unhandled, pas new
const ccrtWeekly = uuid(106); // perm matchante, new_demands=weekly, rappel=true → récapitulatif du lundi
const ccrtNetworkOnly = uuid(107); // perm réseau seulement → ne reçoit rien

// Monday 2026-10-19 10:10 Europe/Paris and the following Tuesday 09:50 / Wednesday 10:10 (cron times)
const MONDAY_10H = new Date('2026-10-19T08:10:00.000Z');
const TUESDAY_9H50 = new Date('2026-10-20T07:50:00.000Z');
const WEDNESDAY_10H = new Date('2026-10-21T08:10:00.000Z');

/** Freezes `Date` only (not the timers, which the pg pool relies on) so the cron sees the given moment. */
const runAt = (date: Date) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(date);
};

const preferences = (notifications: Partial<NotificationPreferences>) =>
  JSON.stringify({ ...defaultUserPreferences, notifications: { ...defaultUserPreferences.notifications, ...notifications } });

const seedDemand = (overrides: Partial<Insertable<import('@/server/db/kysely').DB['demands_chaleur_renouvelable']>> = {}) =>
  seedDemandeChaleurRenouvelable({ departement_code: DEPARTEMENT, validated: true, ...overrides });

const seedPermission = (permission: Insertable<UserPermissions>) => kdb.insertInto('user_permissions').values(permission).execute();

const recipientIds = () => sentMail.mock.calls.map((c) => (c[1] as { id: string }).id).sort();
const callsFor = (userId: string) => sentMail.mock.calls.filter((c) => (c[1] as { id: string }).id === userId);

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
/** `notified_at` on a calendar day at the cron time (10:10 Paris). */
const notifiedOn = (isoDay: string) => new Date(`${isoDay}T08:10:00.000Z`);

const notifiedAtOf = async (demandId: string) =>
  (await kdb.selectFrom('demands_chaleur_renouvelable').select('notified_at').where('id', '=', demandId).executeTakeFirstOrThrow())
    .notified_at;

describe('ccrt-notifications', () => {
  beforeEach(async () => {
    ccrtEmail.isEnabled = true;
    await cleanDatabase();
    await seedTableUser([
      { id: ccrtMatching, preferences: preferences({ new_demands: 'daily' }), role: 'ccrt', structure_name: 'CCRT 13' },
      { id: ccrtOtherDepartement, preferences: preferences({ new_demands: 'daily' }), role: 'ccrt' },
      { id: collectiviteTerritory, preferences: preferences({ new_demands: 'daily' }), role: 'collectivite' },
      { active: false, id: ccrtInactive, preferences: preferences({ new_demands: 'daily' }), role: 'ccrt' },
      { id: ccrtOptedOutNew, preferences: preferences({ new_demands: 'none' }), role: 'ccrt' },
      { id: ccrtNetworkOnly, preferences: preferences({ new_demands: 'daily' }), role: 'ccrt' },
    ]);
    await Promise.all([
      seedPermission({ resource_id: DEPARTEMENT, type: 'departement', user_id: ccrtMatching }),
      seedPermission({ resource_id: OTHER_DEPARTEMENT, type: 'departement', user_id: ccrtOtherDepartement }),
      seedPermission({ resource_id: DEPARTEMENT, type: 'departement', user_id: collectiviteTerritory }),
      seedPermission({ resource_id: DEPARTEMENT, type: 'departement', user_id: ccrtInactive }),
      seedPermission({ resource_id: DEPARTEMENT, type: 'departement', user_id: ccrtOptedOutNew }),
      seedPermission({ resource_id: '13', type: 'reseau_de_chaleur', user_id: ccrtNetworkOnly }),
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const seedWeeklyUser = async () => {
    await seedTableUser([{ id: ccrtWeekly, preferences: preferences({ new_demands: 'weekly' }), role: 'ccrt' }]);
    await seedPermission({ resource_id: DEPARTEMENT, type: 'departement', user_id: ccrtWeekly });
  };

  describe('notifyCcrtOfNewDemands', () => {
    it('quotidien : un email détaillé par demande aux seuls CCRT actifs avec une permission territoriale matchante', async () => {
      const demand = await seedDemand();

      runAt(WEDNESDAY_10H);
      await notifyCcrtOfNewDemands();

      expect(recipientIds()).toStrictEqual([ccrtMatching]);
      expect(sentMail.mock.calls[0]).toStrictEqual([
        'demands.ccrt.nouvelle-demande-chaleur-renouvelable',
        { email: expect.any(String), id: ccrtMatching },
        {
          demand: expect.objectContaining({ address: demand.address, email: demand.email, housingCount: demand.housing_count }),
          demandUrl: `/pro/demandes-chaleur-renouvelable?demandes_chaleur_renouvelable_ccrt_search=${demand.id}`,
          pendingDemandCount: 1,
          status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
        },
      ]);
    });

    it.each([
      ['commune', '13055'],
      ['epci', 'EPCI-13'],
      ['ept', 'EPT-13'],
      ['region', '93'],
    ] as const)('matche la demande par la permission territoriale %s', async (type, resource_id) => {
      await kdb.deleteFrom('user_permissions').where('user_id', '=', ccrtMatching).execute();
      await seedPermission({ resource_id, type, user_id: ccrtMatching });
      await seedDemand({ commune_code: '13055', epci_code: 'EPCI-13', ept_code: 'EPT-13', region_code: '93' });

      runAt(WEDNESDAY_10H);
      await notifyCcrtOfNewDemands();

      expect(recipientIds()).toStrictEqual([ccrtMatching]);
    });

    it('compte les demandes « À traiter » du territoire dans pendingDemandCount, en un email par demande', async () => {
      await Promise.all([seedDemand(), seedDemand(), seedDemand({ status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT })]);

      runAt(WEDNESDAY_10H);
      await notifyCcrtOfNewDemands();

      expect(callsFor(ccrtMatching)).toHaveLength(3);
      expect(callsFor(ccrtMatching).map((c) => (c[2] as { pendingDemandCount: number }).pendingDemandCount)).toStrictEqual([2, 2, 2]);
    });

    it('ignore les demandes non validées ou déjà notifiées', async () => {
      await Promise.all([seedDemand({ validated: false }), seedDemand({ notified_at: daysAgo(1) })]);

      runAt(WEDNESDAY_10H);
      await notifyCcrtOfNewDemands();

      expect(sentMail).not.toHaveBeenCalled();
    });

    it('marque comme notifiées seulement les demandes ayant matché un destinataire, avec un événement', async () => {
      const [matched, orphan] = await Promise.all([seedDemand(), seedDemand({ departement_code: '99' })]);

      runAt(WEDNESDAY_10H);
      await notifyCcrtOfNewDemands();

      const events = await kdb
        .selectFrom('events')
        .select(['context_id', 'context_type'])
        .where('type', '=', 'ccrt_demand_notification_sent')
        .execute();
      expect(await notifiedAtOf(matched.id)).toStrictEqual(WEDNESDAY_10H);
      expect(await notifiedAtOf(orphan.id)).toBeNull();
      expect(events).toStrictEqual([{ context_id: matched.id, context_type: 'ccrt_demand' }]);
    });

    it('hebdomadaire : rien en dehors du lundi, même pour une demande non notifiée', async () => {
      await seedWeeklyUser();
      await seedDemand();

      runAt(WEDNESDAY_10H);
      await notifyCcrtOfNewDemands();

      expect(recipientIds()).toStrictEqual([ccrtMatching]);
    });

    it('hebdomadaire : le lundi, récapitulatif des demandes de la semaine (non notifiées ou notifiées depuis le dernier lundi), sans re-marquer celles déjà notifiées', async () => {
      await seedWeeklyUser();
      const [fresh, midWeek, previousDigest] = await Promise.all([
        seedDemand({ address: '1 rue Fraîche' }),
        seedDemand({ address: '2 rue Milieu', notified_at: notifiedOn('2026-10-14') }), // notifiée mercredi à un collègue quotidien
        seedDemand({ address: '3 rue Ancienne', notified_at: notifiedOn('2026-10-12') }), // déjà dans le récapitulatif du lundi précédent
      ]);

      runAt(MONDAY_10H);
      await notifyCcrtOfNewDemands();

      expect(recipientIds()).toStrictEqual([ccrtMatching, ccrtWeekly].sort());
      expect(callsFor(ccrtWeekly)).toStrictEqual([
        [
          'demands.ccrt.nouvelles-demandes-a-traiter-weekly',
          { email: expect.any(String), id: ccrtWeekly },
          {
            demandListUrl: '/pro/demandes-chaleur-renouvelable',
            demands: expect.arrayContaining([
              expect.objectContaining({ address: '1 rue Fraîche', id: fresh.id }),
              expect.objectContaining({ address: '2 rue Milieu', id: midWeek.id }),
            ]),
            pendingDemandCount: 3,
          },
        ],
      ]);
      expect((callsFor(ccrtWeekly)[0][2] as { demands: unknown[] }).demands).toHaveLength(2);
      expect(callsFor(ccrtMatching)).toHaveLength(1);

      expect(await notifiedAtOf(fresh.id)).toStrictEqual(MONDAY_10H);
      expect(await notifiedAtOf(midWeek.id)).toStrictEqual(notifiedOn('2026-10-14'));
      expect(await notifiedAtOf(previousDigest.id)).toStrictEqual(notifiedOn('2026-10-12'));
    });

    it("n'envoie ni ne marque rien tant que les emails CCRT sont suspendus", async () => {
      ccrtEmail.isEnabled = false;
      const demand = await seedDemand();

      runAt(WEDNESDAY_10H);
      await notifyCcrtOfNewDemands();

      expect(sentMail).not.toHaveBeenCalled();
      expect(await notifiedAtOf(demand.id)).toBeNull();
    });
  });

  describe('notifyCcrtOfUnhandledDemands', () => {
    it('relance les CCRT matchants avec pending_demands_reminder=true sur une demande notifiée depuis plus de 7 jours', async () => {
      const demand = await seedDemand({ notified_at: daysAgo(10) });

      await notifyCcrtOfUnhandledDemands();

      expect(recipientIds()).toStrictEqual([ccrtMatching, ccrtOptedOutNew].sort());
      expect(callsFor(ccrtMatching)[0]).toStrictEqual([
        'demands.ccrt.rappel-demandes-en-attente',
        { email: expect.any(String), id: ccrtMatching },
        {
          demandListUrl: '/pro/demandes-chaleur-renouvelable',
          demands: [
            {
              address: demand.address,
              housingCount: demand.housing_count,
              housingType: demand.housing_type,
              id: demand.id,
              waitingDays: 0,
            },
          ],
          pendingDemandCount: 1,
        },
        { subject: "[France Chaleur Urbaine] 1 demande(s) d'accompagnement en attente de traitement" },
      ]);
    });

    it('ignore les demandes notifiées il y a moins de 7 jours, jamais notifiées, ou dont le statut a changé', async () => {
      await Promise.all([
        seedDemand({ notified_at: daysAgo(3) }),
        seedDemand(),
        seedDemand({ notified_at: daysAgo(10), status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT }),
      ]);

      await notifyCcrtOfUnhandledDemands();

      expect(sentMail).not.toHaveBeenCalled();
    });

    it('un seul email par CCRT, les 5 plus anciennes demandes listées et le total compté', async () => {
      await Promise.all(Array.from({ length: 6 }, (_, i) => seedDemand({ created_at: daysAgo(20.5 - i), notified_at: daysAgo(10) })));

      await notifyCcrtOfUnhandledDemands();

      expect(recipientIds()).toStrictEqual([ccrtMatching, ccrtOptedOutNew].sort());
      const props = callsFor(ccrtMatching)[0][2] as { demands: { waitingDays: number }[]; pendingDemandCount: number };
      expect(props.pendingDemandCount).toBe(6);
      expect(props.demands.map((d) => d.waitingDays)).toStrictEqual([20, 19, 18, 17, 16]);
    });

    it('hebdomadaire : le délai court depuis le lundi du récapitulatif, pas depuis le marquage par un collègue quotidien', async () => {
      await seedWeeklyUser();
      // marquée le mardi 13 → reçue par l'hebdo dans le récapitulatif du lundi 19, la veille du rappel
      await seedDemand({ notified_at: notifiedOn('2026-10-13') });

      runAt(TUESDAY_9H50);
      await notifyCcrtOfUnhandledDemands();

      expect(recipientIds()).toStrictEqual([ccrtMatching, ccrtOptedOutNew].sort());
    });

    it('hebdomadaire : rappelé une fois le récapitulatif vieux de plus de 7 jours', async () => {
      await seedWeeklyUser();
      // marquée le lundi 12 → récapitulatif du lundi 12, 8 jours avant le rappel du mardi 20
      await seedDemand({ notified_at: notifiedOn('2026-10-12') });

      runAt(TUESDAY_9H50);
      await notifyCcrtOfUnhandledDemands();

      expect(recipientIds()).toStrictEqual([ccrtMatching, ccrtOptedOutNew, ccrtWeekly].sort());
    });

    it("n'envoie rien tant que les emails CCRT sont suspendus", async () => {
      ccrtEmail.isEnabled = false;
      await seedDemand({ notified_at: daysAgo(10) });

      await notifyCcrtOfUnhandledDemands();

      expect(sentMail).not.toHaveBeenCalled();
    });
  });
});
