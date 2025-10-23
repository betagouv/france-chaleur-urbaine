# Diagnostic Module

Module de diagnostic système pour vérifier l'état des outils et configurations nécessaires au fonctionnement de l'application.

## Structure

```
diagnostic/
├── CLAUDE.md                    # Ce fichier
├── client/
│   └── DiagnosticPage.tsx       # Interface admin de diagnostic
└── server/
    ├── service.ts               # Tests et vérifications système
    └── trpc-routes.ts           # Routes TRPC pour le diagnostic
```

## Objectif

Le module diagnostic permet de :

- **Vérifier les outils géographiques** : ogr2ogr et tippecanoe (Docker ou binaires)
- **Tester fonctionnellement** : Conversion GeoJSON et génération de tuiles
- **Contrôler la configuration** : Base Airtable et variables d'environnement
- **Interface de monitoring** : Dashboard admin pour l'équipe technique

## API Serveur

### Service de Diagnostic (`server/service.ts`)

#### `runDiagnostic()`

Lance un diagnostic complet du système et retourne l'état de tous les composants.

```typescript
import { runDiagnostic } from '@/modules/diagnostic/server/service';

const diagnosticResult = await runDiagnostic();
/*
{
  geo: {
    USE_DOCKER_GEO_COMMANDS: boolean,
    ogr2ogr: { version: CommandResult, functional: CommandTestResult },
    tippecanoe: { version: CommandResult, functional: CommandTestResult }
  },
  airtable: string
}
*/
```

**Vérifications effectuées :**

1. **Configuration géographique** :
   - Variable `USE_DOCKER_GEO_COMMANDS`
   - Disponibilité d'ogr2ogr et tippecanoe
   - Tests fonctionnels avec données réelles

2. **Base Airtable** :
   - Identification de l'environnement (prod/dev)
   - Validation de la configuration

### Tests Fonctionnels

#### `testOgr2ogrFunctional()`

Test complet d'ogr2ogr avec fichiers temporaires :

```typescript
type CommandTestResult = 
  | { success: true }
  | { success: false; error: string };
```

**Processus de test :**
1. Création d'un GeoJSON de test (Point Paris)
2. Conversion via ogr2ogr
3. Vérification de l'intégrité des données
4. Nettoyage automatique des fichiers temporaires

#### `testTippecanoeFunctional()`

Test complet de tippecanoe avec génération de tuiles :

**Processus de test :**
1. Génération de tuiles aux niveaux 5-6
2. Vérification de la structure de répertoires
3. Validation des fichiers générés
4. Nettoyage automatique

## API TRPC

### Routes Admin (`server/trpc-routes.ts`)

```typescript
export const diagnosticRouter = router({
  run: adminRoute.query(async () => {
    return await runDiagnostic();
  }),
});
```

**Endpoint** : `trpc.diagnostic.run.useQuery()`
**Authentification** : Rôle `admin` requis
**Méthode** : Query (lecture seule, mise en cache possible)

## Interface Admin

### DiagnosticPage (`client/DiagnosticPage.tsx`)

Interface de monitoring pour l'équipe technique avec tableau de bord temps réel.

```typescript
import DiagnosticPage from '@/modules/diagnostic/client/DiagnosticPage';

// Utilisation dans une page Next.js admin
export default DiagnosticPage;
```

**Fonctionnalités :**

1. **Diagnostic automatique** au chargement de la page
2. **Actualisation manuelle** via bouton de refresh
3. **États visuels** : Loading, erreur, succès
4. **Tableau de résultats** avec statuts colorés

**Composants UI utilisés :**
- `SimplePage` avec layout centré et authentification
- `Button` DSFR pour l'actualisation
- `Alert` pour les erreurs
- `Heading` pour la structure

### Statuts Visuels

#### Airtable
```typescript
const getAirtableBaseStatus = (base: string) => {
  'prod' → '🟢 Production'
  'dev' → '🟡 Développement' 
  'inconnu' → '❌ Base inconnue'
}
```

#### Outils Géographiques
```typescript
const getCommandResultStatus = (result: CommandResult) => {
  success ? `Version : ${output}` : `Version : ❌ ${output}`
}

const getFunctionalTestStatus = (result: CommandTestResult) => {
  success ? 'Test fonctionnel : ✅ Réussi' : 'Test fonctionnel : ❌ ${error}'
}
```

