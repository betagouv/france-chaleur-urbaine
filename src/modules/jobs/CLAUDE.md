# Module Jobs

Ce module gère le système de jobs asynchrones de l'application via TRPC.

## Architecture

Le système de jobs utilise une file d'attente PostgreSQL pour traiter les tâches asynchrones de manière robuste :

- **Création de jobs** : Les jobs sont créés avec le statut `pending`
- **Traitement** : Le processeur (`processor.ts`) récupère les jobs en attente et les traite
- **Concurrence** : Utilisation de `FOR UPDATE SKIP LOCKED` pour éviter les conflits entre workers
- **Gestion des erreurs** : Les jobs en erreur sont marqués avec le statut `error` et conservent le message d'erreur

## API TRPC

### `trpc.jobs.list`

Liste les jobs avec filtres et pagination. Réservé aux administrateurs.

**Paramètres :**
- `types?: JobType[]` - Filtrer par types de jobs
- `statuses?: JobStatus[]` - Filtrer par statuts  
- `userId?: string` - Filtrer par utilisateur
- `limit?: number` - Nombre maximum de résultats (1-100, défaut: 50)
- `offset?: number` - Décalage pour la pagination (défaut: 0)
- `orderBy?: string` - Champ de tri ('created_at', 'updated_at', 'type', 'status', défaut: 'created_at')
- `orderDirection?: 'asc' | 'desc'` - Direction du tri (défaut: 'desc')

**Réponse:**
```typescript
{
  jobs: Job[],
  pagination: {
    total: number,
    offset: number,
    limit: number,
    hasNext: boolean
  }
}
```

**Exemples :**

```typescript
// Lister tous les jobs en cours ou en attente
const { data } = trpc.jobs.list.useQuery({
  statuses: ['pending', 'processing'],
  limit: 100
});

// Lister les jobs de synchronisation
const { data } = trpc.jobs.list.useQuery({
  types: ['syncGeometriesToAirtable', 'syncMetadataFromAirtable'],
  limit: 50
});

// Polling pour suivre les jobs actifs
const { data } = trpc.jobs.list.useQuery(
  {
    types: ['build_tiles', 'syncGeometriesToAirtable', 'syncMetadataFromAirtable'],
    statuses: ['pending', 'processing'],
  },
  {
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
  }
);
```

## Types de Jobs

- `build_tiles` - Génération de tuiles cartographiques
- `pro_eligibility_tests` - Tests d'éligibilité professionnels
- `syncGeometriesToAirtable` - Synchronisation des géométries vers Airtable
- `syncMetadataFromAirtable` - Synchronisation des métadonnées depuis Airtable

## Statuts de Jobs

- `pending` - En attente de traitement
- `processing` - En cours de traitement
- `finished` - Terminé avec succès
- `error` - Erreur lors du traitement

## Processeur de Jobs

Le processeur (`src/server/services/jobs/processor.ts`) :

1. **Récupération** : Sélectionne le job le plus ancien en `pending` avec verrouillage
2. **Traitement** : Exécute la fonction associée au type de job
3. **Mise à jour** : Met à jour le statut et le résultat du job
4. **Shutdown gracieux** : Remet le job en cours à `pending` si le processeur s'arrête

**Handlers de jobs :**
- `processBuildTilesJob` - Génère les tuiles pour une source de données
- `processProEligibilityTestJob` - Exécute les tests d'éligibilité
- `processSyncGeometriesToAirtableJob` - Synchronise les géométries vers Airtable  
- `processSyncMetadataFromAirtableJob` - Télécharge les métadonnées depuis Airtable

## Création de Jobs

Les jobs peuvent être créés via les services métier. Exemple avec les tuiles :

```typescript
// Dans src/modules/tiles/server/service.ts
const job = await createBuildTilesJob({ name: 'reseaux_de_chaleur' }, context);

// Création de plusieurs jobs
const [syncGeometriesJob, syncMetadataJob] = await Promise.all([
  createSyncGeometriesToAirtableJob(context),
  createSyncMetadataFromAirtableJob(context),
]);
```

## Utilisation Frontend

```typescript
import trpc from '@/modules/trpc/client';

// Liste complète avec filtres et pagination
const { data: jobsData } = trpc.jobs.list.useQuery({
  types: ['build_tiles'],
  statuses: ['pending', 'processing'], 
  limit: 10,
  offset: 0,
});

// Jobs en cours uniquement
const { data: pendingJobsData } = trpc.jobs.list.useQuery({
  types: ['build_tiles', 'syncGeometriesToAirtable'],
  statuses: ['pending', 'processing'],
  limit: 100,
});
const pendingJobs = pendingJobsData?.jobs || [];
```

## Permissions

Toutes les routes sont réservées aux administrateurs (`routeRole(['admin'])`).