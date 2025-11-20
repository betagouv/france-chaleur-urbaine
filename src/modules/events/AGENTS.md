# Events Module

Système d'audit et de journalisation des événements utilisateur et système pour traçabilité complète des actions.

## Structure

```
events/
├── AGENTS.md                    # Ce fichier
├── constants.ts                 # Types d'événements et constantes
├── client/
│   └── AdminEventsPage.tsx      # Interface admin de consultation des événements
└── server/
    ├── api.ts                   # API REST pour récupération des événements
    └── service.ts               # Service de gestion des événements
```

## Objectif

Le module events permet de :

- **Traçabilité complète** : Audit trail de toutes les actions utilisateur et système
- **Investigation** : Recherche et filtrage d'événements par auteur, type, contexte
- **Monitoring** : Suivi de l'activité en temps réel
- **Conformité** : Respect des exigences de journalisation

## Types d'Événements

### Événements Utilisateur
```typescript
// Authentification
'user_login'        // Connexion utilisateur
'user_activated'    // Activation de compte  
'user_created'      // Création de compte
'user_updated'      // Modification de compte
'user_deleted'      // Suppression de compte
```

### Événements Métier
```typescript  
// Demandes d'éligibilité
'demand_created'    // Nouvelle demande
'demand_assigned'   // Assignation à un gestionnaire
'demand_updated'    // Modification de demande
'demand_deleted'    // Suppression de demande

// Tests d'éligibilité professionnel
'pro_eligibility_test_created'  // Nouveau test
'pro_eligibility_test_renamed'  // Renommage
'pro_eligibility_test_updated'  // Modification
'pro_eligibility_test_deleted'  // Suppression
```

### Événements Système
```typescript
// Tâches techniques
'build_tiles'                    // Génération de tuiles cartographiques
'sync_metadata_from_airtable'    // Synchronisation métadonnées depuis Airtable
'sync_geometries_to_airtable'    // Synchronisation géométries vers Airtable
```

## API Serveur

### Service d'Événements (`server/service.ts`)

#### `listEvents(options)`

Récupère la liste des événements avec filtres et jointures utilisateur.

```typescript
import { listEvents, type ListEventsOptions } from '@/modules/events/server/service';

const events = await listEvents({
  authorId: 'user-uuid',              // Filtrer par auteur
  type: 'user_login',                 // Filtrer par type d'événement
  context: { type: 'demand', id: '123' }  // Filtrer par contexte
});
```

**Options de filtrage :**
- `authorId?: string` - UUID de l'utilisateur auteur
- `context?: { type: string; id: string }` - Contexte métier (demande, test, etc.)
- `type?: EventType` - Type d'événement spécifique

**Retourne :**
```typescript
type AdminEvent = {
  id: number;
  author_id: string | null;
  type: EventType;
  context_type: string;
  context_id: string;
  data: unknown;
  created_at: string;
  author: {
    id: string;
    email: string; 
    role: string;
  } | null;
};
```

**Caractéristiques :**
- **Jointure utilisateur** : Récupération automatique des infos auteur
- **Tri chronologique** : Événements les plus récents en premier
- **Limite de sécurité** : Maximum 1000 événements retournés
- **Données structurées** : Champ `data` JSON flexible par type d'événement

#### `createEvent(event)`

Crée un événement système (sans auteur identifié).

```typescript
import { createEvent } from '@/modules/events/server/service';

await createEvent({
  type: 'build_tiles',
  context_type: 'tiles',
  context_id: 'reseaux-de-chaleur',
  data: { name: 'Réseaux de chaleur', tilesGenerated: 1250 }
});
```

#### `createUserEvent(event)`

Crée un événement avec auteur utilisateur identifié.

```typescript
import { createUserEvent } from '@/modules/events/server/service';

await createUserEvent({
  author_id: userId,
  type: 'demand_updated',
  context_type: 'demand', 
  context_id: demandId,
  data: { fields: ['status', 'gestionnaire'], previous: {...}, current: {...} }
});
```

### API REST (`server/api.ts`)

