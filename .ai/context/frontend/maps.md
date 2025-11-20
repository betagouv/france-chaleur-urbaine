## Maps (MapLibre GL)

**Stack**: MapLibre GL + react-map-gl + Turf.js + MapboxDraw  
**Component**: `FullyFeaturedMap` in `src/components/Map/Map.tsx`  
**Layers System**: `src/components/Map/map-layers.ts` (40+ layers)

## Layer Architecture

**Location**: `src/components/Map/layers/<layerName>.tsx`

Each layer file exports a `MapSourceLayersSpecification`:

```typescript
import { defineLayerPopup, type MapSourceLayersSpecification } from './common';

const Popup = defineLayerPopup<TileType>(
  (data, { Property, Title, TwoColumns }, { hasRole }) => (
    <>
      <Title>{data.name}</Title>
      <TwoColumns>
        <Property label="Gestionnaire" value={data.gestionnaire} />
      </TwoColumns>
    </>
  )
);

export const myLayersSpec = {
  sourceId: 'my-source',
  source: { 
    type: 'vector', 
    tiles: ['/api/tiles/my-layer/{z}/{x}/{y}'] 
  },
  layers: [
    {
      id: 'my-layer-fill',
      type: 'fill',
      paint: { 'fill-color': '#FF0000', 'fill-opacity': 0.6 },
      isVisible: (config) => config.myLayer,
      popup: Popup,
    },
    {
      id: 'my-layer-outline',
      type: 'line',
      paint: { 'line-color': '#990000', 'line-width': 2 },
      isVisible: (config) => config.myLayer,
    },
  ],
} satisfies MapSourceLayersSpecification;
```

**Register in `map-layers.ts`**:
```typescript
import { myLayersSpec } from './layers/myLayer';

export const mapLayers = [
  ...myLayersSpec,
  // ... 40+ other layers
];
```

## Layer Properties

- `sourceId` - Unique source identifier
- `source` - Vector tiles URL or GeoJSON
- `layers[]` - Array of MapLibre layers:
  - `id` - Layer ID
  - `type` - `fill`, `line`, `circle`, `symbol`
  - `paint` - Style properties
  - `isVisible(config)` - Visibility function
  - `filter(config)` - Optional filter expression
  - `popup` - Click popup component

## Map Configuration

**Type**: `MapConfiguration` (50+ properties)  
**Managed via**: `useQueryStates` (URL-based state)

Controls:
- Layer visibility toggles (`reseauxDeChaleur`, `batiments`, etc.)
- Filters (`energies`, `typesBatiment`, etc.)
- Tool states (`drawing`, `measurement`)

## Popups

**Helper**: `defineLayerPopup<TileType>()`

```typescript
const Popup = defineLayerPopup<NetworkTile>(
  (data, { Property, Title, TwoColumns }, context) => {
    const { hasRole, pathname, mapEventBus } = context;
    
    return (
      <>
        <Title>ID: {data.id_fcu}</Title>
        <Property label="Type" value={data.type} />
        {hasRole('admin') && <Button>Admin action</Button>}
      </>
    );
  }
);
```

## Map Events

**Event bus**: `mapEventBus` (custom events between components)

```typescript
// Emit
mapEventBus.emit('rdc-add-tag', { tag });

// Listen
mapEventBus.on('rdc-add-tag', (data) => { ... });
```

## Tiles Generation

**Module**: `src/modules/tiles/`  
**Process**: PostGIS → Tippecanoe → Vector tiles (`.mbtiles`)  
**Serve**: `/api/tiles/<source>/{z}/{x}/{y}` routes

## Best Practices

- **One file per layer** in `src/components/Map/layers/`
- **Separate layers** for fill, outline, labels (better control)
- **Use filters** for dynamic layer visibility
- **Popup helpers** for consistent styling
- **Vector tiles** for performance (not GeoJSON)
