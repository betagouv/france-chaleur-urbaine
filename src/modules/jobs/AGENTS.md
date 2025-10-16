# Module Jobs

Système de gestion de jobs asynchrones basé sur une file d'attente PostgreSQL avec API TRPC.

## Structure du Module

```
jobs/
├── constants.ts          # Types et schémas Zod
├── commands.ts           # CLI commands (pnpm cli jobs)
├── jobs.config.ts        # Configuration des handlers de jobs
├── server/
│   ├── service.ts       # Logique métier (CRUD jobs)
│   ├── trpc-routes.ts   # Routes TRPC
│   ├── processor.ts     # Moteur de traitement des jobs
│   └── clock.ts         # Démarrage du processeur
```

## Concepts Clés

### Types de Jobs

Définis dans `constants.ts` :

- `build_tiles` - Génération de tuiles cartographiques vectorielles
- `pro_eligibility_test` - Tests d'éligibilité pour les professionnels  
- `sync_geometries_to_airtable` - Synchronisation géométries → Airtable
- `sync_metadata_from_airtable` - Synchronisation métadonnées ← Airtable

### Statuts

- `pending` - En attente de traitement
- `processing` - En cours d'exécution
- `finished` - Terminé avec succès
- `error` - Échec avec message d'erreur

### Architecture

1. **File d'attente PostgreSQL** : Stockage persistant des jobs dans la table `jobs`
2. **Verrouillage optimiste** : `FOR UPDATE SKIP LOCKED` pour éviter les conflits multi-workers
3. **Traitement asynchrone** : Processeur indépendant qui tourne en continu
4. **Gestion d'erreurs** : Capture et stockage des erreurs sans arrêter le processeur

## Configuration des Handlers

Les handlers sont configurés dans `jobs.config.ts` :

```typescript
export const jobHandlers = {
  pro_eligibility_test: processProEligibilityTestJob,
  build_tiles: processBuildTilesJob,
  sync_geometries_to_airtable: processSyncGeometriesToAirtableJob,
  sync_metadata_from_airtable: processSyncMetadataFromAirtableJob,
} as const;
```

**Ajouter un nouveau type de job :**

1. Ajouter le type dans `constants.ts` → `jobTypes`
2. Créer le handler dans le module concerné
3. Référencer le handler dans `jobs.config.ts`

## API TRPC

### `trpc.jobs.list`

Liste les jobs avec filtres et pagination. **Réservé aux administrateurs.**

**Paramètres :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `types` | `JobType[]?` | - | Filtrer par types de jobs |
| `statuses` | `JobStatus[]?` | - | Filtrer par statuts |
| `userId` | `string?` | - | Filtrer par utilisateur (UUID) |
| `limit` | `number` | 50 | Nombre de résultats (1-100) |
| `offset` | `number` | 0 | Décalage pour pagination |
| `orderBy` | `'created_at' \| 'updated_at' \| 'type' \| 'status'` | `'created_at'` | Champ de tri |
| `orderDirection` | `'asc' \| 'desc'` | `'desc'` | Direction du tri |

**Réponse :**

```typescript
{
  jobs: Job[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasNext: boolean;
  };
}
```

**Exemples :**

```typescript
// Jobs actifs uniquement
const { data } = trpc.jobs.list.useQuery({
  statuses: ['pending', 'processing'],
  limit: 100
});

// Polling des jobs de tuiles
const { data } = trpc.jobs.list.useQuery(
  { types: ['build_tiles'], statuses: ['pending', 'processing'] },
  { refetchInterval: 5000 }
);
```

## Processeur de Jobs

**Fichier :** `server/processor.ts`

### Fonctionnement

1. **Récupération** : `getNextJob()` sélectionne le job le plus ancien en `pending` avec `FOR UPDATE SKIP LOCKED`
2. **Exécution** : Appel du handler correspondant au type de job
3. **Mise à jour** : Enregistrement du résultat et du statut (`finished` ou `error`)
4. **Boucle** : Répète indéfiniment avec un sleep de 5s si aucun job

### Shutdown Gracieux

```typescript
export async function shutdownProcessor() {
  isShuttingDown = true;
  if (currentJobId) {
    // Remettre le job en cours à 'pending'
    await kdb.updateTable('jobs')
      .set({ status: 'pending', updated_at: new Date() })
      .where('id', '=', currentJobId)
      .execute();
  }
}
```

### Démarrage

Le processeur peut être démarré de deux façons :

1. **En production** : Via `server/clock.ts` avec la commande `pnpm start:clock`
2. **En développement/debug** : Via CLI avec `pnpm cli jobs start`

Pour traiter un job spécifique : `pnpm cli jobs process <jobId>`

## Création de Jobs

Les jobs sont créés par les modules métier. **Ne jamais créer de jobs directement dans ce module.**

**Exemple dans `src/modules/tiles/server/service.ts` :**

```typescript
import { kdb } from '@/server/db/kysely';
import { type ApiContext } from '@/server/db/kysely/base-model';

export const createBuildTilesJob = async (
  { name }: { name: string }, 
  context: ApiContext
) => {
  return await kdb
    .insertInto('jobs')
    .values({
      type: 'build_tiles',
      data: { name },
      status: 'pending',
      user_id: context.user.id,
      entity_id: context.user.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};
```

## Utilisation Frontend

**Lister les jobs avec polling :**

```typescript
import trpc from '@/modules/trpc/client';

const { data: pendingJobs } = trpc.jobs.list.useQuery(
  {
    types: ['build_tiles', 'sync_geometries_to_airtable'],
    statuses: ['pending', 'processing'],
  },
  {
    refetchInterval: isPolling ? 5000 : false,
  }
);
```

**Avec pagination :**

```typescript
const [page, setPage] = useState(0);
const limit = 20;

const { data } = trpc.jobs.list.useQuery({
  limit,
  offset: page * limit,
  orderBy: 'created_at',
  orderDirection: 'desc',
});

const totalPages = Math.ceil((data?.pagination.total ?? 0) / limit);
```

## Permissions

Toutes les routes TRPC sont protégées par `routeRole(['admin'])`.

## Bonnes Pratiques

1. **Handlers dans les modules métier** : Chaque type de job a son handler dans le module concerné (ex: `tiles`, `pro-eligibility-tests`)
2. **Jobs idempotents** : Les handlers doivent être rejouables sans effets de bord
3. **Logging structuré** : Utiliser `jobLogger` fourni au handler pour tracer l'exécution
4. **Timeout** : Prévoir un timeout dans les handlers pour éviter les jobs bloqués
5. **Résultat structuré** : Retourner un objet typé depuis le handler (stocké dans `result`)
