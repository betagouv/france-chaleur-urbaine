# Eligibility Transition Types

This document describes all possible transition types detected by the `getTransition()` function when tracking eligibility history.

## Transition Categories

### Initial State
- **`initial`**: First calculation of eligibility for this address (no previous history)

### No Change
- **`none`**: No significant change detected (same type, network, and distance within 5m tolerance)

### PDP (Périmètre de Développement Prioritaire) Transitions
- **`entree_pdp`**: Address enters a priority development perimeter
- **`sortie_pdp`**: Address leaves a priority development perimeter

### Network Construction Status
- **`futur_vers_existant`**: Future network becomes operational (construction completed)

### New Network Detection
- **`nouveau_reseau_existant`**: An existing network now reaches this address (was previously too far)
- **`nouveau_reseau_futur`**: A future network now reaches this address (was previously too far)
- **`nouveau_reseau`**: Generic new network detection (fallback)
- **`reseau_supprime`**: Network no longer reaches this address (now too far)

### Network Change
- **`changement_reseau`**: Different network is now closest (different `id_fcu`)

### Distance Changes (Same Network & Type)
- **`rapprochement`**: Significant decrease in distance (>50m) with same eligibility type
- **`eloignement`**: Significant increase in distance (>50m) with same eligibility type

### Proximity Bracket Changes

#### Improvements (getting closer)
- **`amelioration_proximite`**:
  - `loin` → `proche`
  - `proche` → `tres_proche`
  - Any type → `dans_zone_reseau_futur`
  - Works for both existing and future networks

#### Degradations (getting farther)
- **`degradation_proximite`**:
  - `tres_proche` → `proche`
  - `proche` → `loin`
  - `dans_zone_reseau_futur` → any future network type
  - Works for both existing and future networks

### City Network Transitions
- **`entree_ville_reseau_sans_trace`**: Address enters a city with a network that has no trace
- **`sortie_ville_reseau_sans_trace`**: Address leaves a city network area and finds a traced network

### Generic Changes
- **`changement_type`**: Generic type change not covered by more specific transitions
- **`modification_mineure`**: Minor change (e.g., small distance change <50m with same type)

## Priority Order

The function evaluates transitions in this priority order:

1. Initial state check
2. No change check
3. PDP transitions
4. Future ↔ Existing network status changes
5. New network detection / Network removal
6. Network change (different id_fcu)
7. Distance changes (>50m)
8. Proximity bracket improvements/degradations
9. City network transitions
10. Generic type change
11. Minor modifications (fallback)

## Typical Flow Examples

### Network Expansion Scenario
```
trop_eloigne (initial)
  ↓ nouveau_reseau_existant
reseau_existant_loin
  ↓ amelioration_proximite
reseau_existant_proche
  ↓ amelioration_proximite
reseau_existant_tres_proche
```

### Construction Completion Scenario
```
reseau_futur_proche (initial)
  ↓ futur_vers_existant
reseau_existant_proche
```

### PDP Creation Scenario
```
reseau_existant_loin (initial)
  ↓ entree_pdp
dans_pdp
```

### Network Retraction Scenario
```
reseau_existant_proche (initial)
  ↓ degradation_proximite
reseau_existant_loin
  ↓ reseau_supprime
trop_eloigne
```

## Usage in Notifications

These transition types can be used to:
1. Filter which changes to notify users about
2. Customize email content based on transition type
3. Display appropriate UI indicators
4. Generate helpful change descriptions

### High-Priority Transitions (Should Always Notify)
- `entree_pdp` / `sortie_pdp`
- `futur_vers_existant`
- `nouveau_reseau_existant` / `nouveau_reseau_futur`
- `amelioration_proximite`

### Medium-Priority Transitions
- `changement_reseau`
- `rapprochement`
- `degradation_proximite`

### Low-Priority Transitions (May Skip Notification)
- `modification_mineure`
- `eloignement` (getting farther)
- `none`
