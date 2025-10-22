# Module Données

Module de gestion des données d'extraction et de résumé pour les outils d'analyse géographique.

## Structure

```
donnees/
├── server/
│   ├── service.ts         # Logique métier principale
│   └── trpc-routes.ts     # Routes tRPC
├── constants.ts           # Schémas de validation Zod
└── .env.example          # Variables d'environnement
```

## Fonctionnalités

### Extraction de données géographiques
- **Résumé de polygone** : Analyse des consommations et réseaux dans une zone
- **Résumé linéaire** : Analyse de densité thermique le long d'une ligne
- **Export de données** : Génération de fichiers Excel/CSV pour l'extraction

### Types de données supportées
- **Consommations de gaz** : Données de consommation et PDL
- **Bâtiments collectifs** : Bâtiments avec chauffage collectif (gaz/fioul)
- **Réseaux de chaleur** : Longueur des réseaux dans la zone

## API tRPC

### Routes disponibles

#### `donnees.getPolygonSummary`
Récupère un résumé des données dans un polygone géographique.

**Input**:
```typescript
{
  coordinates: number[][]  // Coordonnées du polygone
}
```

**Output**:
```typescript
{
  gas: GasSummary[],
  energy: EnergySummary[],
  network: NetworkSummary[]
}
```

#### `donnees.exportPolygonSummary`
Exporte les données d'un polygone dans un fichier ZIP.

**Input**:
```typescript
{
  coordinates: number[][],
  format: 'xlsx' | 'csv'
}
```

**Output**:
```typescript
{
  content: Buffer,
  name: string
}
```

#### donnees.getDensiteThermiqueLineaire
Récupère les données de densité thermique le long d'une ligne.

**Input**:
```typescript
{
  coordinates: number[][]
}
```

**Output**:
```typescript
{
  '10': GasSummary[],
  '50': GasSummary[]
}
```

## Utilisation

### Côté client

```typescript
import { trpc } from '@/modules/trpc/client';

// Récupérer un résumé de polygone (types inférés automatiquement)
const { data: summary } = trpc.donnees.getPolygonSummary.useQuery({
  coordinates: polygonCoordinates
});

// Exporter des données (types inférés automatiquement)
const exportData = trpc.donnees.exportPolygonSummary.useMutation();
```

### Côté serveur

```typescript
import { getPolygonSummary, exportPolygonSummary } from '@/modules/data/server/service';

const summary = await getPolygonSummary(coordinates);
const file = await exportPolygonSummary(coordinates, 'xlsx');
```

## Configuration

### Variables d'environnement

Aucune variable d'environnement spécifique requise.

### Limites

- **Taille de zone** : Limite configurée dans `clientConfig.summaryAreaSizeLimit`
- **Validation géométrique** : Vérification de la validité des polygones
- **Rate limiting** : Protection contre les abus via le module security
