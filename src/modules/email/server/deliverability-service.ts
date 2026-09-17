import { TRPCError } from '@trpc/server';

import { createEvents } from '@/modules/events/server/service';
import { serverConfig } from '@/server/config';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { chunk } from '@/utils/array';
import { pseudonymizeEmail } from '@/utils/email';

import type { EmailUnblockSource } from '../constants';
import {
  type BrevoBlockedContact,
  isBrevoConfigured,
  listAllBlockedContacts,
  listEmailEvents,
  parseBrevoDate,
  unblockContact,
} from './brevo-client';

const UPSERT_CHUNK_SIZE = 500;

export type BlockedContactInput = {
  email: string;
  reason_code: string;
  blocked_at: Date;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toBlockedContactInput = (contact: BrevoBlockedContact): BlockedContactInput => ({
  blocked_at: parseBrevoDate(contact.blockedAt),
  email: normalizeEmail(contact.email),
  reason_code: contact.reason.code, // the API message is a fixed label per code, so only the code is kept
});

/**
 * Pure diff between the mirrored table and the provider list.
 * Duplicated remote emails (pagination drift) are collapsed on the first occurrence.
 */
export const computeBlockedContactsDiff = (local: { email: string }[], remote: BlockedContactInput[]) => {
  const remoteByEmail = remote.reduce(
    (byEmail, contact) => (byEmail.has(contact.email) ? byEmail : byEmail.set(contact.email, contact)),
    new Map<string, BlockedContactInput>()
  );
  const localEmails = new Set(local.map((row) => row.email));
  const upserts = [...remoteByEmail.values()];
  return {
    added: upserts.filter((contact) => !localEmails.has(contact.email)),
    removed: local.map((row) => row.email).filter((email) => !remoteByEmail.has(email)),
    upserts,
  };
};

/**
 * Mirrors the Brevo transactional blocklist into `email_blocked_contacts` and traces the transitions as events
 * (blocked events are dated with the Brevo date, so the first sync rebuilds the full history).
 */
export async function syncBlockedContacts() {
  if (!isBrevoConfigured()) {
    logger.info('brevo sync skipped: BREVO_API_KEY not configured');
    return { added: 0, removed: 0, skipped: true, total: 0 };
  }
  const remote = (await listAllBlockedContacts()).map(toBlockedContactInput);
  const local = await kdb.selectFrom('email_blocked_contacts').select(['email']).execute();
  const { added, removed, upserts } = computeBlockedContactsDiff(local, remote);
  const now = new Date();

  await kdb.transaction().execute(async (trx) => {
    if (removed.length > 0) {
      await trx.deleteFrom('email_blocked_contacts').where('email', 'in', removed).execute();
    }
    for (const rows of chunk(upserts, UPSERT_CHUNK_SIZE)) {
      await trx
        .insertInto('email_blocked_contacts')
        .values(rows.map((row) => ({ ...row, synced_at: now })))
        .onConflict((oc) =>
          oc.column('email').doUpdateSet((eb) => ({
            blocked_at: eb.ref('excluded.blocked_at'),
            reason_code: eb.ref('excluded.reason_code'),
            synced_at: now,
          }))
        )
        .execute();
    }
  });

  await createBlockedEvents(added);
  await createUnblockedEvents(removed, { at: now, authorId: null, source: 'external' });

  logger.info('brevo sync done', { added: added.length, removed: removed.length, total: upserts.length });
  return { added: added.length, removed: removed.length, skipped: false, total: upserts.length };
}

/** Instance-level settings: lets the UI disable what the server would refuse anyway. */
export const getDeliverabilitySettings = () => {
  const configured = isBrevoConfigured();
  return { configured, writesEnabled: configured && serverConfig.BREVO_ALLOW_WRITES };
};

/**
 * Local blocked status of one recipient (mirror table only, no Brevo call: cheap enough for every dialog open).
 */
export async function getEmailDeliverability(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const [blocked, lastSyncAt] = await Promise.all([
    kdb
      .selectFrom('email_blocked_contacts')
      .select(['reason_code', 'blocked_at', 'synced_at'])
      .where('email', '=', email)
      .executeTakeFirst(),
    getLastSyncAt(),
  ]);
  return { ...getDeliverabilitySettings(), blocked: blocked ?? null, lastSyncAt };
}

/**
 * Live Brevo events (last 90 days) of one recipient, loaded on demand. An API failure is returned as `error`
 * rather than thrown, so the raw Brevo message (e.g. unauthorised IP) is shown to the admin.
 */
export async function listEmailEventsForAdmin(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!isBrevoConfigured()) {
    return { error: 'Clé API Brevo non configurée', events: [] };
  }
  try {
    const events = await listEmailEvents(email);
    return {
      error: null,
      events: events.map((event) => ({
        date: parseBrevoDate(event.date).toISOString(),
        event: event.event,
        messageId: event.messageId ?? null,
        reason: event.reason ?? null,
        subject: event.subject ?? null,
      })),
    };
  } catch (error) {
    logger.error('brevo listEmailEvents failed', { email: pseudonymizeEmail(email), error });
    return { error: error instanceof Error ? error.message : 'unknown error', events: [] };
  }
}

/**
 * Admin inventory of the mirrored blocklist, with the matching account and the number of demands using the address.
 */
