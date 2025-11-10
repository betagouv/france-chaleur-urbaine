# Auth Module

Authentication and authorization management for the application.

## Structure

```
auth/
├── CLAUDE.md           # This file
├── server/
│   └── service.ts     # Authentication logic
├── client/
│   └── hooks.ts       # Client-side auth hooks
```

## Responsibilities

This module handles:

- **Registration** (`register`) - Account creation with email validation
- **Login** (`login`) - Email/password authentication
- **Activation** (`activateUser`) - Email validation via token
- **Password Reset** - Request and validation
- **Sessions** - Management via NextAuth
- **User Preferences** - User settings storage

## Auth vs Users Separation

| Auth Module | Users Module |
|-------------|--------------|
| Registration, login, logout | User CRUD operations |
| Email validation, password reset | Role and permission management |
| Sessions and tokens | User profiles |
| **Public** routes | **Authenticated** routes |

## Server API

### Authentication Functions

#### `register(data)`

Creates a new user account with email confirmation.

```typescript
import { register } from '@/modules/auth/server/service';

const userId = await register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  first_name: 'John',
  last_name: 'Doe',
  role: 'particulier',
  accept_cgu: true,
  optin_newsletter: false,
});
```

#### `login(email, password)`

Authenticates a user (used by NextAuth).

```typescript
import { login } from '@/modules/auth/server/service';

const user = await login('user@example.com', 'SecurePass123!');
```

#### `activateUser(token)`

Activates account via email token.

```typescript
import { activateUser } from '@/modules/auth/server/service';

await activateUser('activation-token-from-email');
```

## Client API

### Hooks

#### `useAuthentication()`

Main authentication hook for client components.

```typescript
import { useAuthentication } from '@/modules/auth/client/hooks';

function MyComponent() {
  const { user, isAuthenticated, hasRole, signIn, signOut } = useAuthentication();
  
  if (!isAuthenticated) {
    return <button onClick={() => signIn()}>Login</button>;
  }
  
  return (
    <div>
      <p>Welcome {user.email}</p>
      {hasRole('admin') && <AdminPanel />}
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
```

#### `useInitAuthentication(serverSession)`

Initializes authentication state from server session. Use in `_app.tsx`.

```typescript
import { useInitAuthentication } from '@/modules/auth/client/hooks';

function App({ Component, pageProps: { session, ...pageProps } }) {
  useInitAuthentication(session);
  return <Component {...pageProps} />;
}
```

#### `useUserPreferences()`

Manages user preferences.

```typescript
import { useUserPreferences } from '@/modules/auth/client/hooks';

function Settings() {
  const { userPreferences, updateUserPreferences } = useUserPreferences();
  
  const handleUpdate = async () => {
    await updateUserPreferences({ theme: 'dark' });
  };
}
```

## NextAuth Integration

**File:** `/src/pages/api/auth/[...nextauth].ts`

```typescript
import { login } from '@/modules/auth/server/service';

providers: [
  CredentialsProvider({
    async authorize(credentials) {
      const user = await login(credentials.email, credentials.password);
      return user;
    },
  }),
]
```

## Security

### Password Hashing

- **Algorithm**: bcrypt with 10 rounds salt
- **Storage**: Hash only, never plain text

### Tokens

- **Activation**: Random token via `generateRandomToken()`
- **Password Reset**: Temporary token stored in database
- **Expiration**: Tokens have limited lifetime

### Validation

- **Email**: Lowercase + trim normalization
- **Password**: Minimum 10 characters (via Zod)

## Registration Flow

1. **User fills form** → Zod validation
2. **`register()`** → Email uniqueness check
3. **Create user** → Status `pending_email_confirmation`
4. **Send email** → `activation` template with token
5. **Click link** → Route `/api/auth/activate?token=...`
6. **`activateUser()`** → Status → `valid`
7. **Redirect** → Login page

## Login Flow

1. **Login form** → Email + password
2. **NextAuth CredentialsProvider** → Call `login()`
3. **Password verification** → bcrypt.compare()
4. **Create session** → JWT via NextAuth
5. **Redirect** → Protected page

## Redirection After Login

The module handles automatic redirection after login:

1. Unauthenticated user visits protected page with `?callbackUrl=/dashboard`
2. URL param saved to cookie
3. After successful login, user is redirected to `/dashboard`
4. Cookie is cleared

Managed by `useRedirectionAfterLogin()` hook.

## Email Templates

Sent via `/src/modules/email`:

- `activation` - Email confirmation with activation link
- `password_reset` - Password reset link
- `password_changed` - Change confirmation
