import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LegacyDemandValues } from '@/modules/demands/types';
import { sendEmailTemplate } from '@/modules/email';
import { defaultUserPreferences, type NotificationPreferences } from '@/modules/users/constants';
import { type Demands, type Insertable, kdb, type UserPermissions } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { notifyGestionnairesOfNewDemands, notifyGestionnairesOfUnhandledDemands } from './manager-notifications';

const sentMail = vi.mocked(sendEmailTemplate);

const NETWORK_ID = 7501;
const OTHER_NETWORK_ID = 9999;

const userMatching = uuid(101); // perm reseau_de_chaleur:7501, actif, daily + rappel → reçoit tout
const userTerritoryOnly = uuid(102); // perm territoire (commune) → ne reçoit rien
const userWrongNetwork = uuid(103); // perm reseau_de_chaleur:9999 → ne reçoit rien
const userInactive = uuid(104); // perm matchante mais active=false → ne reçoit rien
const userOptedOutNew = uuid(105); // perm matchante, new_demands=none, rappel=true → reçoit unhandled, pas new
const userWeekly = uuid(106); // perm matchante, new_demands=weekly, rappel=true → récapitulatif du lundi

// Monday 2026-10-19 10:00 Europe/Paris and the following Tuesday 09:55 / Wednesday 10:00 (cron times)
const MONDAY_10H = new Date('2026-10-19T08:00:00.000Z');
const TUESDAY_9H55 = new Date('2026-10-20T07:55:00.000Z');
const WEDNESDAY_10H = new Date('2026-10-21T08:00:00.000Z');

/** Freezes `Date` only (not the timers, which the pg pool relies on) so the cron sees the given moment. */
const runAt = (date: Date) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(date);
};

const preferences = (notifications: Partial<NotificationPreferences>) =>
  JSON.stringify({ ...defaultUserPreferences, notifications: { ...defaultUserPreferences.notifications, ...notifications } });

type SeedDemandInput = Partial<Omit<Insertable<Demands>, 'legacy_values'>> & {
  legacy?: Partial<LegacyDemandValues>;
};

async function seedDemand({ legacy, ...overrides }: SeedDemandInput = {}) {
  const [row] = await kdb
    .insertInto('demands')
    .values({
      deleted_at: null,
      legacy_values: JSON.stringify(legacy ?? {}),
      network_id: NETWORK_ID,
      network_type: 'reseau_de_chaleur',
      validated: true,
      ...overrides,
    })
    .returningAll()
    .execute();
  return row;
}

async function seedPermission(permission: Insertable<UserPermissions>) {
  await kdb.insertInto('user_permissions').values(permission).execute();
}

const recipientIds = () => sentMail.mock.calls.map((c) => (c[1] as { id: string }).id).sort();
const callsFor = (userId: string) => sentMail.mock.calls.filter((c) => (c[1] as { id: string }).id === userId);

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toDateString();
/** 'Notification envoyé' value for a calendar day (same format as the cron: `Date#toDateString`). */
const notifiedOn = (isoDay: string) => new Date(`${isoDay}T12:00:00`).toDateString();

