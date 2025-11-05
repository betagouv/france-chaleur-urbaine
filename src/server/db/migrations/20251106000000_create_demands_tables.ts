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

    -- GIN index on legacy_values for efficient JSONB queries
    CREATE INDEX IF NOT EXISTS idx_demands_legacy_values ON demands USING gin (legacy_values);

    -- Index on deleted_at for soft delete queries
    CREATE INDEX IF NOT EXISTS idx_demands_deleted_at ON demands (deleted_at) WHERE deleted_at IS NULL;

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
    CREATE INDEX IF NOT EXISTS idx_demand_emails_deleted_at ON demand_emails (deleted_at) WHERE deleted_at IS NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS demand_emails CASCADE;
    DROP TABLE IF EXISTS demands CASCADE;
  `);
}
