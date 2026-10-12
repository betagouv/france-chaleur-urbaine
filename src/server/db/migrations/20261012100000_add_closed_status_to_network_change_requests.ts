import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- 'closed': decided without publishing anything (reopenable), 'processed' now means something was published
    ALTER TABLE network_change_requests DROP CONSTRAINT network_change_requests_status_check;
    ALTER TABLE network_change_requests ADD CONSTRAINT network_change_requests_status_check CHECK (status IN ('pending', 'processed', 'closed'));

    -- one-off requalification of the decisions taken before the status existed, from their audit event
    UPDATE network_change_requests
    SET status = 'closed'
    WHERE status = 'processed'
      AND kind <> 'enquete'
      AND id::text IN (
        SELECT context_id FROM events
        WHERE type = 'network_change_request_processed' AND data->>'applied' = 'false'
      );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE network_change_requests SET status = 'processed' WHERE status = 'closed';
    ALTER TABLE network_change_requests DROP CONSTRAINT network_change_requests_status_check;
    ALTER TABLE network_change_requests ADD CONSTRAINT network_change_requests_status_check CHECK (status IN ('pending', 'processed'));
  `.execute(db);
}
