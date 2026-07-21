# Module: form

Reusable form components (in progress — migrating from `src/components/form/`).

## TanStack Form layer (`useAppForm`)

**This is the form API — every form of the app uses it (the legacy `useForm` hook is deleted). Migration history and per-form checklist: [MIGRATION.md](./MIGRATION.md).**

Built on `createFormHook`: field/form components are registered once at module scope in `useAppForm.tsx`, so their identities are stable across renders (no field remount — the core defect of the legacy hook). Validation policy is "reward early, punish late" via `schemaValidation(schema)` (`revalidateLogic`): no visible error before the first submit attempt, then live revalidation. Display is asymmetric on free-typing fields (`useDisplayedFieldErrors`): a visible error clears live while typing, but a field that was error-free when focused is never flagged mid-typing — its new errors only show on blur or submit. Discrete fields (checkbox, radio, select — `useDiscreteFieldErrors`) show and clear errors live once interacted with. In both cases a field is **pristine on mount**: a conditional field revealed after a failed submit shows no error until it is interacted with or a submit happens while it exists (programmatic clears must pass `dontUpdateMeta: true` to preserve this). Error display simply reads `field.state.meta.errors` (reactive, includes form-level schema errors mapped per field) — no touched/blurred gating. The submit button stays enabled when the form is invalid; submitting reveals the errors and focuses the first invalid field.

```tsx
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';

const form = useAppForm({
  ...schemaValidation(zMyForm),
  defaultValues: { email: '' },  // annotate with z.input<typeof zMyForm> when the schema has optional fields
  onSubmit: toastErrors(async ({ value }) => { ... }),
});

<Form form={form}>
  <form.AppField name="email">{(field) => <field.EmailField label="Email" />}</form.AppField>
  <form.SubmitButton>Envoyer</form.SubmitButton>
</Form>
```

Key files: `form-contexts.ts` (contexts, kept separate to avoid an import cycle), `useAppForm.tsx` (hook wiring + `schemaValidation`), `Form.tsx`, `SubmitButton.tsx`, `fields/` (one component per file, bound via `useFieldContext`; `fields/useFieldStatus.ts` centralizes error display + schema-derived `required`). Behavior is locked by `useAppForm.spec.tsx`.

Available fields: `TextField`, `EmailField`, `PasswordField`, `PhoneField`, `NumberField` (`''` → `undefined`), `TextareaField`, `CheckboxField`, `SelectField`, `RadioField`, `BooleanRadioField` (oui/non → boolean), `UploadField` (`File[]`, one-way binding; `append`/`removable` options), `AddressSelectField` (BAN autocomplete, field value = selected `BANAddressFeature`), `CustomField` (bridge for controlled components — Autocomplete, RichSelect… — injects `value`/`onChange` + DSFR error props; unsuitable for event-based components whose value is not the input text — bind those like `AddressSelectField` does with `useFieldContext`). Discriminated-union schemas work end to end (required markers resolve fields across branches; flat superset values + boundary cast + `parseAsync` at submit to strip unselected branches — reference: `ContributionForm`). To add one: create it in `fields/` using `useFieldContext` + `useFieldStatus` hooks, then register it in `fieldComponents` in `useAppForm.tsx`. There is deliberately no hidden field: a value that must reach `onSubmit` without a visible input belongs in `defaultValues` (values live in the form store, not the DOM).

**The form-level schema must be fully synchronous — async validation goes on the field.** Form-level async validators are broken in TanStack v1 for two reasons: (1) `onDynamic` and `onDynamicAsync` share the same error-map key, so the async per-field result silently overwrites the sync one on change revalidation; (2) each keystroke aborts the in-flight debounced run, and an aborted run resolves `undefined`, which *clears every form-level field error* until the next run rewrites them — visible flicker. So: one sync schema via `schemaValidation`, and any async check (file content inspection, server-side uniqueness…) as `validators={{ onDynamicAsync }}` on the concerned `form.AppField` only — it then runs only when that field changes, and its errors live in the field's own error slot. That field validator MUST return the field's **complete verdict** (re-run the field's full schema, sync checks included), never just the async part: its result overwrites the form-schema error stored under the same slot, so a partial `undefined` would erase a sync error (e.g. a wrong file extension) on every submit. Cache expensive per-File checks. Reference: ContributionForm's `createFichiersFieldValidator`. If part of the sync validation would be short-circuited (e.g. a discriminated union stopping at an unselected discriminant), fold it into the schema — see ContributionForm's extra union branch matching the unselected state (`z.literal('')` + always-failing refine).

Recurring patterns:
- **Side effects on change** (e.g. a select that also sets another field): `listeners={{ onChange }}` on `form.AppField` — never override the component's `onChange`.
- **Reactive read of a field value** in the form component (conditional fields): `useStore(form.store, (state) => state.values.x)`.
- **Conditional schema** (create vs update): annotate `defaultValues` with a merged values type and cast the schema union to `z.ZodType<Values, Values>` (see `UserForm`, `UpsertEligibilityTestForm`) — both schemas must accept the runtime values of their mode.
- **Conditionally required fields** (required via a schema `refine`, so statically optional): the refine MUST set `when: () => true` — zod skips a schema's checks when the base parse has an aborting issue (e.g. a required enum/boolean/array still `undefined`), which would otherwise hide the conditional error until every other field is fixed. The schema-derived marker cannot know either — override at the call site with `nativeInputProps={{ required: true }}` when the field is only rendered in the branch where it is required (see `structure_other` in RegisterForm/ProfileForm/UserForm, `emailReferentCommercial` in ContributionForm).
- **Shared field groups across forms**: `withFieldGroup` with an explicitly named render function (`render: MyGroupRender` — an inline `render()` method breaks the hooks lint) typed via `Parameters<Parameters<typeof withFieldGroup<…>>[0]['render']>[0]`; mount with `fields` as a subtree prefix (`"contact"`) or an identity map for root-level values. Reference implementation: `components/EligibilityForm/components/DemandContactFields.tsx`.

## Purpose

Provides a generic autocomplete system and BAN-specific address autocomplete components, designed to be:
- **Reliable**: RxJS-inspired hook prevents stale responses, race conditions, and debounce restarts
- **Accessible**: WCAG 2.2 combobox pattern (ARIA 1.2)
- **Portal-based**: Radix UI Popover ensures dropdown is never clipped by `overflow: hidden`
- **DSFR-compatible**: Styled with CSS variables, integrates with FieldWrapper
- **TanStack Form compatible**: `value`/`onChange` props work with the `CustomField` bridge, or via `AddressSelectField` for BAN addresses

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

**Inside a `useAppForm` form**, prefer `AddressSelectField` (registered field, value = selected `BANAddressFeature`):
```tsx
<form.AppField name="geoAddress">
  {(field) => <field.AddressSelectField label="Adresse" onSelect={(address) => { /* side effects */ }} />}
</form.AppField>
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

## Internal Import Rules

- Use relative imports within this module (`./Autocomplete`, not `@/modules/form/Autocomplete`)
- Import from `@/modules/ban/client` for BAN API calls
- Import from `@/components/form/dsfr/FieldWrapper` for DSFR layout (not yet migrated to this module)

## Related

- `src/modules/ban/` — BAN API client and types
