import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS events (
      id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
      author_id UUID REFERENCES users(id) ON DELETE SET NULL,
      type text NOT NULL,
      context_type TEXT,
      context_id TEXT, -- allows uuid or any text (like airtable id)
      created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      data jsonb DEFAULT '{}'::jsonb NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_events_author_id ON events(author_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
    CREATE INDEX IF NOT EXISTS idx_events_context ON events(context_type, context_id);
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS public.events;
  `);
}
