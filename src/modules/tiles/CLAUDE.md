# Module Tiles - Génération de tuiles vectorielles

Ce module gère la génération de tuiles vectorielles à partir de diverses sources de données géospatiales pour l'affichage sur les cartes de France Chaleur Urbaine.

## Vue d'ensemble

Le module `tiles` permet de :
- Générer des tuiles vectorielles à partir de données géospatiales (bases de données, APIs, fichiers)
- Configurer différentes sources de données avec des paramètres spécifiques
- Automatiser l'import des tuiles dans PostgreSQL/PostGIS
- Gérer les jobs de génération via tRPC

## Architecture

```
src/modules/tiles/
├── constants.tsx              # Types et validation Zod
├── server/
│   ├── generation.ts          # Types et fonction de définition des configs
│   ├── generation-config.ts   # Configurations centralisées de toutes les tuiles
│   ├── generation-strategies.ts # Stratégies de génération (DB, URL, fichiers)
│   ├── generation-run.ts      # Exécution de la génération
│   ├── service.ts            # Service pour créer des jobs
│   ├── jobs.ts               # Traitement des jobs en arrière-plan
│   ├── trpc-routes.ts        # Routes tRPC pour l'API
│   └── generation-configs/   # Configurations spécifiques par source
│       ├── reseaux-de-chaleur.ts
│       └── tests-adresses.ts
```

## Concepts clés

### 1. Configuration de tuiles (`TilesGenerationConfig`)

Chaque source de données est définie par une configuration qui spécifie :

```typescript
type TilesGenerationConfig = {
  tilesTableName: string;           // Table PostgreSQL de destination
  zoomMin?: number;                 // Zoom minimum (défaut: 5)
  zoomMax?: number;                 // Zoom maximum (défaut: 14)
  tilesGenerationMethod?: 'legacy' | 'compressed'; // Méthode de génération
  tippeCanoeArgs?: string;          // Arguments pour tippecanoe
  generateGeoJSON: (config: GenerateGeoJSONConfig) => Promise<string>; // Fonction de génération
};
```

### 2. Stratégies de génération

Le module propose plusieurs stratégies pré-définies :

- **`extractGeoJSONFromDatabaseTable`** : Extrait depuis une table PostgreSQL
- **`downloadGeoJSONFromURL`** : Télécharge depuis une API/URL
- **`extractZippedShapefileToGeoJSON`** : Convertit un shapefile zippé
- **`fromSQLQuery`** : Exécute une requête SQL personnalisée
- **`getInputFilePath`** : Utilise un fichier fourni en entrée

### 3. Méthodes de génération

- **`legacy`** : Utilise le module Node.js `geojsonvt` (plus simple)
- **`compressed`** : Utilise `tippecanoe` (plus performant, plus d'options)

## Configuration existante

Le fichier `generation-config.ts` contient toutes les configurations disponibles :

```typescript
export const tilesConfigs = {
  'reseaux-de-chaleur': defineTilesConfig({
    tilesTableName: 'reseaux_de_chaleur_tiles',
    tilesGenerationMethod: 'legacy',
    generateGeoJSON: reseauxDeChaleurGeoJSONQuery,
  }),
  'tests-adresses': defineTilesConfig({
    tilesTableName: 'tests_adresses_tiles',
    zoomMax: 12,
    tippeCanoeArgs: '--drop-rate=0 --no-tile-size-limit --no-feature-limit',
    generateGeoJSON: testsAdressesGeoJSONQuery,
  }),
  // ... autres configurations
};
```

## Comment ajouter une nouvelle configuration de tuiles

### Étape 1 : Créer la stratégie de génération

Si vous avez besoin d'une nouvelle source de données, choisissez la stratégie appropriée :

#### Option A : Depuis une table de base de données
```typescript
// Dans generation-config.ts
'ma-nouvelle-source': defineTilesConfig({
  tilesTableName: 'ma_table_tiles',
  generateGeoJSON: extractGeoJSONFromDatabaseTable('ma_table_source'),
}),
```

#### Option B : Depuis une API/URL
```typescript
'ma-source-api': defineTilesConfig({
  tilesTableName: 'ma_source_api_tiles',
  generateGeoJSON: downloadGeoJSONFromURL('https://api.example.com/geojson'),
}),
```

#### Option C : Requête SQL personnalisée
```typescript
// 1. Créer un fichier dans generation-configs/
// src/modules/tiles/server/generation-configs/ma-source.ts
import { fromSQLQuery } from '@/modules/tiles/server/generation-strategies';

export const maSourceGeoJSONQuery = fromSQLQuery(`
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(feature)
  ) as geojson
  FROM (
    SELECT json_build_object(
      'id', id,
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(ST_Transform(geom, 4326))::json,
      'properties', json_build_object(
        'name', name,
        'description', description
      )
    ) AS feature
    FROM ma_table
  ) features
