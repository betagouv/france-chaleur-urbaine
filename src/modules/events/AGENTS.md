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
- **`EventDataMap`**: maps each `EventType` to its `data` type — enables strongly-typed `AdminEvent`.
- **Service**: exposes `listEvents`, `getEventsStats`, `createEvent`, `createUserEvent`, `searchAuthors`, `getAuthorsByIds`. All queries go through Kysely.
- **Client dashboard**: URL-persisted filters (nuqs), time series + type distribution chart, cursor-based pagination.

## Tests

- File: `server/trpc-routes.integration.spec.ts` (integration, real DB).
- Permission pattern: `TestCaseBoolean<Partial<User> | null>` + `testPermissions` helper with forEach.
- Seed helper: `seedEvents` using `Pick<Insertable<Events>, ...>` + `Promise.all`.
