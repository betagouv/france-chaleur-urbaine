import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE public.demands_chaleur_renouvelable
    SET outdoor_space = CASE outdoor_space
      WHEN 'shared' THEN 'jardinCours'
      WHEN 'private' THEN 'terrasseBalcon'
      WHEN 'both' THEN 'terrasseBalconEtJardinCours'
      ELSE outdoor_space
    END
    WHERE outdoor_space IN ('shared', 'private', 'both');
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE public.demands_chaleur_renouvelable
    SET outdoor_space = CASE outdoor_space
      WHEN 'jardinCours' THEN 'shared'
      WHEN 'terrasseBalcon' THEN 'private'
      WHEN 'terrasseBalconEtJardinCours' THEN 'both'
      ELSE outdoor_space
    END
    WHERE outdoor_space IN ('jardinCours', 'terrasseBalcon', 'terrasseBalconEtJardinCours');
  `.execute(db);
}
