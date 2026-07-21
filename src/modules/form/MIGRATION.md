# Form layer migration — status

> Living document tracking the migration from the legacy form hook
> (`src/components/form/react-form/useForm.tsx`) to the TanStack Form layer of this
> module (`useAppForm` — see [AGENTS.md](./AGENTS.md) for the API and patterns).
> Update it whenever a form is migrated.

## Why

The legacy hook re-created every field component on each render (new component
identities → full DOM remount of all fields: perf, focus loss), read
`submissionAttempts` outside any subscription (errors not shown reactively), and
disabled the submit button while errors were invisible. The new layer registers
components once at module scope via `createFormHook`, applies the
"reward early, punish late" validation policy (`schemaValidation`), and keeps the
submit button always clickable (submitting reveals errors and focuses the first
invalid field).

## Status

### Migrated ✅

| Form | Notes |
|------|-------|
| `components/connexion/LoginForm` | was manual `useState`; gained schema validation |
| `components/connexion/ResetPasswordForm` | |
| `components/connexion/NewPasswordForm` | |
| `pages/satisfaction.tsx` | dropped the useless hidden `relanceId` input |
| `components/connexion/ProfileNewsletterForm` | |
| `modules/organizations/client/OrganizationForm` | |
| `modules/pro-eligibility-tests/client/RenameEligibilityTestForm` | |
| `components/connexion/ProfileForm` | |
| `components/Admin/UserForm` | removed the `memo()` HACK (remount workaround) |
| `modules/pro-eligibility-tests/client/UpsertEligibilityTestForm` | conditional create/update schema pattern |
| `components/EligibilityForm/components/ContactForm` | uses the `DemandContactFields` field group |
| `modules/pro-eligibility-tests/client/BatchDemandMultiStepForm` | field group mounted on the optional `contact` subtree |
| `components/connexion/RegisterForm` | split into one fully-typed form per step (credentials, identity) — replaces the schema-swapping single form |
| `pages/reseaux/modifier.tsx` | was a hand-rolled `useState` form with native browser validation; `NetworkSearchInput` gained the DSFR error props (used via `CustomField`), `UploadField` gained `append`/`removable`; `reseauClasse` is now actually required client-side |
| `components/Manager/DemandEmailForm` | manager email compose (modal); zod schema replaces native `required` (incl. comma-separated `cc` emails), dirty tracking now reads the form store, template/variable insertion via `setFieldValue` |
| `components/Network/EligibilityTestBox` | network page address test; `AddressSelectField` added to the layer (BAN autocomplete bound to a `BANAddressFeature` field value), `RadioField` replaces `SelectEnergy`, submit button no longer disabled (errors reveal on submit) |
| `components/HeadSliceForm` | main eligibility funnel banner (homepage + landings); same pattern as EligibilityTestBox with the shared `eligibilityTestValidation` schema; URL auto-validate (`?heating=&address=`) goes through `form.handleSubmit()` |
| `modules/chaleur-renouvelable/client/DemandFCRForm` | last consumer of the legacy hook; the `submitContextRef` workaround (needed by the legacy memoized options) is gone, schema defaults applied via `parse` at submit, CGU tracking via a field listener |

Shared: `components/EligibilityForm/components/DemandContactFields` rewritten as a
`withFieldGroup` (self-contained: subscribes to its own values, `listeners`-based
field reset — no more `formUi`/`contactState` props).

### Remaining 🔶

None — every form is on the layer. Next step: the cleanup phase below.

