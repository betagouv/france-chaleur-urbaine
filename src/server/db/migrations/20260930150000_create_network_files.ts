import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- Documents published on a network page (schéma directeur…), previously Airtable attachments in the "fichiers" column.
    -- No foreign key to the network: the 4 network entities live in different tables.
    CREATE TABLE network_files (
      network_type text NOT NULL CHECK (network_type IN ('reseau_de_chaleur', 'reseau_de_froid', 'reseau_en_construction', 'perimetre_de_developpement_prioritaire')),
      network_id integer NOT NULL,
      file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      position integer NOT NULL DEFAULT 0,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      PRIMARY KEY (network_type, network_id, file_id)
    );

    CREATE INDEX network_files_file_idx ON network_files (file_id);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS network_files;
  `.execute(db);
}
