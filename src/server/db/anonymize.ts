import { kdb, sql } from '@/server/db/kysely';

/** Admin accounts (the team) and accounts created locally (e.g. admin@fcu.local) keep their identity. */
const LOCAL_ACCOUNT_DOMAIN = '@fcu.local';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'host.docker.internal'];

/**
 * Guard: the command must never run against a remote database (production, staging, review apps).
 */
export const assertLocalDatabase = (databaseUrl: string) => {
  const host = new URL(databaseUrl).hostname;
  if (!LOCAL_HOSTS.includes(host)) {
    throw new Error(`Refus d'anonymiser une base distante (${host}). Cette commande ne s'applique qu'à une base locale.`);
  }
};

export type AnonymizationReport = Record<string, number>;

/**
 * Pseudonymizes every column holding personal data in a local copy of the production database, keeping the data
 * representative: addresses, geometries, network assignments, statuses, dates and volumes are untouched.
 * Identities, contact details, free-text comments, email contents, IPs and secrets are replaced.
 * Passwords are never rewritten (bcrypt hashes stay, nobody gets a known password) and admin accounts keep their email
 * so the team logs in locally with its production credentials.
 * `databaseUrl` is the connection string of the database `kdb` points to, checked against the local-host guard.
 */
export const anonymizeDatabase = async (databaseUrl: string): Promise<AnonymizationReport> => {
  assertLocalDatabase(databaseUrl);
  const report: AnonymizationReport = {};

  await kdb.transaction().execute(async (trx) => {
    const users = await trx
      .updateTable('users')
      .set({
        activation_token: null,
        email: sql<string>`role || '-' || id::text || ${LOCAL_ACCOUNT_DOMAIN}`,
        first_name: 'Prénom',
        last_name: sql<string>`'Nom ' || left(id::text, 8)`,
        phone: null,
        reset_token: null,
        signature: null,
      })
      .where('role', '<>', 'admin')
      .where('email', 'not like', `%${LOCAL_ACCOUNT_DOMAIN}`)
      .executeTakeFirst();
    report.users = Number(users.numUpdatedRows);

    // legacy_values keys are only rewritten when present (jsonb_set with create_missing = false)
    const demands = await trx
      .updateTable('demands')
      .set({
        comment_fcu: null,
        comment_gestionnaire: null,
        comment_user: null,
        legacy_values: sql`jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(legacy_values, '{Nom}', to_jsonb('Nom ' || left(id::text, 8)), false),
                '{Prénom}', '"Prénom"'::jsonb, false),
              '{Mail}', to_jsonb('demande-' || id::text || ${LOCAL_ACCOUNT_DOMAIN}), false),
            '{Téléphone}', '"0600000000"'::jsonb, false),
          '{Commentaire}', '""'::jsonb, false)`,
      })
      .executeTakeFirst();
    report.demands = Number(demands.numUpdatedRows);

    const demandsChaleurRenouvelable = await trx
      .updateTable('demands_chaleur_renouvelable')
      .set({
        comments: null,
        email: sql<string>`'demande-fcr-' || id::text || ${LOCAL_ACCOUNT_DOMAIN}`,
        first_name: 'Prénom',
        last_name: sql<string>`'Nom ' || left(id::text, 8)`,
      })
      .executeTakeFirst();
    report.demands_chaleur_renouvelable = Number(demandsChaleurRenouvelable.numUpdatedRows);

    const demandEmails = await trx
      .updateTable('demand_emails')
      .set({
        body: '[contenu anonymisé]',
        cc: null,
        object: '[objet anonymisé]',
        reply_to: null,
        signature: null,
        to: sql<string>`'demande-' || demand_id::text || ${LOCAL_ACCOUNT_DOMAIN}`,
        user_email: sql<string>`'gestionnaire-' || id::text || ${LOCAL_ACCOUNT_DOMAIN}`,
      })
      .executeTakeFirst();
    report.demand_emails = Number(demandEmails.numUpdatedRows);

    const blockedContacts = await trx
      .updateTable('email_blocked_contacts')
      .set({ email: sql<string>`'bloque-' || md5(email) || ${LOCAL_ACCOUNT_DOMAIN}` })
      .executeTakeFirst();
    report.email_blocked_contacts = Number(blockedContacts.numUpdatedRows);

    // audit trail: keep the event, drop the identifying payload (emails, field-level changes)
    const events = await trx
      .updateTable('events')
      .set({
        data: sql`(data - 'changes') || CASE WHEN data ? 'user_email' THEN '{"user_email": "anonymise@fcu.local"}'::jsonb ELSE '{}'::jsonb END`,
      })
      .where(sql<boolean>`data ? 'user_email' OR data ? 'changes'`)
      .executeTakeFirst();
    report.events = Number(events.numUpdatedRows);

    const conversionEvents = await trx
      .updateTable('conversion_events')
      .set({ ip: null, user_agent: null })
      .where(sql<boolean>`ip IS NOT NULL OR user_agent IS NOT NULL`)
      .executeTakeFirst();
    report.conversion_events = Number(conversionEvents.numUpdatedRows);

    const reminders = await trx.updateTable('network_reminders').set({ note: null }).where('note', 'is not', null).executeTakeFirst();
    report.network_reminders = Number(reminders.numUpdatedRows);

    const proTests = await trx
      .updateTable('pro_eligibility_tests')
      .set({ name: sql<string>`'Test ' || left(id::text, 8)` })
      .executeTakeFirst();
    report.pro_eligibility_tests = Number(proTests.numUpdatedRows);

    // partner tokens: production hashes must not stay usable from a laptop
    const credentials = await trx
      .updateTable('organization_api_credentials')
      .set({ token_hash: sql<string>`md5(random()::text)` })
      .executeTakeFirst();
    report.organization_api_credentials = Number(credentials.numUpdatedRows);
  });

  return report;
};
