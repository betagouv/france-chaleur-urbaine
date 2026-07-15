import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- Tag catalog (source of truth: name + hex color).
    CREATE TABLE user_tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- Case- and accent-insensitive uniqueness (matches the legacy "tags" table convention).
    CREATE UNIQUE INDEX user_tags_name_unique ON user_tags (immutable_unaccent(lower(name)));

    -- users <-> tags join. Renaming/recoloring happens on user_tags (stable id);
    -- deleting a tag removes it from every user via ON DELETE CASCADE.
    CREATE TABLE user_tag_assignments (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tag_id UUID NOT NULL REFERENCES user_tags(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, tag_id)
    );
    CREATE INDEX user_tag_assignments_tag_id_idx ON user_tag_assignments (tag_id);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS user_tag_assignments;
    DROP TABLE IF EXISTS user_tags;
  `.execute(db);
}
