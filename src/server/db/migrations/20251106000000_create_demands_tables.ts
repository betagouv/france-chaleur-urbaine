import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Create demands table
    CREATE TABLE IF NOT EXISTS demands (
      id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
      airtable_id TEXT,
      legacy_values jsonb NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    -- Targeted indexes on specific JSONB fields (more efficient than a global GIN index)

    -- Date fields (used for sorting and date range filters)
    CREATE INDEX IF NOT EXISTS idx_demands_date_demande ON demands ((legacy_values->>'Date de la demande'));

    -- Boolean/status fields (used for filtering)
    CREATE INDEX IF NOT EXISTS idx_demands_gestionnaires_valides ON demands ((legacy_values->>'Gestionnaires validés'))
      WHERE legacy_values->>'Gestionnaires validés' = 'true';
    CREATE INDEX IF NOT EXISTS idx_demands_status ON demands ((legacy_values->>'Status'))
      WHERE legacy_values->>'Status' IS NOT NULL;

    -- Notification fields (used for filtering pending notifications)
    CREATE INDEX IF NOT EXISTS idx_demands_notification_envoye ON demands ((legacy_values->>'Notification envoyé'));
    CREATE INDEX IF NOT EXISTS idx_demands_relance_a_activer ON demands ((legacy_values->>'Relance à activer'))
      WHERE legacy_values->>'Relance à activer' = 'true';

    -- ID field for exact lookups
    CREATE INDEX IF NOT EXISTS idx_demands_relance_id ON demands ((legacy_values->>'Relance ID'))
      WHERE legacy_values->>'Relance ID' IS NOT NULL;

    -- GIN index ONLY for the Gestionnaires array field (used with ?| operator)
    CREATE INDEX IF NOT EXISTS idx_demands_gestionnaires_gin ON demands USING gin ((legacy_values->'Gestionnaires'));

    -- Create demand_emails table
    CREATE TABLE IF NOT EXISTS demand_emails (
      id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
      airtable_id TEXT,
      demand_id uuid NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
      email_key TEXT NOT NULL,
      "to" TEXT NOT NULL,
      cc TEXT,
      reply_to TEXT,
      object TEXT NOT NULL,
      body TEXT NOT NULL,
      signature TEXT,
      user_email TEXT NOT NULL,
      sent_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    -- Create indexes for demand_emails
    CREATE INDEX IF NOT EXISTS idx_demand_emails_demand_id ON demand_emails (demand_id);
    CREATE INDEX IF NOT EXISTS idx_demand_emails_email_key ON demand_emails (email_key);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS demand_emails CASCADE;
    DROP TABLE IF EXISTS demands CASCADE;
  `);
}