export async function listBlockedContacts() {
  return kdb
    .selectFrom('email_blocked_contacts as ebc')
    .select((eb) => [
      'ebc.email',
      'ebc.reason_code',
      'ebc.blocked_at',
      'ebc.synced_at',
      eb
        .selectFrom('users')
        .select('users.id')
        .where((eb2) => eb2(eb2.fn<string>('lower', ['users.email']), '=', eb2.ref('ebc.email')))
        .limit(1)
        .as('user_id'),
      sql<number>`(${eb
        .selectFrom('demands')
        .select((eb2) => eb2.fn.countAll().as('count'))
        .where('demands.deleted_at', 'is', null)
        .where((eb2) => eb2(sql<string>`lower(${eb2.ref('demands.legacy_values')}->>'Mail')`, '=', eb2.ref('ebc.email')))})::int`.as(
        'demands_count'
      ),
    ])
    .orderBy('ebc.blocked_at', 'desc')
    .execute();
}

const getLastSyncAt = async () => {
  const row = await kdb
    .selectFrom('email_blocked_contacts')
    .select((eb) => eb.fn.max('synced_at').as('last_sync_at'))
    .executeTakeFirst();
  return row?.last_sync_at ?? null;
};

/**
 * Admin action: removes the address from the Brevo blocklist and from the mirror, tracing who did it.
 * Guarded by BREVO_ALLOW_WRITES because the Brevo account is shared by every environment.
 */
export async function unblockEmail(rawEmail: string, actor: { adminUserId: string }) {
  const email = normalizeEmail(rawEmail);
  if (!isBrevoConfigured()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: "Le suivi de délivrabilité Brevo n'est pas configuré" });
  }
  if (!serverConfig.BREVO_ALLOW_WRITES) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Le déblocage des emails est désactivé sur cette instance' });
  }
  const wasBlockedAtBrevo = await unblockContact(email);
  const deletedRows = await kdb.deleteFrom('email_blocked_contacts').where('email', '=', email).returning('email').execute();
  const wasBlocked = wasBlockedAtBrevo || deletedRows.length > 0;
  if (wasBlocked) {
    await createUnblockedEvents([email], { at: new Date(), authorId: actor.adminUserId, source: 'admin' });
  }
  logger.info('email unblocked', { admin_user_id: actor.adminUserId, email: pseudonymizeEmail(email), wasBlockedAtBrevo });
  return { wasBlocked };
}

const findUsersByEmails = (emails: string[]) =>
  emails.length === 0
    ? Promise.resolve([])
    : kdb
        .selectFrom('users')
        .select((eb) => ['id', eb.fn<string>('lower', ['email']).as('email')])
        .where((eb) => eb(eb.fn<string>('lower', ['email']), 'in', emails))
        .execute();

const findDemandsByEmails = (emails: string[]) =>
  emails.length === 0
    ? Promise.resolve([])
    : kdb
        .selectFrom('demands')
        .select((eb) => ['id', sql<string>`lower(${eb.ref('legacy_values')}->>'Mail')`.as('email')])
        .where('deleted_at', 'is', null)
        .where((eb) => eb(sql<string>`lower(${eb.ref('legacy_values')}->>'Mail')`, 'in', emails))
        .execute();

type EventInput = Parameters<typeof createEvents>[0][number];

/** Accounts and non-deleted demands using the given addresses: one event context each. */
async function findEmailOwners(emails: string[]) {
  const [users, demands] = await Promise.all([findUsersByEmails(emails), findDemandsByEmails(emails)]);
  return [
    ...users.map((user) => ({ context_id: user.id, context_type: 'user' as const, email: user.email })),
    ...demands.map((demand) => ({ context_id: demand.id, context_type: 'demand' as const, email: demand.email })),
  ];
}

async function createBlockedEvents(contacts: BlockedContactInput[]) {
  if (contacts.length === 0) {
    return;
  }
  const owners = await findEmailOwners(contacts.map((contact) => contact.email));
  const candidates = contacts.flatMap((contact) =>
    owners
      .filter((owner) => owner.email === contact.email)
      .map((owner) => ({
        author_id: null,
        context_id: owner.context_id,
        context_type: owner.context_type,
        created_at: contact.blocked_at,
        data: { email: contact.email, reason_code: contact.reason_code },
        type: owner.context_type === 'user' ? ('user_email_blocked' as const) : ('demand_email_blocked' as const),
      }))
  );
  await createEvents(await excludeExistingEvents(candidates));
}

async function createUnblockedEvents(emails: string[], options: { at: Date; authorId: string | null; source: EmailUnblockSource }) {
  if (emails.length === 0) {
    return;
  }
  const owners = await findEmailOwners(emails);
  await createEvents(
    owners.map((owner) => ({
      author_id: options.authorId,
      context_id: owner.context_id,
      context_type: owner.context_type,
      created_at: options.at,
      data: { email: owner.email, source: options.source },
      type: owner.context_type === 'user' ? ('user_email_unblocked' as const) : ('demand_email_unblocked' as const),
    }))
  );
}

/**
 * Makes the sync replayable: a blocked event already stored for the same context and Brevo date is not re-created.
 */
async function excludeExistingEvents(candidates: (EventInput & { context_id: string; created_at: Date })[]) {
  if (candidates.length === 0) {
    return candidates;
  }
  const existing = await kdb
    .selectFrom('events')
    .select(['type', 'context_id', 'created_at'])
    .where('type', 'in', ['user_email_blocked', 'demand_email_blocked'])
    .where('context_id', 'in', [...new Set(candidates.map((candidate) => candidate.context_id))])
    .execute();
  const existingKeys = new Set(existing.map((event) => `${event.type}:${event.context_id}:${new Date(event.created_at).getTime()}`));
  return candidates.filter((candidate) => !existingKeys.has(`${candidate.type}:${candidate.context_id}:${candidate.created_at.getTime()}`));
}
