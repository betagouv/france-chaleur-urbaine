# Geo Module

This module provides geospatial utilities for working with coordinates, bounding boxes, and GeoJSON geometries.

## Purpose

Centralized location for all geospatial types and utilities used across the application, supporting both client-side (browser) and server-side (Node.js with PostGIS) operations.

## Module Structure

### Types (`types.d.ts`)

- **`Coords`** - Simple coordinate interface with longitude and latitude
- **`BoundingBox`** - Tuple representing a rectangular geographic area `[xMin, yMin, xMax, yMax]`

### Client Helpers (`client/helpers.ts`)

Pure functions that run in the browser:

- **`formatDistance()`** - Format distance in meters or kilometers
- **`getReadableDistance()`** - Human-readable distance with French labels
- **`pointsEqual()`** - Compare two GeoJSON positions
- **`validatePolygonGeometry()`** - Check for self-intersections in polygons
- **`parseBbox()`** - Parse PostGIS box2d string to BoundingBox tuple
- **`hasLambert93Projection()`** - Detect Lambert-93 projection in GeoJSON
- **`convertLambert93GeoJSONToWGS84()`** - Convert Lambert-93 to WGS84 using proj4
- **Column name candidates** for CSV parsing: `longitudeColumnNameCandidates`, `latitudeColumnNameCandidates`

### Server Helpers (`server/helpers.ts`)

Server-side functions requiring Node.js and PostGIS:

- **`GeometryWithSrid`** - Type for geometry with detected SRID (4326 or 2154)
- **`createGeometryExpression()`** - Build Kysely SQL expression for PostGIS geometry
- **`processGeometry()`** - Process GeoJSON and detect SRID, handle collections, convert to multi-geometries
- **`readFileGeometry()`** - Read and process GeoJSON file from disk
- **`detectSrid()`** - Auto-detect coordinate system from coordinate values
- **`mergeGeoJSONFeaturesGeometries()`** - Merge multiple GeoJSON features using PostGIS

## Key Concepts

### Coordinate Systems

- **WGS84 (EPSG:4326)** - Standard GPS coordinates (longitude: -180 to 180, latitude: -90 to 90)
- **Lambert 93 (EPSG:2154)** - French projected system with meter units (large 6-7 digit values)

### SRID Detection

The module automatically detects which coordinate system is used based on coordinate values:
- Small values (-180 to 180) → WGS84 (4326)
- Large values (hundreds of thousands) → Lambert 93 (2154)

## Usage Examples

### Client Side

```typescript
import { formatDistance, parseBbox } from '@/modules/geo/client/helpers';
import type { BoundingBox, Coords } from '@/modules/geo/types';

// Format distance
const readable = formatDistance(1500); // "1.5 km"

// Parse PostGIS bbox
const bbox: BoundingBox = parseBbox("BOX(3.38 47.35,3.39 47.36)");
```

### Server Side

```typescript
import { readFileGeometry, createGeometryExpression } from '@/modules/geo/server/helpers';
import { kdb } from '@/server/db/kysely';

// Read and process GeoJSON file
const { geom, srid } = await readFileGeometry('network.geojson');

// Use in Kysely query
await kdb
  .updateTable('reseaux_de_chaleur')
  .set({ geom: createGeometryExpression(geom, srid) })
  .where('id', '=', networkId)
  .execute();
```

## Integration Points

- **PostGIS**: All server operations use PostGIS spatial functions
- **proj4**: Client-side coordinate transformations
- **Turf.js**: Used alongside this module for advanced geospatial operations
- **MapLibre**: Map rendering uses coordinate types from this module
