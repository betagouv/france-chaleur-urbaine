# fedene-survey module

Yearly update of the heat and cold networks from the FEDENE library, and decision of the survey discrepancies, on the admin page `/admin/enquete-fedene` (not in the admin menu: linked from `/admin/modifications-reseau` and from the dashboard indicator).

> Product documentation (French): `/admin/doc/gestion-reseaux`, section « Enquête FEDENE » (`src/modules/doc/content/gestion-reseaux.mdx`). Update it and run `pnpm doc:build-search-index` for any behavior change.

## Structure

- `constants.ts` — discrepancy fields (`nomReseau`, `gestionnaire`, `maitreOuvrage`: keys of the `enquete` request payload) and their `*_fcu` columns, decisions (`keep_fcu`, `restore_fedene`) with labels, zod inputs.
- `text-diff.ts` — `diffValues(left, right)`: word-level comparison (LCS on words folded for case and accents) giving, for each side, the words without counterpart (`different`) and those that only changed case or accents (`variant`); highlighted on the page.
- `server/service.ts` — `importFedeneFile` (the uploaded xlsx read from the `files` table, `importFedeneRows` of the data import, synchronous: a few seconds; simulation = nothing written, report with cleared corrections and discrepancies to come; real import = `syncLinkedNetworkFields` for the extensions, `fedene_survey_imported` event, tiles rebuild), `listSurveyDiscrepancies` (one entry per pending `enquete` request with its undecided fields, FCU value read on the network), `clearSurveyDiscrepancies` (deletes the pending ones, `fedene_survey_discrepancies_cleared` event), `resolveSurveyDiscrepancy` (locks the request; `restore_fedene` sets the `*_fcu` column to null, `network_updated` event, extensions synced and tiles rebuilt with `replace`; the request is `processed` once every field has a decision, `network_change_request_processed` event).
- `server/trpc-routes.ts` — `fedeneSurvey.*`, all admin: `previewImport`, `applyImport`, `listDiscrepancies`, `resolveDiscrepancy`, `clearDiscrepancies`.
- `client/FedeneSurveyPage.tsx` — the page: import form (xlsx uploaded through `POST /api/files/upload`, simulation = dry-run, then « Appliquer » on the simulated file), one card per network listing its fields, each value (words differing highlighted by `diffValues`) with the decision that keeps it right below, « Vider les écarts en attente » (confirmation).

## Rules

- No survey edition: a correction kept by the admin (`decisions.<field> = keep_fcu` on a processed request) is not proposed again while the survey reports the same value (normalized); another value proposes it again. A pending request keeps its decisions while the survey value of the field is unchanged.

## Integration

- The import itself lives in `src/modules/data/server/imports/donnees-reseaux-bibliotheque-fedene.ts` (also run by `pnpm cli data import donnees-reseaux-bibliotheque-fedene`); it creates / refreshes the `enquete` requests through `upsertSurveyDiscrepancyRequest` (network-change-requests module).
- Survey discrepancies are excluded from the submitted requests (`/admin/modifications-reseau`) and counted apart on the admin dashboard (`surveyDiscrepanciesPending`).
