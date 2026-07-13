# Module Users

⚠️ **MODULE EN COURS DE MIGRATION** ⚠️

Ce module est actuellement en cours de migration depuis l'architecture legacy vers la nouvelle architecture modulaire.

## User tags

Cross-cutting metadata an admin can attach to any user (flags: attended a webinar, roadmap priority…).

- **Tables**: `user_tags` (catalog: `id`, `name` unique — case- and accent-insensitive via `immutable_unaccent(lower(name))`, `color` hex) + `user_tag_assignments` (join `user_id`/`tag_id`, `ON DELETE CASCADE`). Renaming/recoloring = one catalog update (stable ids); deleting a tag detaches it from every user.
- **Color**: free hex string stored in `color` (no fixed palette). Text color (black/white) is derived from the background luminance via `getContrastTextColor` (`utils/color.ts`); `DEFAULT_TAG_COLOR` (grey) is applied to a tag created on the fly.
- **Service** (`server/tags-service.ts`): `listTags`, `createTag`, `updateTag`, `deleteTag`, `getUserTags`, `getAllUserTags`, `setUserTags` (transactional replace-all + `user_updated_by_admin` event carrying the added/removed-names diff).
- **Audit**: catalog mutations emit `user_tag_created` / `user_tag_updated` (name/color from→to diff) / `user_tag_deleted` events (context `user_tag`, id = tag id); assignments are audited via `user_updated_by_admin` on the target user.
- **tRPC** (admin only): `usersRouter.adminTags.*` — `list`, `create`, `update`, `delete`, `getForUser`, `setForUser`.
- **UI** (`client/admin/`, Trello-style): `TagsCombobox` (controlled multi-tag field — chips inside the field, catalog shown on focus, inline search by name + a keyboard-reachable create row, portaled dropdown, focus kept on pick via mousedown `preventDefault`, optimistic catalog cache), `TagChip` (clickable chip → small form: "Retirer de cet utilisateur" on top, then a name+color draft with Enregistrer / Supprimer; ArrowDown opens it), `TagColorPicker` (`@uiw/react-color-colorful` picker), `UserTagBadge` (display), `TagsEditor` (edit-mode wrapper, optimistic assign/remove). Wired into `UserForm` (wrapped in `fr-input-group`) + a filterable (`ComboBox` → `arrayIncludesAny`, by name) / sortable / exportable column in `pages/admin/users.tsx`.
- **Admin list**: `service.list()` joins tags per user (`getAllUserTags`, like permissions) → each user carries `tags: {id,name,color}[]`.
- **⚠️ Focus/remount gotcha**: `UserForm` is wrapped in `React.memo` (compare `user`/`loading` only) because `useForm` rebuilds its Field/Form components on every render — any re-render of `UserForm` remounts the whole form and steals focus from the live tags field. For the same reason, tag mutations must **not** invalidate the `['/api/admin/users']` list query while the dialog is open (it rebuilds `editingUser` → re-render → remount); the list is refetched once on dialog close instead. The dropdown adds `onWheel` `stopPropagation` so it can scroll despite the dialog's `react-remove-scroll` lock.

## État Actuel

### ✅ Ce qui existe dans le module

- **`constants.ts`** : Schémas Zod pour validation
  - `zCredentialsSchema` - Validation email/mot de passe
  - `zIdentitySchema` - Validation identité utilisateur
  - `registrationSchema` - Schéma complet d'inscription
  - `createUserAdminSchema` - Création admin
  - `updateUserAdminSchema` - Mise à jour admin
  - `structureTypesLabels` - Types de structures professionnelles
- **`server/service.ts`** : Services CRUD utilisateurs (migré depuis `/src/server/services/user.ts`)

### 🚧 Ce qui reste à migrer

**API Routes (actuellement dans `/src/pages/api/`):**
- `/user/preferences` - Préférences utilisateur
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
│   ├── service.ts           # ✅ Fait - Logique métier (migré)
│   └── trpc-routes.ts       # 🚧 À créer - Routes TRPC
└── client/
    └── admin/
        └── UsersPage.tsx    # 🚧 À migrer depuis pages/admin/users.tsx
```

## Plan de Migration

### Phase 1 : Services Backend ✅
1. ✅ Migrer `server/service.ts` depuis `/src/server/services/user.ts`
2. ✅ Migrer `auth` vers module séparé `/src/modules/auth`
3. 🚧 Créer `server/trpc-routes.ts` pour remplacer les API routes

### Phase 2 : API Routes
1. Migrer `/api/user/preferences` vers TRPC
2. Migrer `/api/admin/users-stats` vers TRPC
3. Migrer `/api/admin/exportObsoleteUsers` vers TRPC

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

// Services (migré dans les modules)
import * as userService from '@/modules/users/server/service';
import * as authService from '@/modules/auth/server/service';

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
