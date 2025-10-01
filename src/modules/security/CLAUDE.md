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

Wrapper autour de `express-rate-limit` adapté pour Next.js API routes.

**Usage** :
```typescript
import { createRateLimiter } from '@/modules/security/server/rate-limit';

const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requêtes max
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
const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
});

export default handleRouteErrors(async (req, res) => {
  await rateLimiter(req, res);
  // ... votre logique
});
```

### Rate Limit Personnalisé

```typescript
const rateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
});
```

## Dépendances

- `express-rate-limit` : Library de rate limiting robuste
- `zod` : Pour la validation d'emails

## Architecture

Le module suit le pattern de séparation server/client du projet :
- **server/** : Code backend uniquement (rate limiting, validation)
- Pas de code client dans ce module (sécurité côté serveur uniquement)

## Notes Importantes

- **Store en mémoire** : `express-rate-limit` utilise un store mémoire par défaut, adapté pour instance unique
- **Production multi-instance** : Utiliser Redis store si déploiement multi-instances
- **Headers HTTP** : Les headers `RateLimit-*` sont exposés automatiquement pour debugging
