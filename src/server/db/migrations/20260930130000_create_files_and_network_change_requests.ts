import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- Uploaded files (public forms). The content is stored in the database and purged once it is no longer needed:
    -- the row (metadata) survives the purge so references stay valid.
    CREATE TABLE files (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      filename text NOT NULL,
      -- detected from the magic bytes at upload, never the value declared by the browser
      content_type text NOT NULL,
      size integer NOT NULL,
      sha256 text NOT NULL,
      content bytea,
      scan_status text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'error', 'skipped')),
      scan_details text,
      scanned_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      purged_at timestamp with time zone
    );

    -- Change requests submitted for a network (public forms, or created by the FEDENE import for a survey discrepancy), reviewed by an admin.
    CREATE TABLE network_change_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      kind text NOT NULL CHECK (kind IN ('fiche', 'trace_existant', 'trace_construction', 'pdp', 'autre', 'enquete')),
      -- 'form': submitted by a person (emails); 'import': created by a data import (no submitter, no email)
      origin text NOT NULL DEFAULT 'form' CHECK (origin IN ('form', 'import')),
      -- every request is processed (applied, or closed without change): there is no refusal
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
      network_type text CHECK (network_type IN ('reseau_de_chaleur', 'reseau_de_froid', 'reseau_en_construction', 'perimetre_de_developpement_prioritaire')),
      network_id integer,
      -- network as named by the submitter (search result label or free text when the network is unknown)
      network_label text NOT NULL,
      user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      contact_type text NOT NULL CHECK (contact_type IN ('collectivite', 'exploitant', 'autre')),
      contact_type_other text,
      -- null for import-created requests
      contact_first_name text,
      contact_last_name text,
      contact_email text,
      contact_structure text,
      contact_function text,
      -- kind-specific fields, validated by the zod schema of the kind
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
      processed_at timestamp with time zone,
      -- the submitter was emailed the publication (at processing, when something was published)
      notified boolean NOT NULL DEFAULT false,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CHECK ((network_type IS NULL) = (network_id IS NULL))
    );

    CREATE INDEX network_change_requests_pending_idx ON network_change_requests (created_at) WHERE status = 'pending';
    CREATE INDEX network_change_requests_network_idx ON network_change_requests (network_type, network_id);

    CREATE TABLE network_change_request_files (
      request_id uuid NOT NULL REFERENCES network_change_requests(id) ON DELETE CASCADE,
      file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      role text NOT NULL CHECK (role IN ('document', 'trace', 'pdp')),
      -- set when an admin replaced the file by a converted one (the original is kept for reference)
      replaced_at timestamp with time zone,
      PRIMARY KEY (request_id, file_id)
    );

    -- a file belongs to one request (the admin replacement inserts a new file)
    CREATE UNIQUE INDEX network_change_request_files_file_idx ON network_change_request_files (file_id);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS network_change_request_files;
    DROP TABLE IF EXISTS network_change_requests;
    DROP TABLE IF EXISTS files;
  `.execute(db);
}
