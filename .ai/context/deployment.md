# Deployment

## Environments
| Env | Branch | Database |
|-----|--------|----------|
| Local | any | local Docker Postgres |
| Review app | PR | **shared dev DB, migrations disabled** |
| Staging | `dev` | dedicated staging DB |
| Publicodes dev (`france-chaleur-urbaine-dev-publicodes`) | `dev` + `PUBLICODES_BRANCH=dev` | **shared staging DB, migrations disabled** (`IS_REVIEW_APP=true`) |
| Production | `main` | production DB (france-chaleur-urbaine.beta.gouv.fr) |

Scalingo spawns a review app per PR. Staging→prod is ideally a fast-forward `dev`→`main`. (Flow + CI: see git-workflow.md.)

## Publicodes dependency
- `@betagouv/france-chaleur-urbaine-publicodes` is pinned to a published npm version in `package.json`; that is what prod and staging ship.
- `scripts/fetch-publicodes-branch.sh` (run by `scalingo-postbuild` and CI before `pnpm build`) swaps it for a publicodes branch built from source when: `PUBLICODES_BRANCH` is set (build fails if the branch does not exist), or a publicodes branch has the same name as the current fcu branch (CI and review apps; `dev`/`main` excluded). Otherwise no-op: PR builds stay on the npm version, so CI is deterministic and matches staging/prod. A fcu PR that needs unreleased rules opts in by creating a publicodes branch with the same name (even empty, branched from `dev`); to preview publicodes `dev` on a single review app, set `PUBLICODES_BRANCH=dev` by hand on that app.
- The publicodes dev app deploys fcu `dev` with `PUBLICODES_BRANCH=dev`: redeployed on every fcu `dev` push (Scalingo SCM link) and on every publicodes `dev` push (`build.yaml` of the publicodes repo triggers a Scalingo deployment of fcu `dev`). Never deploy it from a dedicated fcu branch: it would lag behind the staging DB schema.

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

## Backups
- Scalingo: daily automatic PostgreSQL backups (`scalingo --app france-chaleur-urbaine --addon <id> backups`).
- Off-Scalingo encrypted copy, run manually: `pnpm backup:prod` (`scripts/backup/`, README there) — latest Scalingo DB backup, env vars + deployed git ref, all Grist docs of the org, git bundle; `age` encryption to the public key in `scripts/backup/.env`, secret key kept in a password manager and prompted only by `pnpm backup:decrypt`.

## Monitoring
- **Sentry** (errors, sentry.incubateur.net, betagouv/fcu-prod): init options shared by the 3 runtimes in `src/config/sentry.ts`; `environment` is `production` only on the production site (`clientConfig.isProductionSite`, derived from `NEXT_PUBLIC_SITE_URL`), `development` everywhere else. **Matomo** (stats.beta.gouv.fr), **PostHog** (product analytics, tunneled via Next rewrites), **Winston** (structured logs via the tRPC context logger — no PII).
- Local SQL logging: `LOG_SQL_QUERIES=true` (+ `LOG_SQL_QUERIES_PRETTY=true`).

## Troubleshooting
- Build fails → run `pnpm build` locally (usual causes: missing env var, type error, 8 GB limit).
- Geo tools fail → install GDAL (`ogr2ogr`, `ogrinfo`) and `tippecanoe` locally; buildpacks on Scalingo.
