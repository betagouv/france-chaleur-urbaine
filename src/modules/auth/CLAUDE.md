# Module Auth

Gestion de l'authentification et de l'autorisation des utilisateurs.

## Structure du Module

```
auth/
├── CLAUDE.md            # Ce fichier
├── server/
│   ├── service.ts      # Logique d'authentification (migré depuis /src/server/services/auth.ts)
│   └── trpc-routes.ts  # 🚧 À créer - Routes TRPC publiques
```

## Responsabilités

Ce module gère :

- **Inscription** (`register`) - Création de compte avec validation email
- **Connexion** (`login`) - Authentification par email/password
- **Activation** (`activateUser`) - Validation d'email via token
- **Réinitialisation mot de passe** - Demande et validation de reset
- **Sessions** - Gestion via NextAuth

## Séparation Auth vs Users

| Module Auth | Module Users |
|-------------|--------------|
| Inscription, connexion, logout | CRUD utilisateurs |
| Validation email, reset password | Gestion des rôles et permissions |
| Sessions et tokens | Profil utilisateur |
| Routes **publiques** | Routes **authentifiées** |

## API TRPC

### Routes Publiques

#### `trpc.auth.register`

Inscription d'un nouvel utilisateur avec envoi d'email de confirmation.

```typescript
await trpc.auth.register.mutate({
  email: 'user@example.com',
  password: 'SecurePass123!',
  first_name: 'John',
  last_name: 'Doe',
  role: 'particulier',
  accept_cgu: true,
  optin_newsletter: false,
});
```

#### `trpc.auth.login`

Connexion utilisateur (utilisé par NextAuth).

```typescript
const user = await trpc.auth.login.mutate({
  email: 'user@example.com',
  password: 'SecurePass123!',
});
```

#### `trpc.auth.activate`

Activation du compte via token d'email.

```typescript
await trpc.auth.activate.mutate({
  token: 'activation-token-from-email',
});
```

## Intégration NextAuth

Le module auth s'intègre avec NextAuth pour la gestion des sessions :

**Fichier :** `/src/pages/api/auth/[...nextauth].ts`

```typescript
import { login } from '@/modules/auth/server/service'; // ✅ Migré

providers: [
  CredentialsProvider({
    async authorize(credentials) {
      const user = await login(credentials.email, credentials.password);
      return user;
    },
  }),
]
```

## Sécurité

### Hashage des mots de passe

- **Algorithme** : bcrypt avec salt de 10 rounds
- **Stockage** : Hash uniquement, jamais le mot de passe en clair

### Tokens

- **Activation** : Token aléatoire généré via `generateRandomToken()`
- **Reset password** : Token temporaire stocké en base
- **Expiration** : Les tokens ont une durée de vie limitée

### Validation

- **Email** : Normalisation lowercase + trim
- **Password** : Minimum 10 caractères (via Zod)
- **Rate limiting** : À implémenter (TODO)

## Événements

Le module auth émet des événements dans le module `events` :

- `user_created` - Lors de l'inscription
- `user_activated` - Lors de la validation email
- `user_login` - À chaque connexion réussie
- `password_reset_requested` - Demande de reset
- `password_changed` - Changement de mot de passe

## Emails

Templates d'emails envoyés (via `/src/server/email`) :

- `activation` - Email de confirmation avec lien d'activation
- `password_reset` - Lien de réinitialisation du mot de passe
- `password_changed` - Confirmation de changement

## Utilisation

### Côté Client

```typescript
import trpc from '@/modules/trpc/client';

// Inscription
const handleRegister = async (data: RegistrationSchema) => {
  try {
    await trpc.auth.register.mutate(data);
    // Rediriger vers page de confirmation
  } catch (err) {
    // Gérer l'erreur (email déjà existant, etc.)
  }
};

// NextAuth pour connexion
import { signIn } from 'next-auth/react';

await signIn('credentials', {
  email,
  password,
  redirect: false,
});
```

### Côté Serveur

```typescript
import { register, login, activateUser } from '@/modules/auth/server/service';

// Inscription programmatique
const userId = await register({
  email: 'admin@example.com',
  password: 'SecurePass123!',
  role: 'admin',
  // ...
});

// Activation
await activateUser('token-from-email');
```

## Flux d'inscription

1. **Utilisateur remplit le formulaire** → Validation Zod
2. **`trpc.auth.register`** → Vérification email unique
3. **Création utilisateur** → Statut `pending_email_confirmation`
4. **Envoi email** → Template `activation` avec token
5. **Clic sur le lien** → Route `/api/auth/activate?token=...`
6. **`trpc.auth.activate`** → Statut → `valid`
7. **Redirection** → Page de connexion

## Flux de connexion

1. **Formulaire de login** → Email + password
2. **NextAuth CredentialsProvider** → Appel `login()`
3. **Vérification password** → bcrypt.compare()
4. **Création session** → JWT via NextAuth
5. **Redirection** → Page protégée

## TODO

- [ ] Rate limiting sur les routes d'auth
- [ ] 2FA (Two-Factor Authentication)
- [ ] Gestion des tentatives de connexion échouées
- [ ] OAuth providers (Google, etc.)
- [ ] Refresh tokens pour sessions longues
