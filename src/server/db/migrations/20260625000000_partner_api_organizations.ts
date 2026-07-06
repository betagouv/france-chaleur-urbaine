import type { Kysely } from 'kysely';
import { sql } from 'kysely';

// API partenaire + organisations : entité organisation (+ credentials API hashés), rattachement des ressources
// réseau, motifs `Gestionnaire`, provenance des comptes synchronisés, et index de polling des demandes.
export async function up(db: Kysely<any>): Promise<void> {
  // Organisations, credentials API, et organization_id sur les ressources réseau.
  await sql`
    CREATE TABLE organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      gestionnaire_patterns TEXT[] NOT NULL DEFAULT '{}'
    );
    CREATE UNIQUE INDEX idx_organizations_name ON organizations (lower(name));

    CREATE TABLE organization_api_credentials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      name TEXT,
      last_used_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX idx_org_api_credentials_token_hash ON organization_api_credentials (token_hash);
    CREATE INDEX idx_org_api_credentials_org ON organization_api_credentials (organization_id);

    ALTER TABLE reseaux_de_chaleur ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    ALTER TABLE reseaux_de_froid ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    ALTER TABLE zones_et_reseaux_en_construction ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    ALTER TABLE zone_de_developpement_prioritaire ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    CREATE INDEX idx_rdc_organization ON reseaux_de_chaleur (organization_id);
    CREATE INDEX idx_rdf_organization ON reseaux_de_froid (organization_id);
    CREATE INDEX idx_zerc_organization ON zones_et_reseaux_en_construction (organization_id);
    CREATE INDEX idx_zdp_organization ON zone_de_developpement_prioritaire (organization_id);
  `.execute(db);

  // Provenance des comptes provisionnés par une synchro API, par organisation.
  await sql`
    ALTER TABLE users ADD COLUMN from_organization_id UUID REFERENCES organizations (id) ON DELETE SET NULL;
  `.execute(db);

  // Index de l'API partenaire (filtre `updated_since`) : demandes vivantes et validées uniquement.
  await sql`
    CREATE INDEX IF NOT EXISTS idx_demands_updated_at
      ON demands (updated_at)
      WHERE deleted_at IS NULL AND validated = true;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_demands_updated_at;`.execute(db);
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS from_organization_id;`.execute(db);
  await sql`
    DROP INDEX IF EXISTS idx_zdp_organization;
    DROP INDEX IF EXISTS idx_zerc_organization;
    DROP INDEX IF EXISTS idx_rdf_organization;
    DROP INDEX IF EXISTS idx_rdc_organization;
    ALTER TABLE zone_de_developpement_prioritaire DROP COLUMN IF EXISTS organization_id;
    ALTER TABLE zones_et_reseaux_en_construction DROP COLUMN IF EXISTS organization_id;
    ALTER TABLE reseaux_de_froid DROP COLUMN IF EXISTS organization_id;
    ALTER TABLE reseaux_de_chaleur DROP COLUMN IF EXISTS organization_id;
    DROP TABLE IF EXISTS organization_api_credentials;
    DROP TABLE IF EXISTS organizations;
  `.execute(db);
}
