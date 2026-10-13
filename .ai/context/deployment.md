# Deployment

## Environments
| Env | Branch | Database |
|-----|--------|----------|
| Local | any | local Docker Postgres |
| Review app | PR | **shared dev DB, migrations disabled** |
| Staging | `dev` | dedicated staging DB |
| Production | `main` | production DB (france-chaleur-urbaine.beta.gouv.fr) |

Scalingo spawns a review app per PR. Staging→prod is ideally a fast-forward `dev`→`main`. (Flow + CI: see git-workflow.md.)

## Hosting: Scalingo (osc-fr1, app `france-chaleur-urbaine`)
- **Buildpacks, order matters**: `apt-buildpack` (GDAL) → `france-chaleur-urbaine-scalingo-buildpack` (Tippecanoe) → `nodejs-buildpack`.
- **Required env vars** (for GDAL/proj):
  ```bash
  LD_LIBRARY_PATH=/app/.apt/usr/lib/x86_64-linux-gnu/blas/:/app/.apt/usr/lib/x86_64-linux-gnu/lapack/
  PROJ_LIB=/app/.apt/usr/share/proj
  ```
- Migrations run on deploy (prod + staging) via `pnpm db:migrate`; **disabled on review apps**. Never force-reset the production DB.
- Rollback via the Scalingo dashboard. Deploy notifications → Mattermost.

## Background processing
- Job processor: `pnpm start:clock` (or `pnpm cli jobs start`); crons gated by `CLOCK_CRONS_ENABLE=true`.
- Job types: `build_tiles`, `pro_eligibility_test`, `pro_eligibility_test_notify_changes`, `scan_file` (antivirus, when `FILE_SCANNER=clamav`), `parse_request_geometries` (ogr2ogr conversion of the geo files of a network change request: runs in the clock process, GDAL required there).

## Airtable exit (one-off, right after the deployment of `migration_airtable_reseaux`)
- `pnpm cli reseaux:import-airtable-metadata [--dry-run]`: last copy of the survey figures and, above all, the split of the provenance of name / gestionnaire / MO (`*_fedene` from the FEDENE per-edition Airtable columns, `*_fcu` when the Airtable value differs). Until it runs, every value sits in `*_fedene` (no « corrected by FCU » mention anywhere).
- `pnpm cli reseaux:import-airtable-documents [--dry-run]`: PDF documents of the networks into the `files` table.
- Then regenerate the network tiles (Sync in the admin) so the map popups carry the `gestionnaire_source_fcu` flag.

## Monitoring
- **Sentry** (errors, sentry.incubateur.net, betagouv/fcu-prod), **Matomo** (stats.beta.gouv.fr), **PostHog** (product analytics, tunneled via Next rewrites), **Winston** (structured logs via the tRPC context logger — no PII).
- Local SQL logging: `LOG_SQL_QUERIES=true` (+ `LOG_SQL_QUERIES_PRETTY=true`).

## Troubleshooting
- Build fails → run `pnpm build` locally (usual causes: missing env var, type error, 8 GB limit).
- Geo tools fail → install GDAL (`ogr2ogr`, `ogrinfo`) and `tippecanoe` locally; buildpacks on Scalingo.