describe('manager-notifications', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([
      { id: userMatching, preferences: preferences({ new_demands: 'daily' }), role: 'gestionnaire' },
      { id: userTerritoryOnly, preferences: preferences({ new_demands: 'daily' }), role: 'collectivite' },
      { id: userWrongNetwork, preferences: preferences({ new_demands: 'daily' }), role: 'gestionnaire' },
      { active: false, id: userInactive, preferences: preferences({ new_demands: 'daily' }), role: 'gestionnaire' },
      { id: userOptedOutNew, preferences: preferences({ new_demands: 'none' }), role: 'gestionnaire' },
    ]);
    await Promise.all([
      seedPermission({ resource_id: String(NETWORK_ID), type: 'reseau_de_chaleur', user_id: userMatching }),
      seedPermission({ resource_id: '75056', type: 'commune', user_id: userTerritoryOnly }),
      seedPermission({ resource_id: String(OTHER_NETWORK_ID), type: 'reseau_de_chaleur', user_id: userWrongNetwork }),
      seedPermission({ resource_id: String(NETWORK_ID), type: 'reseau_de_chaleur', user_id: userInactive }),
      seedPermission({ resource_id: String(NETWORK_ID), type: 'reseau_de_chaleur', user_id: userOptedOutNew }),
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const seedWeeklyUser = async () => {
    await seedTableUser([{ id: userWeekly, preferences: preferences({ new_demands: 'weekly' }), role: 'gestionnaire' }]);
    await seedPermission({ resource_id: String(NETWORK_ID), type: 'reseau_de_chaleur', user_id: userWeekly });
  };

  describe('notifyGestionnairesOfNewDemands', () => {
    it('notifie uniquement les users avec perm réseau matchante, actifs, et new_demands=daily', async () => {
      await seedDemand();

      runAt(WEDNESDAY_10H);
      await notifyGestionnairesOfNewDemands();

      expect(recipientIds()).toStrictEqual([userMatching]);
      expect(sentMail.mock.calls[0][0]).toBe('demands.gestionnaire.nouvelles-demandes-a-traiter-daily');
    });

    it('passe le vrai compte de demandes par destinataire dans nbDemands', async () => {
      await Promise.all([seedDemand(), seedDemand(), seedDemand()]);

      runAt(WEDNESDAY_10H);
      await notifyGestionnairesOfNewDemands();

      expect(sentMail).toHaveBeenCalledTimes(1);
      expect(sentMail.mock.calls[0][2]).toStrictEqual({ frequency: 'daily', nbDemands: 3 });
    });

    it('ignore les demandes sans réseau, UNREALISABLE, déjà notifiées, supprimées ou non validées', async () => {
      await Promise.all([
        seedDemand({ network_id: null, network_type: null }),
        seedDemand({ legacy: { Status: DEMANDE_STATUS.UNREALISABLE } }),
        seedDemand({ legacy: { 'Notification envoyé': daysAgo(0) } }),
        seedDemand({ deleted_at: new Date() }),
        seedDemand({ validated: false }),
      ]);

      runAt(WEDNESDAY_10H);
      await notifyGestionnairesOfNewDemands();

      expect(sentMail).not.toHaveBeenCalled();
    });

    it('marque comme notifiées seulement les demandes ayant matché un destinataire', async () => {
      const [matched, orphan] = await Promise.all([
        seedDemand(),
        seedDemand({ network_id: 8888 }), // aucun user n'a de perm sur 8888
      ]);

      runAt(WEDNESDAY_10H);
      await notifyGestionnairesOfNewDemands();

      const after = await kdb.selectFrom('demands').select(['id', 'legacy_values']).execute();
      const matchedAfter = after.find((d) => d.id === matched.id)!;
      const orphanAfter = after.find((d) => d.id === orphan.id)!;

      expect(matchedAfter.legacy_values['Notification envoyé']).toBe(WEDNESDAY_10H.toDateString());
      expect(orphanAfter.legacy_values['Notification envoyé']).toBeUndefined();
    });

    it('hebdomadaire : rien en dehors du lundi, même pour une demande non notifiée', async () => {
      await seedWeeklyUser();
      await seedDemand();

      runAt(WEDNESDAY_10H);
      await notifyGestionnairesOfNewDemands();

      expect(recipientIds()).toStrictEqual([userMatching]);
    });

    it('hebdomadaire : le lundi, récapitulatif des demandes de la semaine (non notifiées ou notifiées depuis le dernier lundi), sans re-marquer celles déjà notifiées', async () => {
      await seedWeeklyUser();
      const [fresh, midWeek, previousDigest] = await Promise.all([
        seedDemand(),
        seedDemand({ legacy: { 'Notification envoyé': notifiedOn('2026-10-14') } }), // notifiée mercredi à un collègue quotidien
        seedDemand({ legacy: { 'Notification envoyé': notifiedOn('2026-10-12') } }), // déjà dans le récapitulatif du lundi précédent
      ]);

      runAt(MONDAY_10H);
      await notifyGestionnairesOfNewDemands();

      expect(recipientIds()).toStrictEqual([userMatching, userWeekly].sort());
      expect(callsFor(userWeekly)[0][0]).toBe('demands.gestionnaire.nouvelles-demandes-a-traiter-weekly');
      expect(callsFor(userWeekly)[0][2]).toStrictEqual({ frequency: 'weekly', nbDemands: 2 });
      expect(callsFor(userMatching)[0][2]).toStrictEqual({ frequency: 'daily', nbDemands: 1 });

      const after = await kdb.selectFrom('demands').select(['id', 'legacy_values']).execute();
      const notifiedDateOf = (id: string) => after.find((d) => d.id === id)!.legacy_values['Notification envoyé'];
      expect(notifiedDateOf(fresh.id)).toBe(MONDAY_10H.toDateString());
      expect(notifiedDateOf(midWeek.id)).toBe(notifiedOn('2026-10-14'));
      expect(notifiedDateOf(previousDigest.id)).toBe(notifiedOn('2026-10-12'));
    });
  });

  describe('notifyGestionnairesOfUnhandledDemands', () => {
    it('notifie tous les users matchants avec pending_demands_reminder=true sur une demande > 7j', async () => {
      await seedDemand({ legacy: { 'Notification envoyé': daysAgo(10) } });

      await notifyGestionnairesOfUnhandledDemands();

      expect(recipientIds()).toStrictEqual([userMatching, userOptedOutNew].sort());
    });

    it('ignore les demandes notifiées il y a moins de 7 jours', async () => {
      await seedDemand({ legacy: { 'Notification envoyé': daysAgo(3) } });

      await notifyGestionnairesOfUnhandledDemands();

      expect(sentMail).not.toHaveBeenCalled();
    });

    it('ignore les demandes avec un statut autre que vide / À traiter', async () => {
      await Promise.all([
        seedDemand({ legacy: { 'Notification envoyé': daysAgo(10), Status: DEMANDE_STATUS.RECONTACTED } }),
        seedDemand({ legacy: { 'Notification envoyé': daysAgo(10), Status: DEMANDE_STATUS.UNREALISABLE } }),
      ]);

      await notifyGestionnairesOfUnhandledDemands();

      expect(sentMail).not.toHaveBeenCalled();
    });

    it('dédup : un seul email par user, peu importe le nombre de demandes en attente', async () => {
      await Promise.all([
        seedDemand({ legacy: { 'Notification envoyé': daysAgo(10) } }),
        seedDemand({ legacy: { 'Notification envoyé': daysAgo(15) } }),
        seedDemand({ legacy: { 'Notification envoyé': daysAgo(20) } }),
      ]);

      await notifyGestionnairesOfUnhandledDemands();

      expect(recipientIds()).toStrictEqual([userMatching, userOptedOutNew].sort());
      expect(recipientIds().length).toBe(2); // 1 par user, pas 6 (3 demandes × 2 users)
    });

    it('hebdomadaire : le délai court depuis le lundi du récapitulatif, pas depuis le marquage par un collègue quotidien', async () => {
      await seedWeeklyUser();
      // marquée le mardi 13 → reçue par l'hebdo dans le récapitulatif du lundi 19, la veille du rappel
      await seedDemand({ legacy: { 'Notification envoyé': notifiedOn('2026-10-13') } });

      runAt(TUESDAY_9H55);
      await notifyGestionnairesOfUnhandledDemands();

      expect(recipientIds()).toStrictEqual([userMatching, userOptedOutNew].sort());
    });

    it('hebdomadaire : rappelé une fois le récapitulatif vieux de plus de 7 jours', async () => {
      await seedWeeklyUser();
      // marquée le lundi 12 → récapitulatif du lundi 12, 8 jours avant le rappel du mardi 20
      await seedDemand({ legacy: { 'Notification envoyé': notifiedOn('2026-10-12') } });

      runAt(TUESDAY_9H55);
      await notifyGestionnairesOfUnhandledDemands();

      expect(recipientIds()).toStrictEqual([userMatching, userOptedOutNew, userWeekly].sort());
    });
  });
});
