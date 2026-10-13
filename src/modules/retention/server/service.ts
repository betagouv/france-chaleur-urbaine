import { randomBytes } from 'node:crypto';

import { genSalt, hash } from 'bcryptjs';

import { businessRules } from '@/modules/app/business-rules';
import { createUserEvent } from '@/modules/events/server/service';
import { purgeFileContents } from '@/modules/files/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import { type RetentionRule, retentionRules } from '../constants';

const ANONYMIZED_EMAIL_PREFIX = 'anonymise-';
const ANONYMIZED_EMAIL_DOMAIN = '@anonymise.invalid';

const closedDemandStatuses = [DEMANDE_STATUS.DONE, DEMANDE_STATUS.UNREALISABLE, DEMANDE_STATUS.ABANDONNED];

const cutoff = (amount: number, unit: 'months' | 'years') => sql<Date>`now() - ${sql.lit(`${amount} ${unit}`)}::interval`;

/** Never-activated accounts older than the pending retention. */
const pendingAccountsQuery = () =>
  kdb
    .selectFrom('users')
    .where('status', '=', 'pending_email_confirmation')
    .where('created_at', '<', cutoff(businessRules.retentionAccountsPendingMonths.value, 'months'));

/** Active non-admin accounts without a connection for longer than the inactive retention (creation date if never connected). */
const inactiveAccountsQuery = () =>
  kdb
    .selectFrom('users')
    .where('role', '<>', 'admin')
    .where('active', 'is', true)
    .where('status', '=', 'valid')
    .where('email', 'not like', `${ANONYMIZED_EMAIL_PREFIX}%`)
    .where(sql<Date>`coalesce(last_connection, created_at)`, '<', cutoff(businessRules.retentionAccountsInactiveYears.value, 'years'));

/**
 * Demands closed (terminal status, or soft-deleted) for longer than the demands retention and not yet anonymized.
 * The closure date is not tracked and `updated_at` was reset by the Airtable migration, so the clock for closed demands is the
 * request date: a demand requested more than N years ago and now closed has exhausted its purpose.
 */
const closedDemandsQuery = () =>
  kdb
    .selectFrom('demands')
    .where(sql<string>`legacy_values->>'Mail'`, 'not like', `${ANONYMIZED_EMAIL_PREFIX}%`)
    .where((eb) =>
      eb.or([
        eb.and([
          eb(sql<string>`legacy_values->>'Status'`, 'in', closedDemandStatuses),
          eb(
            sql<Date>`(legacy_values->>'Date de la demande')::timestamptz`,
            '<',
            cutoff(businessRules.retentionDemandsClosedYears.value, 'years')
          ),
        ]),
        eb('deleted_at', '<', cutoff(businessRules.retentionDemandsClosedYears.value, 'years')),
      ])
    );

/** Processed network change requests older than the retention, not yet anonymized. */
const processedNetworkChangeRequestsQuery = () =>
  kdb
    .selectFrom('network_change_requests')
    .where('status', '<>', 'pending')
    .where('contact_email', 'not like', `${ANONYMIZED_EMAIL_PREFIX}%`)
    .where('processed_at', '<', cutoff(businessRules.retentionNetworkChangeRequestsYears.value, 'years'));

export type RetentionPreviewItem = { id: string; label: string; date: Date | null };
export type RetentionPreview = { rule: RetentionRule; count: number; items: RetentionPreviewItem[] };

const previewRule = async (rule: RetentionRule): Promise<RetentionPreview> => {
  switch (rule) {
    case 'pending_accounts': {
      const { count } = await pendingAccountsQuery().select(kdb.fn.countAll<number>().as('count')).executeTakeFirstOrThrow();
      const items = await pendingAccountsQuery().select(['id', 'email as label', 'created_at as date']).orderBy('created_at').execute();
      return { count: Number(count), items, rule };
    }
    case 'inactive_accounts': {
      const { count } = await inactiveAccountsQuery().select(kdb.fn.countAll<number>().as('count')).executeTakeFirstOrThrow();
      const items = await inactiveAccountsQuery()
        .select(['id', 'email as label', sql<Date | null>`coalesce(last_connection, created_at)`.as('date')])
        .orderBy(sql`coalesce(last_connection, created_at)`)
        .execute();
      return { count: Number(count), items, rule };
    }
    case 'closed_demands': {
      const { count } = await closedDemandsQuery().select(kdb.fn.countAll<number>().as('count')).executeTakeFirstOrThrow();
      const items = await closedDemandsQuery()
        .select([
          'id',
          sql<string>`coalesce(legacy_values->>'Adresse', '')`.as('label'),
          // the date that makes the row eligible: request date for a closed demand, deletion date otherwise
          sql<Date | null>`CASE
            WHEN legacy_values->>'Status' IN (${sql.join(closedDemandStatuses)})
              AND (legacy_values->>'Date de la demande')::timestamptz < ${cutoff(businessRules.retentionDemandsClosedYears.value, 'years')}
            THEN (legacy_values->>'Date de la demande')::timestamptz
            ELSE deleted_at
          END`.as('date'),
        ])
        .orderBy('updated_at')
        .execute();
      return { count: Number(count), items, rule };
    }
    case 'processed_network_change_requests': {
      const { count } = await processedNetworkChangeRequestsQuery().select(kdb.fn.countAll<number>().as('count')).executeTakeFirstOrThrow();
      const items = await processedNetworkChangeRequestsQuery()
        .select(['id', 'network_label as label', 'processed_at as date'])
        .orderBy('processed_at')
        .execute();
      return { count: Number(count), items, rule };
    }
  }
};

