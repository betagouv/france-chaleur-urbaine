# Metrics Module

> Prometheus-compatible metrics endpoint for Node.js process monitoring (heap, GC, event loop, RSS, CPU).

## Structure

```
metrics/
├── AGENTS.md
└── server/
    ├── api.ts             # Bearer-protected Next.js API handler
    └── registry.ts        # prom-client default registry + idempotent init
```

## Purpose and boundaries

Exposes Node.js runtime metrics in Prometheus text format on `/api/metrics`, protected by a Bearer token. Intended for debugging memory leaks, OOM crashes, GC pressure, and CPU/event-loop saturation.

This module owns:
- `prom-client` default registry initialization (idempotent, safe with hot-reload).
- The list of metrics exposed (currently only `collectDefaultMetrics`).

This module must NOT:
- Define tRPC routes (Prometheus scrapes plain HTTP, not tRPC).
- Track business events (use `events` module instead).
- Track product analytics (use `analytics` module — Matomo/PostHog).

## Public API

### `initMetrics()`

Idempotent: sets default labels and enables `prom-client.collectDefaultMetrics()` once. Called from `src/instrumentation.ts` on the Node.js runtime so metrics start collecting at server start, and re-called lazily from the route handler as a defensive fallback.

### `metricsRegister`

The default `prom-client` registry, deduplicated via `globalThis.__fcuPromRegister__` so `instrumentation.ts` and `pages/api` (separate Next.js bundles) share the same Registry instance.

## Default labels

Set on every emitted sample via `metricsRegister.setDefaultLabels`:

| Label | Value | Purpose |
|-------|-------|---------|
| `instance` | `serverConfig.CONTAINER` (Scalingo `web-1`, `web-2`...) or `os.hostname()` fallback | Distinguishes dynos when running multiple instances |
| `app` | `serverConfig.APP` (Scalingo app name, e.g. `france-chaleur-urbaine` or `france-chaleur-urbaine-pr-123`) or `'local'` fallback | Separates prod from review apps when both push to the same Grafana |

## Endpoint

`GET /api/metrics` — handler in `server/api.ts`, exposed by `src/pages/api/metrics.ts` (thin re-export).

- Auth: `Authorization: Bearer <METRICS_AUTH_TOKEN>` (timing-safe compare).
- Returns 404 when `METRICS_AUTH_TOKEN` is unset (endpoint disabled).
- Returns 401 on missing/invalid token.
- Returns Prometheus text format (`Content-Type: text/plain; version=0.0.4`).

## Default metrics exposed

From `prom-client.collectDefaultMetrics()` (Node.js runtime + process):

- `nodejs_heap_size_total_bytes`, `nodejs_heap_size_used_bytes` — V8 heap (OOM heap detection).
- `nodejs_external_memory_bytes` — buffers (Sharp, Tippecanoe pipes).
- `process_resident_memory_bytes` — RSS (OOM kernel detection).
- `nodejs_eventloop_lag_seconds` — event loop saturation.
- `nodejs_gc_duration_seconds` (by `kind`) — GC pressure (early leak signal).
- `nodejs_active_handles`, `nodejs_active_requests` — socket/timer leaks.
- `process_cpu_user_seconds_total`, `process_cpu_system_seconds_total` — CPU time.

## Adding custom metrics

```ts
// in any server file
import client from 'prom-client';

export const tilesGenerated = new client.Counter({
  name: 'fcu_tiles_generated_total',
  help: 'Total tiles generated',
  labelNames: ['layer'],
});
```

Metrics auto-register on the default registry, so `/api/metrics` will expose them. Watch label cardinality: avoid unbounded values (`userId`, `demandId`).

## Configuration (Scalingo)

1. Generate a token: `openssl rand -hex 32`.
2. Set `METRICS_AUTH_TOKEN=<token>` in Scalingo env.
3. Configure scraper (Grafana Cloud / Prometheus):

```yaml
- job_name: fcu
  honor_labels: true        # MANDATORY: keeps the `instance`/`env` labels we emit
  metrics_path: /api/metrics
  scheme: https
  scrape_interval: 30s
  authorization:
    type: Bearer
    credentials: <METRICS_AUTH_TOKEN>
  static_configs:
    - targets: ['france-chaleur-urbaine.beta.gouv.fr']
```

`honor_labels: true` is required: without it, Prometheus overrides the `instance` label we set with the scrape target hostname, collapsing all dynos into a single time series.

## Multi-instance behavior on Scalingo

Scalingo's HTTP router round-robins between dynos. With N instances and a single public scrape URL:

- Each scrape hits a different dyno (per-dyno effective interval ≈ N × `scrape_interval`).
- The `instance` default label distinguishes them in Grafana.
- Verify with `count by (instance) (nodejs_heap_size_used_bytes{job="fcu"})` — should equal N within ~2 minutes.

If you only see one `instance` after several minutes, the scraper is reusing a keep-alive connection pinned to one dyno. Either disable connection reuse on the scraper or switch to a push model (each dyno pushes via remote-write or OTLP).

**Counter resets**: dyno respawns (OOM kill, deploy, scale) reset all counters. Use PromQL `rate()` (handles resets natively); avoid raw counter sums over long windows.

## Dependencies

- `prom-client` (default registry, no other modules imported).
- `@/server/config` (`APP`, `CONTAINER` for default labels).
