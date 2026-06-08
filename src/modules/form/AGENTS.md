# Module: form

Reusable form components (in progress — migrating from `src/components/form/`).

## Purpose

Provides a generic autocomplete system and BAN-specific address autocomplete components, designed to be:
- **Reliable**: RxJS-inspired hook prevents stale responses, race conditions, and debounce restarts
- **Accessible**: WCAG 2.2 combobox pattern (ARIA 1.2)
- **Portal-based**: Radix UI Popover ensures dropdown is never clipped by `overflow: hidden`
- **DSFR-compatible**: Styled with CSS variables, integrates with FieldWrapper
- **TanStack Form compatible**: `value`/`onChange` props work with `useForm.Field.Custom`

## Exposed Components

### `Autocomplete<Option>`

Generic autocomplete. Delegates async fetching to `useDebouncedSwitchMap`.

```tsx
import { Autocomplete } from '@/modules/form/Autocomplete';

<Autocomplete
  fetchFn={async (query, signal) => fetchResults(query, signal)}
  getOptionValue={(opt) => opt.label}
  getOptionLabel={(opt, query) => <span>{opt.label}</span>}  // optional highlight
  onSelect={(opt) => console.log(opt)}
  onClear={() => console.log('cleared')}
  defaultValue="initial value"
  minCharThreshold={2}
  debounceTime={300}
/>
```

**TanStack Form** (controlled mode):
```tsx
<Autocomplete
  value={field.state.value}
  onChange={field.handleChange}  // called on selection and clear
  onSelect={(opt) => { /* side effects */ }}
/>
```

**Multiple mode** (`multiple` — discriminated union, inline tags):
```tsx
<Autocomplete<string>
  multiple
  values={values}                       // controlled tag values (string[])
  onValuesChange={setValues}            // add/remove
  allowFreeText                         // Enter adds the typed text when no suggestion is highlighted
  fetchFn={fetchFn}                     // optional — omit for a pure free-text tags field (no dropdown)
  getOptionValue={(v) => v}
  getOptionLabel={(v, q) => highlightMatch(v, q)}
/>
```
Tags render inside the field; Enter picks the highlighted suggestion else adds free text (`allowFreeText`), Backspace on an empty input removes the last tag, duplicates are ignored. Single-mode props (`value`/`onChange`/`onClear`/`defaultValue`) don't apply. Wrap with `FieldWrapper` for a DSFR label/hint. Caller-side normalisation (lowercase, dedup) goes in `onValuesChange`.

### `MultiAutocompleteField`

DSFR-wrapped multi-value autocomplete (inline tags). Composes `FieldWrapper` + `Autocomplete` in `multiple` mode over `string` values, with optional clickable quick-picks. Use for tag/operator filters.

```tsx
import { MultiAutocompleteField } from '@/modules/form/MultiAutocompleteField';

<MultiAutocompleteField
  label="Gestionnaire"
  values={values}
  onChange={setValues}
  fetchFn={(q) => trpc.…fetch({ search: q })}  // omit → pure free-text tags
  suggestions={[{ label: 'Dalkia', value: 'dalkia' }]}  // optional quick-picks below
/>
```

### `AddressAutocomplete`

BAN-specific wrapper. Handles `onlyCities` / `excludeCities` / `limit` filtering.

```tsx
import { AddressAutocomplete } from '@/modules/form/AddressAutocomplete';

<AddressAutocomplete
  excludeCities
  onSelect={(address) => {
    const [lon, lat] = address.geometry.coordinates;
  }}
/>
```

### `AddressAutocompleteInput`

DSFR wrapper (label + hint + error state). Use this in forms.

```tsx
import { AddressAutocompleteInput } from '@/modules/form/AddressAutocompleteInput';

<AddressAutocompleteInput
  label="Adresse"
  hintText="Saisissez votre adresse complète"
  state={hasError ? 'error' : 'default'}
  stateRelatedMessage={hasError ? 'Adresse invalide' : undefined}
  onSelect={(address) => { /* ... */ }}
/>
```

**With TanStack Form via `useForm.Field.Custom`**:
```tsx
const { Field } = useForm({ ... });

<Field.Custom
  name="address"
  Component={AddressAutocompleteInput}
  label="Adresse"
  excludeCities
  onSelect={(address) => {
    form.setFieldValue('latitude', address.geometry.coordinates[1]);
    form.setFieldValue('longitude', address.geometry.coordinates[0]);
  }}
/>
```

### `useDebouncedSwitchMap<TInput, TOutput>`

Low-level hook. Prefer using it indirectly via `Autocomplete`.

```ts
import { useDebouncedSwitchMap } from '@/modules/form/useDebouncedSwitchMap';

const { run, cancel, isRunning } = useDebouncedSwitchMap({
  fn: (input, signal) => fetchData(input, signal),
  debounce: 300,
  onSuccess: (results, input) => setResults(results),
  onError: (error, input) => setError(error.message),
});
```

## Backward Compatibility

Re-exports from legacy paths (`src/components/form/`) ensure no import changes are needed in existing code:
- `@/components/form/Autocomplete` → re-exports `Autocomplete`
- `@/components/form/AddressAutocomplete` → re-exports `AddressAutocomplete`
- `@/components/form/dsfr/AddressAutocompleteInput` → re-exports `AddressAutocompleteInput`

## Internal Import Rules

- Use relative imports within this module (`./Autocomplete`, not `@/modules/form/Autocomplete`)
- Import from `@/modules/ban/client` for BAN API calls
- Import from `@/components/form/dsfr/FieldWrapper` for DSFR layout (not yet migrated to this module)

## Related

- `src/components/form/react-form/useForm.tsx` — TanStack Form integration (not yet migrated)
- `src/modules/ban/` — BAN API client and types
