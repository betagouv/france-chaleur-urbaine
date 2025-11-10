# Network Eligibility Change Detection System - Implementation Plan

## Overview
Track eligibility changes for tested addresses when network geometries are updated, notify users via email, and display visual indicators in the UI.


pnpm db:pull:prod reseaux_de_chaleur
pnpm db:pull:prod reseaux_de_chaleur_tiles
pnpm db:pull:prod reseaux_de_froid
pnpm db:pull:prod reseaux_de_froid_tiles
pnpm db:pull:prod zone_de_developpement_prioritaire
pnpm db:pull:prod zone_de_developpement_prioritaire_tiles
pnpm db:pull:prod zones_et_reseaux_en_construction
pnpm db:pull:prod zones_et_reseaux_en_construction_tiles

pnpm cli pro-eligibility-tests calculate-all-eligibilities



---

## 0. Refactoring - Move applyGeometriesUpdates to Reseaux Module ✅

**Status:** COMPLETED

**What was done:**
1. ✅ Moved `applyGeometriesUpdates` and `processTableGeometryUpdates` from `tiles/server/service.ts` to `reseaux/server/service.ts`
2. ✅ Moved tRPC route from `tiles/server/trpc-routes.ts` to `reseaux/server/trpc-routes.ts`
3. ✅ Added `zApplyGeometriesUpdatesInput` constant to `reseaux/constants.ts`
4. ✅ Updated imports in `reseaux/client/admin/AdminReseauxPage.tsx` (changed from `trpc.tiles` to `trpc.reseaux`)
5. ✅ Kept `getTileNameFromInternalName` in `tiles/server/service.ts` (tiles concern, not networks)
6. ✅ Removed old code from tiles module

**Why:** The geometry update logic is network-specific and doesn't belong in the tiles service. Moving it to the reseaux module improves code organization and separation of concerns.

---

## 1. Database Schema ✅

**Status:** COMPLETED

**Migration file:** `src/server/db/migrations/20251007160000_add_eligibility_tracking.ts`

### What was added:

**Columns on `pro_eligibility_tests_addresses`:**
- `eligibility_history JSONB DEFAULT '[]'::jsonb NOT NULL` - Stores full history of eligibility snapshots
- `has_eligibility_change BOOLEAN DEFAULT false NOT NULL` - Flag for UI markers (unviewed changes)
- `change_viewed_at TIMESTAMP` - Optional timestamp when user viewed the change

**Columns on `pro_eligibility_tests`:**
- `has_address_changes BOOLEAN DEFAULT false NOT NULL` - Flag indicating if any address in test has changed

**Indexes for performance:**
- `idx_pro_eligibility_tests_addresses_has_change` - Partial index on addresses with changes
- `idx_pro_eligibility_tests_has_changes` - Partial index on tests with changes

**History format:**
```json
[
  {
    "calculated_at": "2025-01-15T10:30:00Z",
    "eligibility": { /* full getDetailedEligibilityStatus result */ }
  }
]
```

**To apply migration:**
```bash
pnpm db:migrate
pnpm db:sync  # Regenerate Kysely types
```

---

## 2. CLI Command - Initial Population ✅

**Status:** COMPLETED

**File:** `src/modules/pro-eligibility-tests/commands.ts`

**Command:** `pnpm cli pro-eligibility-tests calculate-all-eligibilities`

**Options:**
- `--batch-size <number>` - Nombre d'adresses à traiter par batch (défaut: 100)
- `--limit <number>` - Limite le nombre d'adresses à traiter (utile pour les tests)
- `--dry-run` - Simulation sans modification de la base de données

