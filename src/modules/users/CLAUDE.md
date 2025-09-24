# Module Users

⚠️ **MODULE EN COURS DE MIGRATION** ⚠️

Ce module est actuellement en cours de migration depuis l'architecture legacy vers la nouvelle architecture modulaire.

## État Actuel

### ✅ Ce qui existe dans le module

- **`constants.ts`** : Schémas Zod pour validation
  - `zCredentialsSchema` - Validation email/mot de passe
  - `zIdentitySchema` - Validation identité utilisateur
  - `registrationSchema` - Schéma complet d'inscription
  - `createUserAdminSchema` - Création admin
  - `updateUserAdminSchema` - Mise à jour admin
  - `structureTypes` - Types de structures professionnelles

### 🚧 Ce qui reste à migrer

**Services (actuellement dans `/src/server/services/`):**
- `user.ts` - CRUD utilisateurs, gestion des permissions
- `auth.ts` - Authentification, sessions, tokens

**API Routes (actuellement dans `/src/pages/api/`):**
- `/auth/register` - Inscription utilisateur
- `/auth/[...nextauth]` - NextAuth
- `/user/preferences` - Préférences utilisateur
- `/password/*` - Réinitialisation mot de passe
- `/admin/users-stats` - Statistiques admin
- `/admin/exportObsoleteUsers` - Export utilisateurs obsolètes
- `/v1/users/[key]` - API publique utilisateurs

**Pages Admin (actuellement dans `/src/pages/admin/`):**
- `users.tsx` - Gestion des utilisateurs

## Architecture Cible

```
users/
├── constants.ts              # ✅ Fait - Schémas Zod
├── server/
│   ├── service.ts           # 🚧 À créer - Logique métier
│   ├── auth.service.ts      # 🚧 À créer - Authentification
│   └── trpc-routes.ts       # 🚧 À créer - Routes TRPC
└── client/
    └── admin/
        └── UsersPage.tsx    # 🚧 À migrer depuis pages/admin/users.tsx
```

## Plan de Migration

### Phase 1 : Services Backend
1. Créer `server/service.ts` en migrant depuis `/src/server/services/user.ts`
2. Créer `server/auth.service.ts` en migrant depuis `/src/server/services/auth.ts`
3. Créer `server/trpc-routes.ts` pour remplacer les API routes

### Phase 2 : API & Authentification
1. Migrer les routes d'authentification vers TRPC
2. Adapter NextAuth pour utiliser les nouveaux services
3. Migrer les routes de gestion du mot de passe

### Phase 3 : Interface Admin
1. Migrer `pages/admin/users.tsx` vers `client/admin/UsersPage.tsx`
2. Utiliser les routes TRPC au lieu des API routes
3. Implémenter les fonctionnalités manquantes

### Phase 4 : Nettoyage
1. Supprimer les anciennes API routes
2. Supprimer les anciens services
3. Mettre à jour toutes les références

## Utilisation Actuelle (Legacy)

**⚠️ Ces imports vont changer après la migration :**

```typescript
// Schémas Zod (déjà dans le module)
import { 
  registrationSchema,
  createUserAdminSchema,
  updateUserAdminSchema 
} from '@/modules/users/constants';

// Services (encore en legacy)
import * as userService from '@/server/services/user';
import * as authService from '@/server/services/auth';

// API Routes (encore en legacy)
// POST /api/auth/register
// POST /api/password/reset
// etc.
```

## Utilisation Future (Post-migration)

```typescript
// Schémas Zod
import { 
  registrationSchema,
  createUserAdminSchema 
} from '@/modules/users/constants';

// Services backend
import { 
  createUser,
  updateUser,
  deleteUser 
} from '@/modules/users/server/service';

// TRPC (client)
import trpc from '@/modules/trpc/client';

const { data: users } = trpc.users.list.useQuery({
  role: 'gestionnaire',
  active: true,
});

await trpc.users.create.mutate({
  email: 'user@example.com',
  role: 'particulier',
});
```

## Contribuer à la Migration

Si vous devez travailler sur la gestion des utilisateurs :

1. **Pour une nouvelle fonctionnalité** : Créez-la directement dans le nouveau module
2. **Pour un bugfix urgent** : Corrigez dans le code legacy ET documentez ici
3. **Pour migrer du code** : Suivez le plan de migration ci-dessus

### Checklist pour Migrer une Fonctionnalité

- [ ] Identifier la fonctionnalité dans le code legacy
- [ ] Créer le service correspondant dans `server/service.ts`
- [ ] Créer la route TRPC dans `server/trpc-routes.ts`
- [ ] Ajouter les tests si nécessaire
- [ ] Migrer l'UI vers `client/`
- [ ] Mettre à jour les références dans le code
- [ ] Supprimer l'ancien code

## Notes Importantes

- **NextAuth** : La configuration NextAuth devra être adaptée pour utiliser les nouveaux services
- **Permissions** : Le système de rôles (`UserRole`) est défini dans `/src/types/enum/UserRole.ts`
- **Session** : La gestion de session utilise NextAuth avec JWT
- **Validation** : Tous les schémas Zod sont déjà centralisés dans `constants.ts`

## Contact

Pour toute question sur la migration de ce module, contacter l'équipe technique.