# Config Module

Module de configuration pour la construction du contexte des requêtes et la gestion des sessions utilisateur.

## Structure

```
config/
├── AGENTS.md                    # Ce fichier
└── server/
    └── context-builder.ts       # Construction du contexte TRPC et API
```

## Objectif

Le module config fournit l'infrastructure de base pour :

- **Construction du contexte** : Création du contexte partagé pour les routes TRPC et API
- **Gestion des sessions** : Récupération et validation des sessions utilisateur
- **Authentification** : Vérification des rôles et permissions
- **Logging contextualisé** : Logger avec métadonnées utilisateur et IP

## API Serveur

### Context Builder (`server/context-builder.ts`)

#### `buildContext(req, res?)`

Construit le contexte partagé pour toutes les requêtes TRPC et API.

```typescript
import buildContext, { type Context } from '@/modules/config/server/context-builder';

// Dans une route API
const context = await buildContext(req, res);

// Dans TRPC
const trpcRouter = t.router({
  // Le contexte est automatiquement injecté
});
```

**Paramètres :**
- `req: NextApiRequest` - Requête Next.js
- `res?: NextApiResponse` - Réponse Next.js (optionnel, requis pour la session)

**Retourne :**
```typescript
type Context = {
  user: User | undefined;           // Utilisateur connecté
  userId: number | undefined;       // ID de l'utilisateur
  headers: IncomingHttpHeaders;     // Headers de la requête
  session: Session | null;          // Session NextAuth
  query: ParsedUrlQuery;            // Paramètres de la requête
  hasRole: (role: UserRole) => boolean;  // Vérificateur de rôle
  logger: Logger;                   // Logger contextualisé
};
```

**Fonctionnalités :**

1. **Gestion de session automatique** :
   - Récupère la session si pas déjà peuplée
   - Attache l'utilisateur à `req.user`
   - Évite la duplication si session déjà présente

2. **Vérification des rôles** :
   ```typescript
   const context = await buildContext(req, res);
   
   if (context.hasRole('admin')) {
     // Actions admin uniquement
   }
   ```

3. **Logger contextualisé** :
   - Inclut l'ID utilisateur si `LOG_REQUEST_USER=true`
   - Inclut l'IP si `LOG_REQUEST_IP=true` 
   - Respecte la vie privée selon la configuration

4. **Context partagé** :
   - ⚠️ **Important** : Le contexte est partagé entre toutes les requêtes TRPC batchées
   - Ne pas stocker de données mutables dans le contexte

## Intégration TRPC

Le module est utilisé automatiquement dans la configuration TRPC :

```typescript
// Dans modules/trpc/server/context.ts
import buildContext from '@/modules/config/server/context-builder';

export const createTRPCContext = async ({ req, res }: CreateNextContextOptions) => {
  return await buildContext(req, res);
};
```

## Variables d'Environnement

```bash
# Config module
LOG_REQUEST_USER=true     # Inclut l'ID utilisateur dans les logs
LOG_REQUEST_IP=false      # Inclut l'IP dans les logs (RGPD)
```

**Considérations RGPD :**
- `LOG_REQUEST_USER` : Utile pour le debug, désactiver en production
- `LOG_REQUEST_IP` : Données personnelles, utiliser avec précaution

## Architecture et Séparation des Responsabilités

### Dépendances
- **Authentication** : `@/server/authentication` pour les sessions
- **Logging** : `@/server/helpers/logger` pour le logger parent
- **Types** : `@/types/enum/UserRole` pour la typologie des rôles

### Design Pattern
- **Factory Pattern** : `buildContext` crée des contextes configurés
- **Dependency Injection** : Le contexte injecte les dépendances aux handlers
- **Immutabilité** : Le contexte est en lecture seule une fois créé

### Utilisation Recommandée

```typescript
// ✅ Correct - Utilisation du contexte
export const protectedProcedure = t.procedure
  .use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });

// ✅ Correct - Vérification de rôle
.use(async ({ ctx, next }) => {
  if (!ctx.hasRole('admin')) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

// ❌ Incorrect - Mutation du contexte (partagé entre requêtes)
ctx.customData = 'some value';
```

## Exemples d'Utilisation

### Dans une Route API

```typescript
// pages/api/some-endpoint.ts
import buildContext from '@/modules/config/server/context-builder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await buildContext(req, res);
  
  // Vérification d'authentification
  if (!ctx.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  
  // Vérification de rôle
  if (!ctx.hasRole('admin')) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  // Logging contextualisé
  ctx.logger.info('Endpoint appelé', { action: 'some-action' });
  
  res.json({ success: true });
}
```

### Dans une Procedure TRPC

```typescript
// modules/some-module/server/trpc-routes.ts
export const someRouter = t.router({
  getProtectedData: t.procedure
    .query(async ({ ctx }) => {
      // Contexte automatiquement injecté
      ctx.logger.info('Récupération données protégées');
      
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      
      return { data: 'sensitive data', userId: ctx.userId };
    }),
    
  adminOnly: t.procedure
    .query(async ({ ctx }) => {
      if (!ctx.hasRole('admin')) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      ctx.logger.info('Action admin réalisée');
      return { message: 'Admin action completed' };
    }),
});
```

### Logging Avancé

```typescript
// Le logger hérite du contexte utilisateur
const ctx = await buildContext(req, res);

// Logs automatiquement enrichis avec user/IP si configuré
ctx.logger.info('Action utilisateur', { 
  action: 'update_profile',
  metadata: { field: 'email' }
});

// Logs d'erreur avec contexte
ctx.logger.error('Erreur de validation', { 
  error: error.message,
  input: sanitizedInput 
});
```

Le module config est essentiel à l'architecture TRPC et fournit une base solide pour l'authentification et l'observabilité de l'application.