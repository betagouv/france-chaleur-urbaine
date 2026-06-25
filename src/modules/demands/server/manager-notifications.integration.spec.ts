import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { sendEmailTemplate } from '@/modules/email';
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

const userMatching = uuid(101); // perm reseau_de_chaleur:7501, actif, receive_*=true → reçoit tout
const userTerritoryOnly = uuid(102); // perms territoire (commune + national) → ne reçoit rien
const userWrongNetwork = uuid(103); // perm reseau_de_chaleur:9999 → ne reçoit rien
const userInactive = uuid(104); // perm matchante mais active=false → ne reçoit rien
const userOptedOutNew = uuid(105); // perm matchante, receive_new=false, receive_old=true → reçoit unhandled, pas new

type SeedDemandInput = Partial<Omit<Insertable<Demands>, 'legacy_values'>> & {
  legacy?: Partial<AirtableLegacyRecord>;
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

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toDateString();

describe('manager-notifications', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([
      { id: userMatching, receive_new_demands: true, receive_old_demands: true, role: 'gestionnaire' },
      { id: userTerritoryOnly, receive_new_demands: true, receive_old_demands: true, role: 'collectivite' },
      { id: userWrongNetwork, receive_new_demands: true, receive_old_demands: true, role: 'gestionnaire' },
      { active: false, id: userInactive, receive_new_demands: true, receive_old_demands: true, role: 'gestionnaire' },
      { id: userOptedOutNew, receive_new_demands: false, receive_old_demands: true, role: 'gestionnaire' },
    ]);
    await Promise.all([
      seedPermission({ resource_id: String(NETWORK_ID), type: 'reseau_de_chaleur', user_id: userMatching }),
      seedPermission({ resource_id: '75056', type: 'commune', user_id: userTerritoryOnly }),
      seedPermission({ resource_id: null, type: 'national', user_id: userTerritoryOnly }),
      seedPermission({ resource_id: String(OTHER_NETWORK_ID), type: 'reseau_de_chaleur', user_id: userWrongNetwork }),
      seedPermission({ resource_id: String(NETWORK_ID), type: 'reseau_de_chaleur', user_id: userInactive }),
      seedPermission({ resource_id: String(NETWORK_ID), type: 'reseau_de_chaleur', user_id: userOptedOutNew }),
    ]);
  });

  afterEach(() => vi.clearAllMocks());

  describe('notifyGestionnairesOfNewDemands', () => {
    it('notifie uniquement les users avec perm réseau matchante, actifs, et receive_new_demands=true', async () => {
      await seedDemand();

      await notifyGestionnairesOfNewDemands();

      expect(recipientIds()).toStrictEqual([userMatching]);
    });

    it('passe le vrai compte de demandes par destinataire dans nbDemands', async () => {
      await Promise.all([seedDemand(), seedDemand(), seedDemand()]);

      await notifyGestionnairesOfNewDemands();

      expect(sentMail).toHaveBeenCalledTimes(1);
      expect(sentMail.mock.calls[0][2]).toStrictEqual({ nbDemands: 3 });
    });

    it('ignore les demandes sans réseau, UNREALISABLE, déjà notifiées, supprimées ou non validées', async () => {
      await Promise.all([
        seedDemand({ network_id: null, network_type: null }),
        seedDemand({ legacy: { Status: DEMANDE_STATUS.UNREALISABLE } }),
        seedDemand({ legacy: { 'Notification envoyé': daysAgo(0) } }),
        seedDemand({ deleted_at: new Date() }),
        seedDemand({ validated: false }),
      ]);

      await notifyGestionnairesOfNewDemands();

      expect(sentMail).not.toHaveBeenCalled();
    });

    it('marque comme notifiées seulement les demandes ayant matché un destinataire', async () => {
      const [matched, orphan] = await Promise.all([
        seedDemand(),
        seedDemand({ network_id: 8888 }), // aucun user n'a de perm sur 8888
      ]);

      await notifyGestionnairesOfNewDemands();

      const after = await kdb.selectFrom('demands').select(['id', 'legacy_values']).execute();
      const matchedAfter = after.find((d) => d.id === matched.id)!;
      const orphanAfter = after.find((d) => d.id === orphan.id)!;

      expect(matchedAfter.legacy_values['Notification envoyé']).toBeTruthy();
      expect(orphanAfter.legacy_values['Notification envoyé']).toBeUndefined();
    });
  });

  describe('notifyGestionnairesOfUnhandledDemands', () => {
    it('notifie tous les users matchants avec receive_old_demands=true sur une demande > 7j', async () => {
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
  });
});
