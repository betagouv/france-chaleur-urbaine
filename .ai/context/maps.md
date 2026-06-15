# Maps & tiles

> Server-side **vector tiles pipeline** + geographic data (`src/modules/tiles/`).
> **Client rendering architecture is NOT here** — components, layers, interactions, `MapConfiguration`, legend, search all live in **`src/modules/map/AGENTS.md`**. Read that file for anything under `src/modules/map/`.

## Load when…

- Generating / regenerating vector tiles, or adding/changing a tile source.
- A map layer is empty or serving stale data (cache).
- Working anywhere in `src/modules/tiles/`.

## Pipeline

```
Source (DB table / URL / shapefile)
  → pnpm cli tiles generate <type>   → GeoJSON
  → tippecanoe                       → vector tiles {z}/{x}/{y}
  → import                           → PostgreSQL `{sourceId}_tiles`
  → GET /api/map/{sourceId}/{z}/{x}/{y}  → MapLibre GL (browser)
```

## Tile generation

```bash
pnpm cli tiles generate <type>     # generate tiles for a config key
pnpm cli tiles add-to-map <type>   # register the source on the map afterwards
```

`<type>` = a key of `tiles.config.ts` (e.g. `reseaux-de-chaleur`, `bdnb-batiments`).

| File | Role |
|------|------|
| `src/modules/tiles/server/tiles.config.ts` | Registry of all tile sources (70+) |
| `src/modules/tiles/server/generation-run.ts` | Orchestration: GeoJSON → tiles → DB import |
| `src/modules/tiles/server/generation-strategies.ts` | Extraction strategies (DB / URL / shapefile / custom SQL) |
| `src/modules/tiles/server/generation-import.ts` | tippecanoe call + DB import |
| `src/modules/tiles/server/jobs.ts` | `build_tiles` background job |

Source entry shape (`tiles.config.ts`): `aliases` (legacy URLs), `generateGeoJSON` (strategy), `tilesTableName`, `zoomMin`/`zoomMax` (default 5/14), `tippeCanoeArgs`, `compressedTiles` (gzip, default true), `cacheProfile` (see below).

Extraction strategies: `extractGeoJSONFromDatabaseTable` (OGR2OGR), `extractNDJSONFromDatabaseTable` (large tables, `{ fields, idField }`), `downloadGeoJSONFromURL`, `extractZippedShapefileToGeoJSON`, `generateGeoJSONFromSQLQuery` (custom PostGIS — `ST_AsGeoJSON` + Lambert93→WGS84). Per-source GeoJSON builders live in `generation-configs/`.

## Tile serving + HTTP cache

`GET /api/map/{sourceId}/{z}/{x}/{y}` (`src/modules/tiles/server/api.ts`, `service.ts`):
- Pre-generated sources → direct lookup in `{sourceId}_tiles` by `(x, y, z)`.
- Dynamic sources (e.g. `demands`) → built on the fly via `geojson-vt` + in-memory cache, refreshed daily.

Cache: the API sets `Cache-Control`, a weak `ETag` and `Last-Modified` per tile (browser 304 revalidation). Freshness is tracked in `tiles_metadata (source_id, last_modified_at)`.

**Golden rule** — every write to a tile source must call `markTilesUpdated(sourceId)` (`service.ts`). Without the bump, browsers serve the stale version until `max-age` expires. Wired paths: `runTilesGeneration` (end of build), `populateTilesCache` (`demands` rebuild), CLI `pnpm cli tiles bump <source-id> | --all` (dump restore / manual). Any new write path to a `*_tiles` table must call it.

Cache profiles — `cacheProfile` field per source (`'long' | 'short' | 'private'`, default `long`):

| Profile | `Cache-Control` | Sources |
|---------|-----------------|---------|
| `long` (default) | `public, max-age=86400` | Rarely-changed data (bdnb, geothermie, zones, besoins, communes, enrr…) |
| `short` | `public, max-age=7200` | Réseaux + `demands` |
| `private` | `private, max-age=86400, must-revalidate` | `tests-adresses` (admin-only, embedded PII) |

`tests-adresses` is admin-only: auth required on the route, legend checkbox hidden for other roles, no `Access-Control-Allow-Origin: *`.

## Constants

`src/modules/tiles/constants.tsx`: `intermediateTileLayersMinZoom = 12`, `tileSourcesMaxZoom = 17`.

## Performance

- `DISABLE_TILES_CACHE=true` — disable the server tile cache in dev when you need fresh tiles.
- Heavy GIS (intersections, complex buffers via Turf.js) → run server-side, not in the browser.

## Add a new tile-backed layer — checklist

1. Create the GeoJSON strategy in `generation-strategies.ts` or `generation-configs/`.
2. Add the source entry in `tiles.config.ts` (pick `cacheProfile`).
3. Generate: `pnpm cli tiles generate <type>`.
4. **Client side** (spec in `layers/specs/`, register in `all-layers.ts`, add the `MapConfiguration` property + legend toggle) → see **`src/modules/map/AGENTS.md`**.