**Endpoint** : `/api/admin/events`
**Méthode** : GET
**Authentification** : Rôle `admin` requis

```typescript
// Query parameters
{
  authorId?: string;     // UUID utilisateur
  type?: EventType;      // Type d'événement 
  contextType?: string;  // Type de contexte
  contextId?: string;    // ID de contexte
}
```

**Validation Zod :**
```typescript
const querySchema = {
  authorId: z.string().uuid().optional(),
  type: z.enum(eventTypes).optional(),
  contextType: z.string().optional(),
  contextId: z.string().optional(),
};
```

## Interface Admin

### AdminEventsPage (`client/AdminEventsPage.tsx`)

Interface complète de consultation et filtrage des événements avec virtualisation pour les performances.

```typescript
import AdminEventsPage from '@/modules/events/client/AdminEventsPage';

export default AdminEventsPage;
```

**Fonctionnalités principales :**

#### 1. Filtrage Avancé
- **Select par type** : Filtre déroulant avec tous les types d'événements
- **Filtres contextuels** : Clic sur éléments pour filtrer (demande, utilisateur)
- **URL state** : Filtres persistants dans l'URL via `nuqs`

#### 2. Interface Utilisateur
- **VirtualList** : Affichage performant de milliers d'événements
- **Timeline chronologique** : Tri par date décroissante
- **Toggle détails** : Affichage optionnel du JSON des données

#### 3. Navigation Contextuelle
```typescript
// Exemple de filtrages interactifs
<FilterButton onClick={() => updateFilters({ authorId: event.author_id })}>
  {event.author.email}
</FilterButton>

<FilterButton onClick={() => updateFilters({ contextType: 'demand', contextId: event.context_id })}>
  demande
</FilterButton>
```

#### 4. Rendus Spécialisés par Type

Chaque type d'événement a un rendu personnalisé pour une lisibilité optimale :

```typescript
const eventLabelRenderers: Record<EventType, (event, updateFilters) => ReactNode> = {
  user_login: () => "s'est connecté",
  demand_created: (event, updateFilters) => (
    <>
      <span>Une </span>
      <FilterButton onClick={() => updateFilters({ contextType: 'demand', contextId: event.context_id })}>
        demande
      </FilterButton>
      <span> a été créée</span>
    </>
  ),
  build_tiles: (event) => (
    <span>a reconstruit les tuiles <strong>{event.data?.name}</strong></span>
  ),
  // ... autres types
};
```

## Schéma Base de Données

```sql
-- Table des événements
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  author_id UUID REFERENCES users(id),        -- Auteur (optionnel)
  type VARCHAR NOT NULL,                       -- Type d'événement 
  context_type VARCHAR NOT NULL,              -- Type de contexte métier
  context_id VARCHAR NOT NULL,                -- ID du contexte
  data JSONB,                                 -- Données spécifiques à l'événement
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX idx_events_author_id ON events(author_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_context ON events(context_type, context_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- Index composite pour filtres combinés
CREATE INDEX idx_events_author_type ON events(author_id, type);
CREATE INDEX idx_events_context_type ON events(context_type, context_id, type);
```

## Exemples d'Utilisation

### Logging d'Actions Utilisateur

```typescript
// Dans un service métier
import { createUserEvent } from '@/modules/events/server/service';

export async function updateDemand(demandId: string, updates: any, userId: string) {
  const previous = await getDemand(demandId);
  
  // Logique métier de mise à jour
  await updateDemandInDatabase(demandId, updates);
  
  // Événement d'audit
  await createUserEvent({
    author_id: userId,
    type: 'demand_updated',
    context_type: 'demand',
    context_id: demandId,
    data: {
      fields: Object.keys(updates),
      previous: { status: previous.status, gestionnaire: previous.gestionnaire },
      current: { status: updates.status, gestionnaire: updates.gestionnaire }
    }
  });
}
```

### Logging d'Actions Système

