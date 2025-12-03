# Security Module

Module centralisé pour toutes les fonctionnalités de sécurité du projet : rate limiting, validation d'emails, etc.

## Structure

```
security/
├── CLAUDE.md                      # Documentation
└── server/
    └── rate-limit.ts              # Rate limiter pour API Next.js (express-rate-limit)
```

## Rate Limiting

### Pour API Next.js (`rate-limit.ts`)

Le module exporte :

#### `sharedStore`
MemoryStore global partagé entre toutes les routes pour optimiser la mémoire et permettre l'isolation par préfixe.

#### `rateLimitError`
Erreur standard utilisée pour signaler un dépassement de limite.

#### `createRateLimiter(options)`
Fonction de base qui crée un rate limiter `express-rate-limit`. Utilisée en interne par `createNextApiRateLimiter` et par le module tRPC.

**Note**: Utilise `sharedStore` par défaut si aucun store n'est spécifié dans les options.

#### `createNextApiRateLimiter(options)`
Wrapper adapté pour Next.js API routes.

**Usage** :
```typescript
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit';

const rateLimiter = createNextApiRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 requêtes max
});

export default handleRouteErrors(async (req, res) => {
  await rateLimiter(req, res);
  // ... votre logique
});
```

**Configuration par défaut** :
- Fenêtre : 15 minutes
- Maximum : 20 requêtes par IP
- Headers standard : `RateLimit-*`
- Identification : IP (avec support x-forwarded-for)

### Pour tRPC

Le rate limiting pour tRPC est géré par le module `trpc` lui-même. Voir la [documentation du module tRPC](../trpc/CLAUDE.md#rate-limiting) pour les détails d'utilisation.

## Validation d'Emails

La liste des emails interdits est centralisée dans `src/server/config.ts` :

```typescript
const onlyServerConfig = {
  email: {
    notAllowed: ['sample@tst.com', 'sample@email.tst'],
    notAllowedMessage: 'Une erreur est survenue lors de la validation de votre demande',
  },
};
```

**Usage dans schémas Zod** :
```typescript
import { serverConfig } from '@/server/config';

const schema = z.object({
  email: z.email().refine(
    (email) => !serverConfig.email.notAllowed.includes(email),
    { message: serverConfig.email.notAllowedMessage }
  ),
});
```

## Best Practices

### Rate Limiting par Type de Formulaire

- **Contact forms (tRPC)** : 1 requête/minute (voir module tRPC)
- **API publiques (Next.js)** : 15-20 requêtes/15 minutes (défaut)
- **Upload endpoints** : 10 uploads/heure

### Identificateurs

Le rate limiting utilise l'IP client avec support de :
- `x-forwarded-for` (proxies/load balancers)
- `x-real-ip` (certains proxies)
- `socket.remoteAddress` (fallback)

### Messages d'Erreur

- **Vagues pour spam** : Ne pas révéler la logique anti-spam
- **Clairs pour utilisateurs légitimes** : Indiquer le temps d'attente
- **Consistants** : Même message sur tous les formulaires publics

## Exemples

### Rate Limit Standard (API Next.js)

```typescript
const rateLimiter = createNextApiRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
});

export default handleRouteErrors(async (req, res) => {
  await rateLimiter(req, res);
  // ... votre logique
});
```

### Rate Limit Personnalisé

```typescript
const rateLimiter = createNextApiRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 heure
  limit: 10,
});
```

## Dépendances

- `express-rate-limit` : Library de rate limiting robuste
- `zod` : Pour la validation d'emails

## Architecture

Le module suit le pattern de séparation server/client du projet :
- **server/** : Code backend uniquement (rate limiting, validation)
- Pas de code client dans ce module (sécurité côté serveur uniquement)

### Store Partagé

Un `MemoryStore` global unique (`sharedStore`) est utilisé par défaut pour optimiser la mémoire :
- **Isolation par préfixe** : Chaque route peut utiliser un `keyGenerator` personnalisé pour créer des clés uniques
- **Optimisation mémoire** : Un seul store au lieu d'un par route
- **Module tRPC** : Utilise automatiquement le store partagé avec préfixes basés sur le path

## Notes Importantes

- **Store en mémoire partagé** : Un `sharedStore` global est utilisé pour optimiser la mémoire
- **Isolation des routes** : Utilisez un `keyGenerator` avec préfixe pour isoler les compteurs par route
- **Production multi-instance** : Utiliser Redis store si déploiement multi-instances/cluster
- **Headers HTTP** : Les headers `RateLimit-*` sont exposés automatiquement pour debugging
