# Module conversion-tracking

> Mesure d'audience **first-party, côté serveur** du **funnel de conversion** : affichages → tests
> d'adresse (éligibles / non) → demandes, par intégration iframe et par page interne.
> Remplace Matomo/PostHog (adbloqués / consentement impossible en iframe) pour ces KPIs.

## Structure

```
conversion-tracking/
├── AGENTS.md
├── constants.ts          # event types, canaux, granularités + schémas Zod
├── client/
│   ├── trackingContext.ts          # getConversionSource() (?source=), getTrackingContext() (inIframe + host),
│   │                               # isTrackablePage() (guard /admin), getDemandOrigin() (demands.origin_*)
│   ├── useRecordConversionEvent.ts # hook d'émission fire-and-forget — point d'entrée unique des call sites
│   ├── useTrackPageView.ts         # beacon `display` au montage, bâti sur useRecordConversionEvent
│   └── ConversionStatsPage.tsx     # écran admin « conversion par source » (/admin/conversion)
└── server/
    ├── service.ts        # logique métier (insert event, CRUD sources, agrégat stats, purge IP)
    └── trpc-routes.ts    # routeur `conversionTracking`
```

## Modèle

- **Niveau 1 = `source ?? route`**, résolu à l'affichage des stats :
  - `source` (nullable) : id (uuid) d'intégration iframe, lu **à l'instant de l'event** dans le `?source=` de
    l'URL (`getConversionSource`). **Aucune persistance** (attribution stricte à l'atterrissage) : l'URL de
    l'iframe la porte en permanence, `/iframe/form` la propage (avec `&host=`) dans son URL de redirection,
    et toute navigation fait retomber les events sur la route.
  - `route` : pattern de route Next de la surface (`router.pathname`, ex. `/villes/[ville]`) — l'axe
    d'agrégation des pages internes, sans registre ni taxonomie à maintenir.
- **Canal** (`iframe` / `internal`) : dérivé de l'event — `source` présente ou `route` `/iframe/*` = iframe,
  sinon page interne. Rien n'est stocké pour ça.
- **Drills** : `page` (pathname exact, ex. `/villes/charleville`) et `host` (page embarquante, valeur la
  plus précise disponible normalisée en domaine + pathname, sans protocole — souvent réduite au domaine
  par le `Referrer-Policy` du partenaire ; referrer en iframe, `?host=` après la redirection de
  `/iframe/form`).

## Périmètre & frontières

- **Possède** : tables `conversion_sources` (registre des intégrations iframe : `id` uuid = `source=`, label,
  snapshot `config`, `archived_at`) et `conversion_events` (log append-only).
- **Funnel autonome** : les 3 events (`display`, `address_test`, `demand`) sont émis **côté client** via
  `useRecordConversionEvent` → `getStats` lit la seule table `conversion_events`. Les colonnes
  `demands.origin_source` / `origin_page` / `origin_host` sont **du bonus** (posées via `getDemandOrigin()`
  dans les payloads de création), pas la source du funnel.
- **Câblage** : `display` via `useTrackPageView()` (sans argument) sur `/iframe/carte`, `/iframe/form` et
  toutes les pages internes portant un test d'adresse ; `address_test` / `demand` depuis le hub
  `useContactFormFCU`, plus `ComparateurPublicodes` et `EligibilityTestBox` en direct. La preview admin est
  exclue par le guard `/admin` (`isTrackablePage`, dans le hook).
- **Admin** : générateur persistant `/admin/iframes` (CRUD du registre + config, iframes carte **et** form,
  `?source=` dans le code) et écran `/admin/conversion` (`getStats` ; filtre `?source=` en URL via nuqs —
  la colonne Source de `/admin/demandes` pointe dessus). CRUD = procédures tRPC explicites.
- **Lignes à zéro** (`period: null`) : intégrations actives du registre sans event sur la période, et routes
  internes vues sur les 12 derniers mois mais muettes (détection d'intégration non déployée / tracking cassé).
- **`unregistered`** : symétrique des lignes à zéro — une `source` reçue mais **absente du registre**
  (id erroné, intégration non enregistrée). Posé par `getStats`, signalé par un badge dans `/admin/conversion`.
- **Ne fait pas** : pas de tracking client tiers (PostHog/Matomo restent dans `analytics` ; le
  `ContactFormContext` de `useContactFormFCU` ne sert plus qu'à eux).
- `ip` / `user_agent` = **anti-abus uniquement**, purgés (~90 j) par cron, jamais en UI. `host` = analytics
  **retenu**. Base légale : intérêt légitime.

## Routes tRPC (`conversionTracking`)

| Procédure | Type | Auth | Description |
|---|---|---|---|
| `recordEvent` | mutation | public (rate-limité 60/min) | Enregistre un event (`source?`, `route`, `page`, `host?`, `eligible?`). IP/UA ajoutés serveur ; **bots ignorés** (`isbot` sur l'UA, drop silencieux — fiabilise les affichages). |
| `getStats` | query | admin | Funnel niveau 1 (`source ?? route`) × période (+ drills `groupByPage`/`groupByHost`, filtres `source`/`channel`). Lignes à zéro incluses. |
| `sources.list` | query | admin | Registre des intégrations (option `includeArchived`). |
| `sources.create` | mutation | admin | Crée une intégration (label, `config`) ; l'`id` uuid généré sert de `source=`. |
| `sources.update` | mutation | admin | Met à jour label / config. |
| `sources.archive` | mutation | admin | Soft-delete (préserve l'historique d'events). |

Chaque mutation `sources.*` émet un event d'audit `conversion_source_created` / `_updated` / `_archived`
(module `events`, visible dans `/admin/events`).

## Tables possédées

- `conversion_sources` : `id` uuid (= `source=`), `label`, `config` jsonb (snapshot params iframe),
  `archived_at`. Aucun seed.
- `conversion_events` : `source` (nullable), `route` + `page` (NOT NULL), `host`, `type`
  (`display`/`address_test`/`demand`), `eligible`, `ip`, `user_agent`, `created_at`.
  Index B-tree `(created_at)` (toutes les lectures filtrent par plage de dates ; pas de BRIN car la
  purge UPDATE chaque ligne à ~90 j) + partiel `(created_at) WHERE ip IS NOT NULL` pour la purge.
- `demands.origin_source` / `origin_page` / `origin_host` — colonnes **bonus** (hors module, écrites par
  `createDemand`). `origin_host` = page embarquante, décisive pour attribuer une demande iframe au partenaire.

## Dépendances

- `@/server/db/kysely` (kdb, sql), `@/modules/trpc/server` (route/adminRoute/router),
  `@/modules/events` (audit `conversion_source_*`).
- Cron `purgeOldConversionEventIps` enregistré dans `src/server/cron/cron.ts`.

## Usage

```ts
// Client : émission d'un event depuis une surface trackée (iframe / page)
const recordConversionEvent = useRecordConversionEvent();
recordConversionEvent('address_test', { eligible });
recordConversionEvent('demand', { eligible }); // émis depuis useContactFormFCU (handleOnSubmitContact)
useTrackPageView(); // beacon `display` au montage
// Demande : colonnes bonus posées via { ...getDemandOrigin() } dans le payload de création.
```
