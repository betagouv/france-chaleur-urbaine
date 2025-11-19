## Maps (MapLibre GL)

**Stack**: MapLibre GL + react-map-gl + Turf.js + MapboxDraw

## Core Components

- `Map` (`src/components/Map/Map.tsx`) - Base map component
- `FullyFeaturedMap` - Main map with all features (search, layers, tools)

## Map Layers System

**Location**: `src/components/Map/map-layers.ts`

All layers are defined in `map-layers.ts` and loaded via `loadMapLayers()`:
- **40+ layer specs** covering networks, buildings, zones, etc.
- Each spec: `{ sourceId, source, layers, symbols }`
- Tiles served from `/api/tiles/*` endpoints (vector tiles)

## Adding New Layer

1. Create layer spec in `src/components/Map/layers/myLayer.tsx`:
```typescript
export const myLayersSpec = {
  sourceId: 'my-source',
  source: { type: 'vector', tiles: ['/api/tiles/my-layer/{z}/{x}/{y}'] },
  layers: [{
    id: 'my-layer',
    type: 'fill',
    paint: { 'fill-color': '#FF0000' },
    isVisible: (config) => config.myLayer,
  }],
} satisfies MapSourceLayersSpecification;
```

2. Register in `map-layers.ts`:
```typescript
export const mapLayers = [
  ...myLayersSpec,
  // ... other layers
];
```

## Map Configuration

State managed via `MapConfiguration` type (50+ properties):
- Layer visibility toggles
- Filters (energie, building type, etc.)
- Tools state (drawing, measurement)

## Tile Generation

Module: `src/modules/tiles/`
- Generate vector tiles with Tippecanoe
- Jobs scheduled via `jobs` module
- Serve via `/api/tiles/*` routes
