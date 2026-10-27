import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN notified_at timestamptz;
    COMMENT ON COLUMN public.demands_chaleur_renouvelable.notified_at IS 'Date de première notification aux CCRT (cron notifyCcrtOfNewDemands), null tant qu''aucun destinataire n''a été trouvé';
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      DROP COLUMN notified_at;
  `.execute(db);
}