```typescript
// Dans un job de synchronisation
import { createEvent } from '@/modules/events/server/service';

export async function syncReseauxMetadata() {
  const startTime = Date.now();
  
  try {
    const syncResults = await performSync();
    
    await createEvent({
      type: 'sync_metadata_from_airtable',
      context_type: 'sync',
      context_id: 'reseaux-metadata',
      data: {
        duration: Date.now() - startTime,
        recordsUpdated: syncResults.updated,
        recordsCreated: syncResults.created,
        success: true
      }
    });
  } catch (error) {
    await createEvent({
      type: 'sync_metadata_from_airtable', 
      context_type: 'sync',
      context_id: 'reseaux-metadata',
      data: {
        duration: Date.now() - startTime,
        error: error.message,
        success: false
      }
    });
    throw error;
  }
}
```

### Recherche et Investigation

```typescript
// Interface de recherche personnalisée
import { listEvents } from '@/modules/events/server/service';

// Toutes les actions d'un utilisateur suspect
const userActivity = await listEvents({
  authorId: suspiciousUserId
});

// Toutes les modifications d'une demande spécifique
const demandHistory = await listEvents({
  context: { type: 'demand', id: demandId }
});

// Tous les échecs de synchronisation
const syncFailures = await listEvents({
  type: 'sync_metadata_from_airtable'
});
const failures = syncFailures.filter(e => e.data?.success === false);
```

### Analytics et Monitoring

```typescript
// Dashboard de statistiques d'activité
import { listEvents } from '@/modules/events/server/service';

export async function getActivityStats(dateRange: { from: Date, to: Date }) {
  const events = await listEvents({});
  
  const eventsByType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const eventsByUser = events.reduce((acc, event) => {
    if (event.author) {
      acc[event.author.email] = (acc[event.author.email] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalEvents: events.length,
    eventsByType,
    eventsByUser,
    mostActiveUsers: Object.entries(eventsByUser)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
  };
}
```

## Intégration avec l'Architecture

### Middleware d'Audit Automatique

```typescript
// Middleware TRPC pour audit automatique
import { createUserEvent } from '@/modules/events/server/service';

export const auditMiddleware = t.middleware(async ({ ctx, type, path, next }) => {
  const result = await next();
  
  // Audit des mutations uniquement
  if (type === 'mutation' && ctx.userId) {
    await createUserEvent({
      author_id: ctx.userId,
      type: determineEventType(path),
      context_type: extractContextType(path),
      context_id: extractContextId(result),
      data: { path, input: sanitizeInput(ctx.input) }
    });
  }
  
  return result;
});
```

### Hook React pour Logging Client

```typescript
// Hook personnalisé pour actions côté client
import { useUserEvent } from '@/modules/events/client/hooks';

export function useAuditedAction() {
  const logEvent = useUserEvent();
  
  const executeWithAudit = async (action: () => Promise<any>, eventType: EventType) => {
    try {
      const result = await action();
      
      await logEvent({
        type: eventType,
        context_type: 'client_action',
        context_id: 'success',
        data: { timestamp: Date.now() }
      });
      
      return result;
    } catch (error) {
      await logEvent({
        type: eventType,
        context_type: 'client_action', 
        context_id: 'error',
        data: { error: error.message, timestamp: Date.now() }
      });
      throw error;
    }
  };
  
  return executeWithAudit;
}
```

## Architecture et Bonnes Pratiques

### Données d'Événement Structurées
- **Données sensibles** : Éviter de logger des données personnelles
- **Sérialisation** : JSON avec structure prévisible par type d'événement
- **Taille limitée** : Éviter les payloads volumineux dans le champ `data`

### Performance et Évolutivité
- **Index optimaux** : Requêtes rapides par auteur, type, contexte et date
- **Limite de résultats** : Protection contre la surcharge mémoire
- **VirtualList** : Affichage performant de milliers d'éléments côté client

### Sécurité et Conformité
- **Accès restreint** : Interface admin uniquement
- **Validation stricte** : Schémas Zod pour tous les inputs
- **Rétention** : Politique de suppression des anciens événements (à implémenter)

Le module events fournit une infrastructure complète d'audit et de monitoring pour la transparence et la conformité de l'application.