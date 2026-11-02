# Module Users

⚠️ **MODULE EN COURS DE MIGRATION** ⚠️

Ce module est actuellement en cours de migration depuis l'architecture legacy vers la nouvelle architecture modulaire.

## User preferences (`users.preferences` JSONB)

Single JSONB column validated by `zUserPreferences` (`constants.ts`): `email_signature` (pre-filled in emails sent to demand contacts, also saved on each send) and `notifications` (`new_demands`: `daily` | `weekly` | `none`, `pending_demands_reminder`: boolean — classic demand notifications require a network permission and are consumed by `demands/server/manager-notifications.ts`; CCRT accounts use the same two preferences with their territorial permissions, consumed by `chaleur-renouvelable/server/ccrt-notifications.ts`). The column default equals `defaultUserPreferences` (keep both in sync); every read goes through `parseUserPreferences` so a key added later gets its default without a migration. `updateUserPreferences(userId, partial)` deep-merges, validates the full object, writes and emits `user_preferences_updated`. tRPC: `users.getPreferences` / `users.updatePreferences` (partial input). UI (all in `client/preferences/`): `NotificationPreferencesFields.tsx` is the shared TanStack field group (admin `UserForm` with `fields="notifications"`), taking a `scope` (`network` | `ccrt`) that only changes the wording; `NotificationPreferencesForm.tsx` (demand notifications section of `/pro/mon-compte`, each change saves immediately) reads `notification_scope` from `users.getProfile` (`network` with a network permission, `ccrt` for a CCRT with a territorial permission, else null → info notice), `NewsletterForm.tsx` (newsletter section, `optin_at` + ADEME Connect sync) and `EmailSignatureForm.tsx` (signature section); all track PostHog `account:preference_updated`. The admin create/update inputs carry `notifications` (replaces the whole block, keeps the signature). Newsletter opt-in stays in `optin_at` (consent date synced to ADEME Connect).

Preference writes use `updateUserPreferences(userId, changes, database?)`: a transaction and user-row lock serialize partial updates; callers such as CCRT email delivery can pass their transaction to keep the preferences and audit event atomic with their own changes.

## Account opening emails

`server/service.ts#create` sends an opening email only when the new account is explicitly active: `auth.gestionnaire.ouverture-espace` for network managers, `auth.ccrt.ouverture-espace` for CCRT only when `IS_CCRT_EMAIL_ENABLED` (`chaleur-renouvelable/constants.ts`) is enabled (currently `false`). Account creation remains available, with no automatic backfill of skipped opening emails when re-enabled. Updates, including activation of an existing account, do not send an opening email. The CCRT template uses generic manager-space wording and explains how to set a password through the forgotten-password flow.

## User tags

Cross-cutting metadata an admin can attach to any user (flags: attended a webinar, roadmap priority…).

- **Tables**: `user_tags` (catalog: `id`, `name` unique — case- and accent-insensitive via `immutable_unaccent(lower(name))`, `color` hex) + `user_tag_assignments` (join `user_id`/`tag_id`, `ON DELETE CASCADE`). Renaming/recoloring = one catalog update (stable ids); deleting a tag detaches it from every user.
- **Color**: free hex string stored in `color` (no fixed palette). Text color (black/white) is derived from the background luminance via `getContrastTextColor` (`utils/color.ts`); `DEFAULT_TAG_COLOR` (grey) is applied to a tag created on the fly.
- **Service** (`server/tags-service.ts`): `listTags`, `createTag`, `updateTag`, `deleteTag`, `getUserTags`, `getAllUserTags`, `setUserTags` (transactional replace-all + `user_updated_by_admin` event carrying the added/removed-names diff), `addTagsToUsersByEmail` (bulk **add** without replacing existing tags: matches users case-insensitively by email, inserts with `ON CONFLICT DO NOTHING … RETURNING` so only truly-new pairs are counted/audited, returns `{ matchedUserCount, notFoundEmails, assignmentsAdded }`, one `user_updated_by_admin` event per user that gained ≥1 tag).
- **Audit**: catalog mutations emit `user_tag_created` / `user_tag_updated` (name/color from→to diff) / `user_tag_deleted` events (context `user_tag`, id = tag id); assignments are audited via `user_updated_by_admin` on the target user.
- **tRPC** (admin only): `usersRouter.adminTags.*` — `list`, `create`, `update`, `delete`, `getForUser`, `setForUser`, `addToUsers` (bulk add by email list).
- **UI** (`client/admin/`, Trello-style): `TagsCombobox` (controlled multi-tag field — chips inside the field, catalog shown on focus, inline search by name + a keyboard-reachable create row, portaled dropdown, closes on input blur — Radix outside-click dismissal is defeated by the Dialog's click `stopPropagation` — with mousedown `preventDefault` on the dropdown so picking/scrolling never blurs, optimistic catalog cache), `TagChip` (clickable chip → small form: "Retirer l'étiquette" on top, then a name+color draft with Enregistrer / Supprimer; ArrowDown opens it), `TagColorPicker` (`@uiw/react-color-colorful` picker), `UserTagBadge` (display), `TagsEditor` (edit-mode wrapper, optimistic assign/remove), `BulkTagDialog` ("Étiqueter en masse" from the users page header: reuses `TagsCombobox` + an emails textarea, calls `adminTags.addToUsers`, shows the result inline and refetches the list). Wired into `UserForm` (wrapped in `fr-input-group`) + a filterable (`ComboBox` → `arrayIncludesAny`, by name) / sortable / exportable column in `pages/admin/users.tsx`.
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
1. ✅ Migrer `/api/user/preferences` vers TRPC (`users.getPreferences` / `users.updatePreferences`)
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
