import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Create tags_reminders table
    CREATE TABLE IF NOT EXISTS tags_reminders (
      tag_id TEXT PRIMARY KEY REFERENCES tags(id) ON DELETE CASCADE,
      author_id uuid REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_tags_reminders_author_id ON tags_reminders(author_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS tags_reminders CASCADE;
  `);
}
