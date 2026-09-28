# Module communes-sans-reseau

> Support requests from municipalities without a heat network, submitted from the public page `/collectivites-et-exploitants/potentiel-creation-reseau` (and its `/iframe/potentiel-creation-reseau` variant). Records are stored in the FCU Grist doc « Formulaires », table `Communes_sans_reseau` (Airtable is no longer used for this form).

## Structure

```
communes-sans-reseau/
├── AGENTS.md
├── constants.ts                            # zCreateDemandeCommuneSansReseauInput (codeInsee + email only)
├── client/
│   └── useSubmitDemandeCommuneSansReseau.ts  # hook returning the `<Newsletter onSignUp>` callback (tracking + mutation + toast)
└── server/
    ├── service.ts                          # Grist write (createDemandeCommuneSansReseau) + monthly count for stats
    ├── service.spec.ts
    └── trpc-routes.ts                      # router `communesSansReseau` (public, rate-limited)
```

## Behavior

- The client sends only `codeInsee` + `email`: the server recomputes the commune and its potentials with `getCommunePotentiel` (`src/server/services/communeAPotentiel.ts`) and rejects emails from `serverConfig.email.notAllowed`.
- Grist column ids are mapped in a single place: the `GristCommuneSansReseauFields` type in `server/service.ts`. Columns managed by hand in Grist (`Status`, `Commentaire`, `Email_2`, `Non_partage_AMORCE_CEREMA`) are never written.
- `Date_de_creation` is a Grist **Date** column (unix seconds at midnight UTC), set explicitly by the server.
- Writes require `GRIST_API_KEY` and `GRIST_ALLOW_WRITES=true` (production only; without it the record is skipped with a warning so dev/review apps never pollute the shared doc). Reads only require the key.
- The monthly stat « Villes Potentiel - Demandes » (`aggregateMonthlyStats` cron, method `Grist`) reads all Grist records and counts them by month with `countDemandesCommunesSansReseauByMonth` (the Grist API filters by equality only; the table is small).