**What was done:**
1. ✅ Created `commands.ts` with `registerProEligibilityTestsCommands` function
2. ✅ Registered command in `scripts/cli.ts`
3. ✅ Implements batch processing for performance
4. ✅ Batch progress logging with simple logger
5. ✅ **Filters out addresses that already have history** (at query level)
6. ✅ Error handling per address (doesn't stop on single failure)
7. ✅ Summary stats: processed, updated, skipped, errors
8. ✅ Optional `--limit` for testing on subset of data

**Usage:**
```bash
# Dry run to see what would happen
pnpm cli pro-eligibility-tests calculate-all-eligibilities --dry-run

# Test on 10 addresses first
pnpm cli pro-eligibility-tests calculate-all-eligibilities --limit 10

# Process all addresses without history
pnpm cli pro-eligibility-tests calculate-all-eligibilities

# Process with custom batch size
pnpm cli pro-eligibility-tests calculate-all-eligibilities --batch-size 200
```

---

## 3. Network Update Detection ✅

**Status:** COMPLETED

**File:** `src/modules/reseaux/server/service.ts`

**What was done:**
1. ✅ Created `getUpdatedNetworkBboxes(config, bufferMeters)` function
   - Queries all entities with non-empty `geom_update`
   - Calculates bbox for each geometry with 1km buffer using PostGIS
   - Transforms coordinates: WGS84 → Lambert 93 → Buffer → WGS84
   - Returns array of `BoundingBox` ready for spatial queries

2. ✅ Updated `applyGeometriesUpdates()` to call bbox detection
   - Calls `getUpdatedNetworkBboxes` BEFORE processing geometries
   - Logs number of affected zones
   - Returns `affectedBboxes` in result for next step
   - Added TODO comment for Step 4 (job creation)

**Implementation:**
```typescript
// Extract bboxes with 1km buffer BEFORE geometry processing
const affectedBboxes = await getUpdatedNetworkBboxes(updateResult, 1000);

// Process geometry updates as usual
const updateResults = await processTableGeometryUpdates(updateResult);

// Return bboxes for eligibility check job (Step 4)
return {
  affectedBboxes,
  jobIds: allJobIds,
  processed,
};
```

---

## 4. Eligibility Recalculation Job

**File:** `src/modules/pro-eligibility-tests/server/jobs.ts`

**Function:** `checkEligibilityChanges(bboxes)`

**Logic:**
1. For each bbox:
   - Query all `pro_eligibility_tests_addresses` within bbox using PostGIS `ST_Intersects`

2. For each address:
   - Fetch current `getDetailedEligibilityStatus()`
   - Get last entry from `eligibility_history`
   - Deep compare with last history entry

3. If changed:
   - Append new snapshot to `eligibility_history`
   - Set `has_eligibility_change = true` on address
   - Set `has_address_changes = true` on parent test

4. Batch update database

**Trigger:** Called automatically after network geometry updates

---

## 5. Weekly Email Notification

**File:** `src/modules/pro-eligibility-tests/server/service.ts`

**Function:** `sendWeeklyEligibilityAlerts()`

**Schedule:** Every Monday at 6:00 AM Paris time (registered in `src/server/cron/cron.ts`)

**Logic:**
1. Query all addresses with `has_eligibility_change = true`
2. Join with tests to get user email
3. Group addresses by user email and test
4. For each user:
   ```
   Subject: L'éligibilité de XX adresses que vous avez testées vient de changer

   Body:
   - Test "Nom du test 1": 5 adresses modifiées
     [Lien vers le test]
   - Test "Nom du test 2": 3 adresses modifiées
     [Lien vers le test]
   ```
5. Send email using `NetworkEligibilityChangeEmail` template
6. **Do NOT reset flags** (flags reset when user views in UI)

---

## 6. Email Template

**File:** `src/modules/email/react-email/templates/NetworkEligibilityChangeEmail.tsx`

**Content:**
- Friendly greeting
- Summary: "L'éligibilité de {totalCount} adresses que vous avez testées vient de changer"
- List of tests with:
  - Test name
  - **Count only** of changed addresses
  - Link to test detail page
- Footer with explanation

---

## 7. UI - Test Detail Page Banner

**File:** `src/modules/pro-eligibility-tests/client/TestDetailPage.tsx` (or equivalent)

**Banner component when `test.has_address_changes = true`:**
```jsx
<Alert severity="info">
  De nouvelles modifications d'éligibilité sont disponibles
</Alert>
```

**On page open:**
- Wait 5 seconds
- Call tRPC mutation: `markTestChangesViewed({ testId })`
- Backend resets `has_address_changes = false` on test
- Banner disappears

---

## 8. UI - Address Table with Change Markers

**File:** `src/modules/pro-eligibility-tests/client/AddressesTable.tsx`

**Visual indicator:**
- Each address row with `has_eligibility_change = true` shows:
  - Badge/dot (e.g., 🔔 or colored indicator)
  - Tooltip: "Éligibilité modifiée"

**History button per row:**
- Opens modal showing `eligibility_history` timeline
- Displays diffs between snapshots

**Auto-clear after viewing:**
```typescript
useEffect(() => {
  const changedAddressIds = addresses
    .filter(a => a.has_eligibility_change)
    .map(a => a.id);

  if (changedAddressIds.length === 0) return;

  const timer = setTimeout(() => {
    markAddressChangesViewedMutation.mutate({
      addressIds: changedAddressIds
    });
  }, 15000); // 15 seconds

  return () => clearTimeout(timer);
}, [addresses]);
```

**Backend mutation:** Sets `has_eligibility_change = false` + `change_viewed_at = NOW()`

---

## 9. tRPC Endpoints

**File:** `src/modules/pro-eligibility-tests/server/trpc-routes.ts`

Add routes:
- `getAddressHistory({ addressId })` - returns full `eligibility_history`
- `markTestChangesViewed({ testId })` - resets test flag
- `markAddressChangesViewed({ addressIds[] })` - resets address flags

---

## Implementation Order

### Phase 0: Refactoring
0. ✅ **Move applyGeometriesUpdates to reseaux module** - Move `applyGeometriesUpdates` function, its tRPC route, and all related functions from tiles module to reseaux module (where it belongs)

### Phase 1: Database & Initial Setup
1. ✅ **Database migration** - Add columns
2. ✅ **CLI command** - Initial population of eligibility history

### Phase 2: Change Detection
3. ✅ **Bbox detection** - Extract bboxes from network updates
4. ⏳ **Eligibility check job** - Recalculate within bboxes
5. ⏳ **tRPC endpoints** - History retrieval + flag reset

### Phase 3: Email Notifications
6. ⏳ **Email template** - Weekly alert template (counts only)
7. ⏳ **Weekly email job** - Send Monday 6AM Paris time alerts

### Phase 4: UI Integration
8. ⏳ **UI banner** - Test page alert banner
9. ⏳ **UI table markers** - Address change indicators
10. ⏳ **Auto-clear logic** - 15-second delay before flag reset

---

## Key Files to Create/Modify

### New Files
- `src/modules/pro-eligibility-tests/commands.ts` (if doesn't exist)
- `src/modules/email/react-email/templates/NetworkEligibilityChangeEmail.tsx`
- `migrations/XXX-add-eligibility-tracking.ts`

### Modified Files
- `src/modules/pro-eligibility-tests/server/service.ts`
- `src/modules/pro-eligibility-tests/server/jobs.ts`
- `src/modules/pro-eligibility-tests/server/trpc-routes.ts`
- `src/server/services/tiles.ts` (or geometry update location)
- `scripts/clock.ts` (register Monday 6AM job)
- `src/modules/pro-eligibility-tests/client/TestDetailPage.tsx`
- `src/modules/pro-eligibility-tests/client/AddressesTable.tsx`

---

## Confirmed Requirements

- ✅ 1km buffer for affected area detection
- ✅ Monday 6:00 AM Paris time for weekly emails
- ✅ 15-second delay before clearing UI flags
- ✅ Email shows counts only, not detailed diffs
- ✅ All users receive notifications (no opt-in checkbox needed)
- ✅ Flags cleared only when user views in UI, not after email sent