`);

// 2. L'importer dans generation-config.ts
import { maSourceGeoJSONQuery } from './generation-configs/ma-source';

'ma-source': defineTilesConfig({
  tilesTableName: 'ma_source_tiles',
  generateGeoJSON: maSourceGeoJSONQuery,
}),
```

### Étape 2 : Configurer les paramètres

Ajustez les paramètres selon vos besoins :

```typescript
'ma-source-optimisee': defineTilesConfig({
  tilesTableName: 'ma_source_tiles',
  zoomMin: 6,                    // Zoom minimum
  zoomMax: 12,                   // Zoom maximum (réduit pour moins de tuiles)
  tilesGenerationMethod: 'compressed', // Utilise tippecanoe
  tippeCanoeArgs: '-r1.5 --drop-rate=0.1', // Arguments tippecanoe
  generateGeoJSON: maSourceGeoJSONQuery,
}),
```

### Étape 3 : Mettre à jour les types (si nécessaire)

Si votre nouvelle source doit être accessible via l'API, ajoutez-la dans `constants.tsx` :

```typescript
export const zBuildTilesInput = z.strictObject({
  name: z.enum([
    'reseaux-de-chaleur',
    'tests-adresses',
    'ma-nouvelle-source', // Ajouter ici
    // ...
  ]),
});
```

### Étape 4 : Créer la table de destination

Créez une migration pour la table de tuiles :

```sql
-- migrations/YYYYMMDD000001_ma_source_tiles.ts
CREATE TABLE IF NOT EXISTS ma_source_tiles (
  z INTEGER NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  mvt BYTEA,
  PRIMARY KEY (z, x, y)
);

CREATE INDEX IF NOT EXISTS ma_source_tiles_zxy_idx ON ma_source_tiles (z, x, y);
```

## Utilisation

### Via l'API (tRPC)
```typescript
// Côté client
const mutation = trpc.tiles.createBuildTilesJob.useMutation();
await mutation.mutateAsync({ name: 'reseaux-de-chaleur' });
```

### Via CLI/Script
```typescript
import { runTilesGeneration } from '@/modules/tiles/server/generation-run';

// Génération directe
await runTilesGeneration('reseaux-de-chaleur');

// Avec fichier d'entrée
await runTilesGeneration('ma-source', '/path/to/input.geojson');
```

## Bonnes pratiques

1. **Nommage** : Utilisez des noms explicites avec des tirets (`reseaux-de-chaleur`)
2. **Tables** : Suffixez toujours les tables de tuiles par `_tiles`
3. **Zoom** : Ajustez `zoomMax` selon la densité des données (12-14 max)
4. **Performance** : Préférez `compressed` pour les gros volumes de données
5. **Requêtes SQL** : Transformez toujours en EPSG:4326 avec `ST_Transform(geom, 4326)`
6. **Properties** : Limitez les propriétés aux données nécessaires pour l'affichage

## Dépannage

- **Erreur de géométrie** : Vérifiez que les données sont valides avec `ST_IsValid()`
- **Tuiles vides** : Vérifiez la projection et les coordonnées
- **Performance lente** : Réduisez `zoomMax` ou utilisez `tippeCanoeArgs` pour filtrer
- **Mémoire insuffisante** : Utilisez `tippecanoe` avec des arguments de limitation

## Intégration avec la carte

Une fois les tuiles générées, elles peuvent être utilisées dans les composants de carte via les couches MapLibre définies dans `src/services/Map/layers/`.
