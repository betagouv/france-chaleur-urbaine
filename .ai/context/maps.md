# Carte interactive — Documentation IA

## Quand lire ce fichier

- Ajouter ou modifier une couche cartographique (layer/source)
- Générer ou régénérer des tuiles vecteur
- Travailler sur `src/components/Map/`, `src/modules/tiles/`, ou `src/pages/carte.tsx`
- Comprendre pourquoi une donnée n'apparaît pas sur la carte
- Configurer des filtres, popups, ou la visibilité d'une couche

---

## Vue d'ensemble

La carte utilise **MapLibre GL v5 + react-map-gl 8**. Les données sont servies sous forme de tuiles vecteur (MVT/PBF) générées via un pipeline PostGIS → Tippecanoe → PostgreSQL, puis exposées par une API Next.js.

```
Données source (DB / URL / shapefile)
  ↓  pnpm cli tiles generate <type>
GeoJSON
  ↓  tippecanoe
Tuiles vecteur ({z}/{x}/{y})
  ↓  import en base
Table PostgreSQL `{sourceId}_tiles`
  ↓  GET /api/map/{sourceId}/{z}/{x}/{y}
MapLibre GL (navigateur)
```

---

## 1. Génération des tuiles

### Commandes CLI

```bash
pnpm cli tiles generate <type>   # Génère les tuiles pour un type donné
pnpm cli tiles add-to-map <type> # Ajoute la source à la carte après génération
```

