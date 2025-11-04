## Forms (Tanstack React Form + Zod)

**Stack**: `@tanstack/react-form` + `zod` for validation, DSFR components

## Pattern

```typescript
import { useForm } from '@/components/form/react-form/useForm';
import { z } from 'zod';

// 1. Define Zod schema in constants.ts (shared client/server)
const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(10, "Min 10 caractères"),
});

type FormData = z.infer<typeof schema>;

// 2. Create form with schema validation
const form = useForm({
  defaultValues: { email: '', password: '' } as FormData,
  schema,
  onSubmit: async ({ value }) => {
    await api.submit(value);
  },
});

// 3. Use DSFR form components
<form.Input name="email" label="Email" />
<form.PasswordInput name="password" label="Mot de passe" />
<form.SubmitButton>Envoyer</form.SubmitButton>
```

## Form Components (auto-wired with validation)

- `form.Input` / `form.PasswordInput` / `form.TextArea`
- `form.Select` / `form.SelectCheckboxes`
- `form.Checkbox` / `form.Checkboxes` / `form.Radio`
- `form.SubmitButton` - auto-disabled on validation errors

Error states automatically managed via `getInputErrorStates(field)`.

## Validation Rules

- Client: `schema` in `useForm({ schema })` validates on change
- Server: re-validate with same schema for security
- Schemas in `constants.ts` for reuse across client/server

