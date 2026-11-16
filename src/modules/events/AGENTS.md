# Events Module

Audit system: logs user and system actions for traceability.

## Structure

```
events/
├── constants.ts                 # EventType, eventTypeLabels, EventDataMap, granularities
├── client/
│   ├── AdminEventsPage.tsx      # Admin dashboard page (Grafana-style)
│   ├── EventsDashboardHeader.tsx
│   ├── EventsFiltersBar.tsx
│   ├── EventsList.tsx
│   ├── EventRow.tsx
│   ├── EventsStatsSection.tsx
│   ├── useEventsFilters.ts      # URL-persisted filters via nuqs
│   └── types.ts
└── server/
    ├── service.ts               # Kysely queries (list, stats, create)
    ├── trpc-routes.ts           # Admin-only tRPC routes (list, getStats, searchAuthors, getAuthorsByIds)
    └── trpc-routes.integration.spec.ts
```

## Key points

- **Admin-only access**: all tRPC routes are protected by `routeRole('admin')`.
- **Event types**: defined in `constants.ts` (`eventTypes` array + `EventType` union). Adding a new type requires updating `eventTypeLabels` and `EventDataMap` too.
- **Label wording** (`eventLabelRenderers` in `client/EventRow.tsx`): the row prefixes the label with the author's email, so a label of an event with an author starts with the verb (« a supprimé… »). An event without author (cron, CLI command, public form, API sync) has nothing before its label: it must be a full sentence with the subject (« La demande a été supprimée automatiquement », « Le compte a été prévenu… »), never a verb that reads as if the author were missing.
- **`EventDataMap`**: maps each `EventType` to its `data` type — enables strongly-typed `AdminEvent`.
- **Account identity in payloads**: the email of the account an event is about lives in the `user_email` / `email` keys, and `changes` holds the changed values. `anonymizeAccountsInEvents` (called when an account is deleted or anonymized) replaces exactly those emails with the anonymized email of the account and nulls the values of `changes`. A payload storing the account identity under another key would survive the end of the account. Events are never deleted with an account deleted by an admin: the `users` row stays (soft delete), so the author join still resolves.
- **Service**: exposes `listEvents`, `getEventsStats`, `createEvent`, `createUserEvent`, `searchAuthors`, `getAuthorsByIds`. All queries go through Kysely.
- **Client dashboard**: URL-persisted filters (nuqs), time series + type distribution chart, cursor-based pagination.

## Tests

- File: `server/trpc-routes.integration.spec.ts` (integration, real DB).
- Permission pattern: `TestCaseBoolean<Partial<User> | null>` + `testPermissions` helper with forEach.
- Seed helper: `seedEvents` using `Pick<Insertable<Events>, ...>` + `Promise.all`.
