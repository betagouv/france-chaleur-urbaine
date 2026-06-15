import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS idx_demands_gestionnaires_gin;
    DROP INDEX IF EXISTS idx_demands_gestionnaires_valides;

    UPDATE demands
       SET legacy_values = legacy_values
         - 'Gestionnaires'
         - 'Affecté à'
         - 'Gestionnaires validés'
         - 'Gestionnaire Affecté à';

    DROP TABLE IF EXISTS tags_reminders;
    DROP TABLE IF EXISTS tags;
    DROP TABLE IF EXISTS assignment_rules;

    ALTER TABLE users DROP COLUMN IF EXISTS gestionnaires;
    ALTER TABLE users DROP COLUMN IF EXISTS gestionnaires_from_api;

    ALTER TABLE api_accounts DROP COLUMN IF EXISTS gestionnaires;
    ALTER TABLE api_accounts DROP COLUMN IF EXISTS networks;

    ALTER TABLE reseaux_de_chaleur DROP COLUMN IF EXISTS tags;
    ALTER TABLE zones_et_reseaux_en_construction DROP COLUMN IF EXISTS tags;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE reseaux_de_chaleur ADD COLUMN tags text[] DEFAULT '{}'::text[] NOT NULL;
    ALTER TABLE zones_et_reseaux_en_construction ADD COLUMN tags text[] DEFAULT '{}'::text[] NOT NULL;

    ALTER TABLE api_accounts ADD COLUMN networks character varying(255)[];
    ALTER TABLE api_accounts ADD COLUMN gestionnaires character varying(255)[];

    ALTER TABLE users ADD COLUMN gestionnaires_from_api text[] DEFAULT '{}';
    ALTER TABLE users ADD COLUMN gestionnaires text[] DEFAULT '{}';

    CREATE TABLE assignment_rules (
      id character varying(255) PRIMARY KEY DEFAULT gen_random_uuid(),
      search_pattern character varying(255) NOT NULL,
      result character varying(255) NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE tags (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      type text,
      comment text,
      created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE tags_reminders (
      tag_id uuid PRIMARY KEY REFERENCES tags(id) ON DELETE CASCADE,
      author_id uuid REFERENCES users(id) ON DELETE SET NULL,
      note text,
      created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_tags_reminders_author_id ON tags_reminders USING btree (author_id);

    CREATE INDEX idx_demands_gestionnaires_gin ON demands USING gin (((legacy_values -> 'Gestionnaires'::text)));
    CREATE INDEX idx_demands_gestionnaires_valides ON demands USING btree (((legacy_values ->> 'Gestionnaires validés'::text)))
      WHERE ((legacy_values ->> 'Gestionnaires validés'::text) = 'true'::text);
  `.execute(db);
}