## Configuration Docker vs Binaires

Le module gère deux modes d'exécution des commandes géographiques :

### Mode Docker (`USE_DOCKER_GEO_COMMANDS=true`)
- Isolation des dépendances
- Versions contrôlées
- Déploiement simplifié
- Performance réduite (overhead Docker)

### Mode Binaires (`USE_DOCKER_GEO_COMMANDS=false`)  
- Performance optimale
- Installation manuelle requise
- Compatibilité système à gérer
- Maintenance des versions

## Types et Structures

### CommandResult
```typescript
type CommandResult = {
  success: boolean;
  output: string;
  error?: string;
};
```

### CommandTestResult
```typescript  
type CommandTestResult =
  | { success: true }
  | { success: false; error: string };
```

### DiagnosticResult
```typescript
type DiagnosticResult = {
  geo: {
    USE_DOCKER_GEO_COMMANDS: boolean;
    ogr2ogr: {
      version: CommandResult;
      functional: CommandTestResult;
    };
    tippecanoe: {
      version: CommandResult;
      functional: CommandTestResult;
    };
  };
  airtable: string;
};
```

## Exemples d'Utilisation

### Monitoring Manuel

```typescript
// Dans une interface admin
const DiagnosticDashboard = () => {
  const { 
    data: diagnostic, 
    error, 
    refetch, 
    isFetching 
  } = trpc.diagnostic.run.useQuery();

  const runHealthCheck = () => {
    refetch();
  };

  if (!diagnostic) return <div>Chargement...</div>;

  return (
    <div>
      <h2>État du Système</h2>
      <button onClick={runHealthCheck} disabled={isFetching}>
        Actualiser
      </button>
      
      {/* Affichage des résultats */}
      <SystemStatus 
        geo={diagnostic.geo}
        airtable={diagnostic.airtable}
      />
    </div>
  );
};
```

### Tests Automatisés

```typescript
// Tests d'infrastructure dans les pipelines CI/CD
import { runDiagnostic } from '@/modules/diagnostic/server/service';

describe('Infrastructure Health', () => {
  it('should have working geo commands', async () => {
    const result = await runDiagnostic();
    
    expect(result.geo.ogr2ogr.functional.success).toBe(true);
    expect(result.geo.tippecanoe.functional.success).toBe(true);
  });
  
  it('should have correct airtable configuration', async () => {
    const result = await runDiagnostic();
    
    expect(result.airtable).toMatch(/^(prod|dev)$/);
  });
});
```

### Logging et Monitoring

```typescript
// Intégration avec des outils de monitoring
import { runDiagnostic } from '@/modules/diagnostic/server/service';
import { createLogger } from '@/server/helpers/logger';

const logger = createLogger('health-check');

export async function periodicHealthCheck() {
  const diagnostic = await runDiagnostic();
  
  // Log des problèmes détectés
  if (!diagnostic.geo.ogr2ogr.functional.success) {
    logger.error('ogr2ogr non fonctionnel', { 
      error: diagnostic.geo.ogr2ogr.functional.error 
    });
  }
  
  if (!diagnostic.geo.tippecanoe.functional.success) {
    logger.error('tippecanoe non fonctionnel', { 
      error: diagnostic.geo.tippecanoe.functional.error 
    });
  }
  
  // Métriques pour monitoring externe
  return {
    healthy: diagnostic.geo.ogr2ogr.functional.success && 
             diagnostic.geo.tippecanoe.functional.success,
    details: diagnostic
  };
}
```

## Dépendances et Architecture

### Modules Dépendants
- **tiles** : Test de génération de tuiles via `generateTilesFromGeoJSON`
- **trpc** : Routes d'API et authentification admin
- **config** : Configuration serveur pour Airtable et Docker

### Outils Système
- **ogr2ogr** : Conversion de formats géographiques
- **tippecanoe** : Génération de tuiles vectorielles
- **Docker** : Optionnel pour l'isolation des commandes
- **Airtable** : Base de données externe

### Sécurité
- **Accès admin uniquement** : Interface et API restreintes
- **Isolation des tests** : Fichiers temporaires avec cleanup automatique
- **Pas d'exposition de données sensibles** : Seuls les statuts sont retournés

Le module diagnostic est essentiel pour la maintenance opérationnelle et le debugging des problèmes liés aux outils géographiques et à la configuration système.