`<type>` correspond à une clé de `tiles.config.ts` (ex: `reseaux-de-chaleur`, `bdnb-batiments`).

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/modules/tiles/server/tiles.config.ts` | Registre de toutes les sources de tuiles (70+) |
| `src/modules/tiles/server/generation-run.ts` | Orchestration : GeoJSON → tuiles → import DB |
| `src/modules/tiles/server/generation-strategies.ts` | Stratégies d'extraction (DB, URL, shapefile, SQL custom) |
| `src/modules/tiles/server/generation-import.ts` | Appel tippecanoe + import en base |
| `src/modules/tiles/commands.ts` | Enregistrement des commandes CLI |
| `src/modules/tiles/server/jobs.ts` | Job background `build_tiles` |

### Configuration d'une source (`tiles.config.ts`)

```typescript
'reseaux-de-chaleur': {
  aliases: ['reseauxDeChaleur'],          // anciennes URLs (rétrocompatibilité)
  generateGeoJSON: reseauxDeChaleurQuery, // stratégie d'extraction
  tilesTableName: 'reseaux_de_chaleur_tiles',
  zoomMin: 5,                             // défaut: 5
  zoomMax: 14,                            // défaut: 14
  tippeCanoeArgs: '-r1',                  // flags tippecanoe additionnels
  compressedTiles: true,                  // gzip (défaut: true)
}
```

### Stratégies d'extraction disponibles

- `extractGeoJSONFromDatabaseTable(tableName)` — export OGR2OGR depuis une table
- `extractNDJSONFromDatabaseTable(tableName, { fields, idField })` — optimisé pour grandes tables
- `downloadGeoJSONFromURL(url)` — fetch + transformation
- `extractZippedShapefileToGeoJSON()` — dézip + conversion shapefile
- `generateGeoJSONFromSQLQuery(sqlQuery, mapFunction)` — requête PostGIS custom (ST_AsGeoJSON, ST_Transform Lambert93→WGS84)

---

## 2. Serving des tuiles

**Endpoint** : `GET /api/map/{sourceId}/{z}/{x}/{y}`

- **Tuiles pré-générées** : lookup direct dans la table `{sourceId}_tiles` par `(x, y, z)`
- **Tuiles dynamiques** (ex: `demands`) : générées à la volée via `geojson-vt` + cache mémoire, rafraîchi quotidiennement

Fichiers : `src/modules/tiles/server/api.ts`, `src/modules/tiles/server/service.ts`

---

## 3. Configuration des couches (layers)

### Structure d'un layer

Chaque couche vit dans `src/components/Map/layers/<nom>.tsx` et exporte un `MapSourceLayersSpecification` :

```typescript
export const reseauxDeChaleurLayer: MapSourceLayersSpecification = {
  sourceId: 'reseaux-de-chaleur',
  source: {
    type: 'vector',
    tiles: ['/api/map/reseaux-de-chaleur/{z}/{x}/{y}'],
    maxzoom: 17,
  },
  layers: [
    {
      id: 'reseaux-de-chaleur-trace',
      type: 'line',
      paint: { 'line-color': '#e11', 'line-width': 2 },
      filter: (config) => ['all', ...buildReseauxDeChaleurFilters(config)],
      isVisible: (config) => config.reseauxDeChaleur.show,
      popup: ReseauxDeChaleurPopup,  // composant React
    },
  ],
};
```

### Agrégation des couches

`src/components/Map/map-layers.ts` — importe tous les layer specs et exporte :
- `mapLayers` : tableau de toutes les couches (40+)
- `loadMapLayers(map, config)` : charge sources + couches sur l'instance MapLibre
- `applyMapConfigurationToLayers(map, config)` : applique filtres et visibilité

### Répertoire `src/components/Map/layers/`

Un fichier par groupe de couches :
- `reseauxDeChaleur.tsx`, `reseauxDeFroid.tsx`, `reseauxEnConstruction.tsx`
- `batimentsRaccordesReseauxChaleurFroid.tsx`, `adressesEligibles.tsx`
- `bdnb/` — caractéristiques bâtiments
- `geothermie/` — installations géothermiques
- `enrr-mobilisables/` — ressources ENR&R

---

## 4. Configuration de la carte (`MapConfiguration`)

**Fichier** : `src/components/Map/map-configuration.ts`

Type avec 50+ propriétés contrôlant visibilité, filtres, outils. Exemples :

```typescript
type MapConfiguration = {
  reseauxDeChaleur: { show: boolean; filters: ReseauxFilters; ... };
  reseauxDeFroid: boolean;
  bdnb: { show: boolean; filters: BdnbFilters };
  consommationsGaz: { show: boolean; logements: boolean; tertiaire: boolean };
  // ...outils
  outilDistance: boolean;
  outilDensiteLineaire: boolean;
};
```

L'état est persisté dans l'URL via `nuqs` (`useQueryStates`).

---

## 5. Composants principaux

| Fichier | Rôle |
|---------|------|
| `src/pages/carte.tsx` | Page carte (import dynamique, SSR désactivé) |
| `src/components/Map/Map.tsx` | Composant principal MapLibre (~670 lignes) |
| `src/components/Map/MapProvider.tsx` | Context React + hook `useFCUMap()` |
| `src/components/Map/map-configuration.ts` | Type `MapConfiguration` + défauts |
| `src/components/Map/map-layers.ts` | Agrégation et chargement des couches |

### `MapProvider` / `useFCUMap()`

Context qui expose :
- Instance map MapLibre
- `mapConfiguration` + setters
- État des outils (dessin, mesure, densité)
- Filtres réseaux

### Popups

Définies via `defineLayerPopup<TileType>()` — helper qui donne accès au rôle utilisateur, pathname, event bus.

### Event bus

`mapEventBus` — communication entre composants carte via emit/listen (pas de prop drilling).

---

## 6. Constantes importantes

```typescript
// src/modules/tiles/constants.tsx
intermediateTileLayersMinZoom = 12  // zoom min pour couches intermédiaires
tileSourcesMaxZoom = 17             // zoom max global
```

---

## Performance

- **Cache tuiles** : contrôlé par la variable d'env `DISABLE_TILES_CACHE=true` (désactiver en dev si besoin de tuiles fraîches).
- **Visibilité des couches** : les couches sont chargées/masquées dynamiquement selon l'état URL (`useQueryStates`) — ne pas charger toutes les sources au démarrage.
- **Turf.js** : les calculs GIS lourds (intersections, buffers complexes) doivent tourner côté serveur quand possible, pas dans le navigateur.

## Ajouter une nouvelle couche — checklist

1. Créer la stratégie GeoJSON dans `generation-strategies.ts` ou `generation-configs/`
2. Ajouter l'entrée dans `tiles.config.ts`
3. Générer : `pnpm cli tiles generate <type>`
4. Créer `src/components/Map/layers/<nom>.tsx` avec `MapSourceLayersSpecification`
5. Ajouter la propriété dans `MapConfiguration`
6. Importer et ajouter dans `map-layers.ts`
7. Ajouter le toggle dans la légende si nécessaire
