# Implementation Plan: User Demands Tracking

## Overview

Add the ability for registered users to view and track their own demands through a dedicated `/mes-demandes` page. This involves linking demands to user accounts and creating a user-facing interface.

## Goals

1. Link demands to user accounts via `user_id` foreign key
2. Automatically link demands on user login by matching email addresses
3. Create `/mes-demandes` page for users to view their demands
4. Auto-set `user_id` when authenticated users create new demands

## Current State

- **Demands table**: No `user_id` field - demands are orphaned from user accounts
- **Email field**: Stored as `Mail` in `legacy_values` JSONB column
- **User access**: Users can create demands but cannot view/track them
- **Gestionnaire access**: Filter by `Gestionnaires` tags, not user ownership

## Architecture Changes

### Database Schema

**Migration**: `src/server/db/migrations/[timestamp]_add_user_id_to_demands.ts`

```sql
-- Add user_id column as optional foreign key
ALTER TABLE demands
ADD COLUMN user_id UUID
REFERENCES users(id)
ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_demands_user_id ON demands(user_id);

-- Create GIN index on email for linking operations
CREATE INDEX idx_demands_email ON demands
USING gin((legacy_values->>'Mail'));
```

**Notes:**
- `user_id` is nullable - existing demands remain unlinked
- `ON DELETE SET NULL` - preserve demands if user deleted
- GIN index enables efficient email lookups during login linking

### Type Definitions

**File**: `src/server/db/kysely/database.ts` (auto-generated)

```typescript
export interface Demands {
  id: Generated<string>;
  user_id: string | null;  // ← New field
  airtable_id: string | null;
  legacy_values: JSONColumnType<AirtableLegacyRecord>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deleted_at?: Timestamp | null;
}
```

**File**: `src/modules/demands/types.ts`

```typescript
export type Demand = {
  id: string;
  user_id: string | null;  // ← Add this field
  // ... existing fields
};
```

## Service Layer Changes

**File**: `src/modules/demands/server/demands-service.ts`

### 1. Update `create()` function

```typescript
export const create = async (
  input: CreateDemandInput,
  userId?: string  // ← Get from ctx.user
): Promise<Demand> => {
  // ... existing validation logic

  const demand = await kdb
    .insertInto('demands')
    .values({
      legacy_values: legacyValues,
      user_id: userId ?? null,  // ← Set if user logged in
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // ... rest of existing logic
};
```

**Changes:**
- Accept optional `userId` parameter from tRPC context
- Set `user_id` when creating demand if user is authenticated

### 2. Add `listByUser()` function

```typescript
export const listByUser = async (userId: string): Promise<Demand[]> => {
  const demands = await kdb
    .selectFrom('demands')
    .selectAll()
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  return Promise.all(
    demands.map(async (demand) => {
      const testAddress = await getTestAddressForDemand(demand.id);
      return augmentGestionnaireDemand({ demand, testAddress });
    })
  );
};
```

**Notes:**
- Only query by `user_id` (no email fallback needed since linking on login)
- Reuse existing `augmentGestionnaireDemand()` for data augmentation
- Include eligibility test address data

### 3. Add `linkDemandsByEmail()` function

```typescript
export const linkDemandsByEmail = async (
  userId: string,
  email: string
): Promise<number> => {
  const result = await kdb
    .updateTable('demands')
    .set({ user_id: userId })
    .where('user_id', 'is', null)  // Only link unlinked demands
    .where(sql`legacy_values->>'Mail'`, '=', email.toLowerCase())
    .where('deleted_at', 'is', null)
    .executeTakeFirst();

  return Number(result.numUpdatedRows ?? 0);
};
```

**Notes:**
- Only links demands that don't already have a user_id
- Case-insensitive email matching
- Returns count of linked demands
- Excludes soft-deleted demands

## Authentication Hook

**File**: `src/modules/auth/server/service.ts`

### Update `login()` function

```typescript
export const login = async (email: string, password: string) => {
  // ... existing validation logic (lines 69-87)

  logger.info('account login', { user_id: user.id });

  // Create login event
  await createUserEvent({
    author_id: user.id,
    context_id: user.id,
    context_type: 'user',
    type: 'user_login',
  });

  // ← ADD THIS: Link demands by email on every login
  try {
    const linkedCount = await linkDemandsByEmail(user.id, user.email);
    if (linkedCount > 0) {
      logger.info('demands linked on login', {
        user_id: user.id,
        count: linkedCount
      });
    }
  } catch (error) {
    logger.error('failed to link demands on login', {
      user_id: user.id,
      error
    });
    // Don't fail login if linking fails
  }

  return { /* ... existing return */ };
};
```

**Notes:**
- Runs on every login (catches new demands created while logged out)
- Wrapped in try/catch - login succeeds even if linking fails
- Logs success/failure for monitoring

## tRPC Routes

**File**: `src/modules/demands/server/trpc-routes.ts`

### Add `user.list` query

```typescript
export const demandsRouter = router({
  admin: { /* ... existing admin routes */ },

  gestionnaire: { /* ... existing gestionnaire routes */ },

  user: {
    // ← ADD THIS
    list: route
      .meta({
        auth: {
          roles: ['particulier', 'professionnel', 'gestionnaire', 'admin']
        }
      })
      .query(async ({ ctx }) => {
        return await demandsService.listByUser(ctx.user.id);
      }),

    // Existing routes
    addRelanceComment: route.input(zAddRelanceCommentInput).mutation(/* ... */),

    create: route
      .input(zCreateDemandInput)
      .mutation(async ({ input, ctx }) => {
        // ← UPDATE: Pass userId if logged in
        return await demandsService.create(input, ctx.user?.id);
      }),

    update: route.input(zUserUpdateDemandInput).mutation(/* ... */),
  },
});
```