`ContributionForm` migrated (2026-07-21): sync union schema via `schemaValidation`,
`UploadField` + `BooleanRadioField`, flat superset values + boundary-cast union,
`parseAsync` at submit strips unselected-branch fields (replaces the `deleteField`
machinery), the `typeDemandeFields`/`FieldConfig` config replaced by per-type literal
zod shapes + explicit JSX per branch (render helpers, not sub-components). Union
support added to `getSchemaField` for the required markers. An empty submit flags
every common field: the form-side union has an extra branch matching the unselected
`typeDemande` (`''`) that validates the common fields and always fails on the
discriminant. The async zip inspection is a field-level `onDynamicAsync` validator on
`fichiers` (per-File WeakMap cache); the API schema keeps the full async version.
Two earlier attempts failed and are documented in AGENTS.md ("form-level schema must
be fully synchronous"): a separate sync validator for the common fields lost its
errors on change (shared error-map key), and a form-level async schema flickered
(aborted debounced runs clear all form-level errors).

### Typing policy

Goal: no approximate typing (`any`, casts) in the layer nor in migrated forms.
- The layer (`src/modules/form/`) has **zero `any`**; its single cast is the documented
  boundary in `CustomField` (TS cannot prove `Omit<Props>` + injected props = `Props`).
- Remaining casts in migrated forms, all documented in place: the conditional-schema
  pattern (`UserForm`, `UpsertEligibilityTestForm` — `as unknown as z.ZodType<V, V>`),
  empty required enums in `defaultValues` (`BatchDemandMultiStepForm`,
  `UpsertEligibilityTestForm` — `undefined as unknown as <enum>`), and the
  `STRUCTURE_TYPE_TO_ROLE` partial-record lookup (`UserForm`). Eliminating the first
  two families would require splitting create/update into separate components (like
  `RegisterForm`'s per-step forms) or schema changes — decide case by case.

### Cleanup

- ✅ `src/components/form/react-form/useForm.tsx` deleted (no consumer left).
- ✅ `.ai/context/state-management.md`, `modules/notification/AGENTS.md` and this
  module's AGENTS.md updated (no more legacy hook references).
- Still open: de-styled-components the DSFR wrappers under `src/components/form/dsfr/`
  (`Input.styles.ts` `sm` variant → Tailwind) — cosmetic refactor, no functional impact.

## Manual test map

> ✅ All migrated forms below were manually validated on 2026-07-21 (validation
> policy, required markers, conditional fields, layout stability).

Where to find each migrated form for a manual pass:

| Form | Page / how to reach it |
|------|------------------------|
| `LoginForm` | `/connexion` |
| `RegisterForm` | `/inscription` (2 steps — also check the back-and-forth between steps) |
| `ResetPasswordForm` | `/reset-password` |
| `NewPasswordForm` | `/reset-password/<token>` (link in the reset email) |
| `ProfileForm` + `ProfileNewsletterForm` | `/pro/mon-compte` |
| `Satisfaction` (relance comment) | `/satisfaction?id=<relanceId>&satisfaction=true` (link in the relance email) |
| `UserForm` | `/admin/users` — create and edit (structure type must still adjust the role) |
| `OrganizationForm` | `/admin/organizations` — create/rename dialog |
| `UpsertEligibilityTestForm` | `/pro/tests-adresses` — "Créer un test" and "Compléter le test" dialogs (CSV upload, separator change) |
| `RenameEligibilityTestForm` | `/pro/tests-adresses` — rename action on a test |
| `BatchDemandMultiStepForm` | `/pro/tests-adresses` — expand a test, select addresses in the list, then "Être mis en relation" (admin: also the dedicated contact block) |
| `ContactForm` (+ `DemandContactFields`) | `/` — run an address eligibility test then fill the contact form; also on `/reseaux/<id>` (test box), landing pages (`/professionnels`, `/infos-copro`…) and the chaleur-renouvelable results (`/chaleur-renouvelable/resultat`) |
| `ContributionForm` | `/contribution` — check the per-type conditional fields and the zip upload validation |
| `ModifierReseauxPage` | `/reseaux/modifier` — also with `?reseau=7501C` (network + files prefill); do not submit for real (creates an Airtable record) |
| `DemandEmailForm` | `/pro/demandes` or `/admin/demandes` — click a contact email to open the modal; do not submit for real (sends an email + updates Airtable) |
| `EligibilityTestBox` | `/reseaux/7501C` — "Testez l'éligibilité de votre adresse" box; submitting a valid address only opens the contact modal (safe) |
| `HeadSliceForm` | `/` (also `/professionnels`, `/infos-copro`…) — main banner funnel; also check the auto-validate URL `/?heating=collectif&address=1%20Rue%20de%20la%20Paix%2075002%20Paris` (opens the contact modal on load) |
| `DemandFCRForm` | `/chaleur-renouvelable/resultat?adresse=20+Avenue+de+Ségur+75007+Paris&typeLogement=immeuble_chauffage_collectif&typeRadiateur=radiateur-eau&espaceExterieur=shared` — pick the building in the map dialog first; do not submit for real (creates a demand) |

Not migrated yet (reference): `DemandFCRForm` on `/chaleur-renouvelable/resultat` (on hold).

## Migration checklist (per form)

- `defaultValues` complete and annotated with `z.input<typeof schema>` when the
  schema has optional/transformed fields.
- No import left from `components/form/react-form/`.
- Reactive field reads through `useStore(form.store, …)`; side effects through
  `listeners` on `form.AppField` (never by overriding a component's `onChange`).
- Behavior parity except the validation policy (errors revealed on first submit;
  visible errors clear live while typing but an error-free field is only flagged
  on blur/submit; submit never disabled by validity) — this change is intended.
- `pnpm ts`, `pnpm lint`, `pnpm vitest run src/modules/form/useAppForm.spec.tsx`,
  and a manual pass on the form (nominal + invalid submit).
