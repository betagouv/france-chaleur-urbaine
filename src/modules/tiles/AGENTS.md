# Module Tiles - Génération de tuiles vectorielles

Ce module gère la génération de tuiles vectorielles pour les cartes de France Chaleur Urbaine.

## Fonctionnalités

- Génération de tuiles vectorielles à partir de bases de données, APIs ou fichiers
- Gestion des géométries via interface d'administration
- Synchronisation avec Airtable
- Jobs en arrière-plan via tRPC

## Architecture

```
src/modules/tiles/
├── constants.tsx              # Types et validation Zod
├── commands.ts                # CLI commands (pnpm cli tiles)
├── server/
│   ├── generation-config.ts   # Configurations de toutes les tuiles
│   ├── generation-strategies.ts # Stratégies (DB, URL, fichiers)
│   ├── generation-run.ts      # Exécution
│   ├── service.ts            # Services (jobs, géométries, sync)
│   ├── jobs.ts               # Traitement des jobs
│   ├── trpc-routes.ts        # API tRPC
│   └── generation-configs/   # Configs spécifiques
```

## Concepts clés

### Configuration de tuiles

Chaque source de données est définie par :

```typescript
type TilesGenerationConfig = {
  tilesTableName: string;           // Table PostgreSQL de destination
  zoomMin?: number;                 // Zoom minimum (défaut: 5)
  zoomMax?: number;                 // Zoom maximum (défaut: 14)
  tippeCanoeArgs?: string;          // Arguments pour tippecanoe
  generateGeoJSON: (config: GenerateGeoJSONConfig) => Promise<string>;
};
```

### Stratégies de génération

- **`extractGeoJSONFromDatabaseTable`** : Depuis une table PostgreSQL
- **`downloadGeoJSONFromURL`** : Depuis une API/URL
- **`extractZippedShapefileToGeoJSON`** : Depuis un shapefile zippé
- **`generateGeoJSONFromSQLQuery`** : Requête SQL personnalisée
- **`getInputFilePath`** : Fichier fourni en entrée

## Configurations disponibles

Le fichier `generation-config.ts` contient toutes les configurations :

```typescript
export const tilesConfigs = {
  'reseaux-de-chaleur': defineTilesConfig({
    tilesTableName: 'reseaux_de_chaleur_tiles',
    generateGeoJSON: reseauxDeChaleurGeoJSONQuery,
  }),
  'tests-adresses': defineTilesConfig({
    tilesTableName: 'pro_eligibility_tests_addresses_tiles',
    zoomMax: 12,
    tippeCanoeArgs: '--drop-rate=0 --no-tile-size-limit --no-feature-limit',
    generateGeoJSON: testsAdressesGeoJSONQuery,
  }),
  // Plus de 15 autres configurations (géothermie, zones d'urbanisation, etc.)
};
```

## Ajouter une nouvelle configuration

### 1. Choisir la stratégie

```typescript
// Table PostgreSQL
'ma-source': defineTilesConfig({
  tilesTableName: 'ma_source_tiles',
  generateGeoJSON: extractGeoJSONFromDatabaseTable('ma_table'),
}),

// API/URL
'ma-source-api': defineTilesConfig({
  tilesTableName: 'ma_source_api_tiles',
  generateGeoJSON: downloadGeoJSONFromURL('https://api.example.com/geojson'),
}),

// Requête SQL personnalisée
'ma-source-sql': defineTilesConfig({
  tilesTableName: 'ma_source_tiles',
  generateGeoJSON: generateGeoJSONFromSQLQuery(`SELECT json_build_object(...) as geojson FROM ...`),
}),
```

### 2. Ajouter dans constants.tsx

```typescript
export const zBuildTilesInput = z.strictObject({
  name: z.enum([
    'reseaux-de-chaleur',
    'ma-nouvelle-source', // Ajouter ici
    // ...
  ]),
});
```

### 3. Créer la table

```sql
CREATE TABLE ma_source_tiles (
  z INTEGER NOT NULL,
  x INTEGER NOT NULL, 
  y INTEGER NOT NULL,
  mvt BYTEA,
  PRIMARY KEY (z, x, y)
);
```

## API tRPC

Le module expose 4 endpoints via tRPC :

```typescript
// Génération de tuiles
trpc.tiles.createBuildTilesJob.useMutation()

// Appliquer les mises à jour de géométries 
trpc.tiles.applyGeometriesUpdates.useMutation()

// Synchroniser vers Airtable
trpc.tiles.syncGeometriesToAirtable.useMutation()

// Synchroniser depuis Airtable
trpc.tiles.syncMetadataFromAirtable.useMutation()
```

## Gestion des géométries

Le module gère automatiquement :
- Les créations de géométries (`geom_update` + `geom` vide → `geom`)
- Les mises à jour (`geom` + `geom_update` → `geom`)
- Les suppressions (`geom_update` vide → suppression)
- La régénération automatique des tuiles affectées

## Bonnes pratiques

- Noms avec tirets : `reseaux-de-chaleur`
- Tables suffixées : `_tiles`
- Zoom max adapté : 10-14 selon la densité
- Projection EPSG:4326 pour les requêtes SQL
- Propriétés limitées aux données d'affichage