**Changes:**
1. Add `user.list` query - returns demands for current user
2. Update `create` mutation - passes `ctx.user?.id` to service
3. Allow all authenticated roles (not just particulier/professionnel)

## Frontend - User Demands Page

**File**: `src/pages/user/demandes.tsx`

### Page Structure

```typescript
import { withAuthentication } from '@/server/authentication';
import trpc from '@/modules/trpc/client';
// ... other imports following /gestionnaire/demandes.tsx pattern

const UserDemandesPage = () => {
  const { data: demands, isLoading } = trpc.demands.user.list.useQuery();

  // Similar structure to /gestionnaire/demandes.tsx but:
  // - Read-only mode (no inline editing)
  // - Simplified columns (remove gestionnaire-only fields)
  // - Map view included
  // - User can update Sondage field only

  return (
    <Container>
      <Heading>Mes demandes</Heading>
      <ResizablePanel>
        <TableSimple
          data={demands}
          columns={userDemandsColumns}
          // ... table configuration
        />
        <Map
          demands={demands}
          // ... map configuration
        />
      </ResizablePanel>
    </Container>
  );
};

export default withAuthentication([
  'particulier',
  'professionnel',
  'gestionnaire',
  'admin'
])(UserDemandesPage);
```

### Table Columns

**Columns to show** (read-only except Sondage):
- Date de la demande
- Adresse
- Status
- Mode de chauffage / Type de chauffage
- Nom réseau
- Distance au réseau
- Commentaire (from gestionnaire)
- Sondage (editable by user)

**Columns to hide** (gestionnaire-only):
- Gestionnaires
- Affecté à
- Gestionnaires validés
- Notification envoyé

### Map View

- Same map configuration as `/gestionnaire/demandes`
- Shows demand locations with network proximity
- Syncs selection with table
- Fly to selected demand

## Data Migration Script

**File**: `src/server/db/scripts/link-existing-demands.ts`

```typescript
/**
 * One-time script to link existing demands to users by email
 * Run once after deploying user_id column
 */
export async function linkExistingDemands() {
  const users = await kdb
    .selectFrom('users')
    .select(['id', 'email'])
    .execute();

  let totalLinked = 0;

  for (const user of users) {
    const linked = await linkDemandsByEmail(user.id, user.email);
    totalLinked += linked;

    if (linked > 0) {
      console.log(`Linked ${linked} demands for ${user.email}`);
    }
  }

  console.log(`Total demands linked: ${totalLinked}`);
}
```

**Usage:**
```bash
# Run after migration deployed
npm run script:link-demands
```

## Implementation Phases

### Phase 1: Database & Types
- [ ] Create migration file
- [ ] Run migration on dev database
- [ ] Verify type generation in kysely/database.ts
- [ ] Update Demand type definition

### Phase 2: Service Layer
- [ ] Update `create()` to accept userId
- [ ] Add `listByUser()` function
- [ ] Add `linkDemandsByEmail()` function
- [ ] Update authentication login hook

### Phase 3: tRPC Routes
- [ ] Add `user.list` query
- [ ] Update `user.create` to pass userId
- [ ] Test routes with authenticated user

### Phase 4: Frontend
- [ ] Create `/pages/user/demandes.tsx`
- [ ] Implement table with user-friendly columns
- [ ] Add map view
- [ ] Test page functionality

### Phase 5: Data Migration
- [ ] Create migration script
- [ ] Test on staging database
- [ ] Run on production after deployment

## Testing Strategy

### Database
- [ ] Test migration up/down
- [ ] Verify indexes created
- [ ] Check foreign key constraints

### Service Layer
- [ ] Unit test `linkDemandsByEmail()`:
  - Links unlinked demands with matching email
  - Doesn't overwrite existing user_id
  - Case-insensitive email matching
  - Returns correct count
- [ ] Unit test `listByUser()`:
  - Returns only demands for given user
  - Excludes deleted demands
  - Returns augmented data with eligibility

### Integration
- [ ] Test login flow links demands
- [ ] Test demand creation sets user_id when logged in
- [ ] Test demand creation leaves user_id null when not logged in

### Frontend
- [ ] Manual test `/user/demandes` page loads
- [ ] Verify table shows correct columns
- [ ] Verify map view works
- [ ] Test Sondage field update

## Security Considerations

- Users can only view demands where `user_id = their_id`
- No access to other users' demands
- tRPC auth middleware enforces authentication
- Email matching is exact (case-insensitive) only

## Performance Considerations

- Index on `user_id` for fast filtering
- GIN index on email for linking operations
- Linking runs async during login (doesn't block)
- Pagination support in table component

## Rollback Plan

If issues arise:
1. Remove `user.list` tRPC route
2. Remove `/user/demandes` page
3. Keep database column (data preserved)
4. Can re-enable after fixes

## Success Criteria

- [ ] Users can view all their demands in `/user/demandes`
- [ ] New demands auto-link when user is logged in
- [ ] Existing demands link on user login
- [ ] Map view shows demand locations
- [ ] No performance degradation on demand queries
- [ ] Migration script successfully links historical demands

## Future Enhancements (Out of Scope)

- Email notifications when demands are linked
- Admin interface to manually link/unlink demands
- Bulk operations on user demands
- Export user demands to CSV
- Demand status change notifications
