import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- Geometry extracted server-side (ogr2ogr) from the geo files of a change request, per role (trace / pdp), in WGS84 GeoJSON.
    -- Admins never open the uploaded files: the geometry is applied to the network when the request is processed.
    CREATE TABLE network_change_request_geometries (
      request_id uuid NOT NULL REFERENCES network_change_requests(id) ON DELETE CASCADE,
      role text NOT NULL CHECK (role IN ('trace', 'pdp')),
      geometry jsonb,
      error text,
      parsed_at timestamp with time zone NOT NULL DEFAULT now(),
      PRIMARY KEY (request_id, role),
      CHECK ((geometry IS NULL) <> (error IS NULL))
    );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS network_change_request_geometries;
  `.execute(db);
}