/** The rows each retention rule would process today (full list, the admin reviews it before confirming). */
export const previewRetention = async (): Promise<RetentionPreview[]> => Promise.all(retentionRules.map(previewRule));

const applyRule = async (rule: RetentionRule): Promise<number> => {
  switch (rule) {
    case 'pending_accounts': {
      const deleted = await kdb.deleteFrom('users').where('id', 'in', pendingAccountsQuery().select('id')).executeTakeFirst();
      return Number(deleted.numDeletedRows);
    }
    case 'inactive_accounts': {
      // an unknown random password: nobody can log in, the row stays for the demands linked to it
      const unusablePassword = await hash(randomBytes(32).toString('hex'), await genSalt(10));
      const updated = await kdb
        .updateTable('users')
        .set({
          activation_token: null,
          active: false,
          email: sql<string>`${ANONYMIZED_EMAIL_PREFIX} || id::text || ${ANONYMIZED_EMAIL_DOMAIN}`,
          first_name: null,
          last_name: null,
          optin_at: null,
          password: unusablePassword,
          phone: null,
          reset_token: null,
          signature: null,
        })
        .where('id', 'in', inactiveAccountsQuery().select('id'))
        .executeTakeFirst();
      return Number(updated.numUpdatedRows);
    }
    case 'closed_demands': {
      const updated = await kdb
        .updateTable('demands')
        .set({
          comment_fcu: null,
          comment_gestionnaire: null,
          comment_user: null,
          legacy_values: sql`jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(legacy_values, '{Nom}', '"Anonymisé"'::jsonb, false),
                  '{Prénom}', '""'::jsonb, false),
                '{Mail}', to_jsonb(${ANONYMIZED_EMAIL_PREFIX} || id::text || ${ANONYMIZED_EMAIL_DOMAIN}), true),
              '{Téléphone}', '""'::jsonb, false),
            '{Commentaire}', '""'::jsonb, false)`,
          updated_at: new Date(),
        })
        .where('id', 'in', closedDemandsQuery().select('id'))
        .executeTakeFirst();
      return Number(updated.numUpdatedRows);
    }
    case 'processed_network_change_requests': {
      const requestIds = (await processedNetworkChangeRequestsQuery().select('id').execute()).map((request) => request.id);
      if (requestIds.length === 0) {
        return 0;
      }
      const fileIds = (
        await kdb.selectFrom('network_change_request_files').select('file_id').where('request_id', 'in', requestIds).execute()
      ).map((file) => file.file_id);
      // documents published on a network page keep their content: they belong to the network now
      const publishedFileIds =
        fileIds.length === 0
          ? []
          : (await kdb.selectFrom('network_files').select('file_id').where('file_id', 'in', fileIds).execute()).map((file) => file.file_id);
      await purgeFileContents(fileIds.filter((fileId) => !publishedFileIds.includes(fileId)));
      const updated = await kdb
        .updateTable('network_change_requests')
        .set({
          contact_email: sql<string>`${ANONYMIZED_EMAIL_PREFIX} || id::text || ${ANONYMIZED_EMAIL_DOMAIN}`,
          contact_first_name: '',
          contact_function: null,
          contact_last_name: 'Anonymisé',
          contact_structure: null,
          contact_type_other: null,
          // the commercial referent of a trace request is a person too
          payload: sql`payload - 'emailReferentCommercial'`,
          updated_at: new Date(),
        })
        .where('id', 'in', requestIds)
        .executeTakeFirst();
      return Number(updated.numUpdatedRows);
    }
  }
};

/**
 * Applies a retention rule (deletion or anonymization of the matching rows) and records the operation in the audit trail.
 * Manual and admin-driven on purpose: no cron deletes data silently.
 */
export const applyRetentionRule = async (rule: RetentionRule, adminUserId: string): Promise<{ rule: RetentionRule; count: number }> => {
  const count = await applyRule(rule);
  await createUserEvent({
    author_id: adminUserId,
    context_id: null,
    context_type: 'retention',
    data: { count, rule },
    type: 'data_retention_applied',
  });
  logger.info('retention rule applied', { count, rule, user_id: adminUserId });
  return { count, rule };
};
