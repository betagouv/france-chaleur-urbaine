## Forms (Tanstack Form + Zod)

**Stack**: `@tanstack/react-form` + Zod + DSFR components  
**Hook**: `useForm` from `@/components/form/react-form/useForm`

## Basic Pattern

```typescript
import useForm from '@/components/form/react-form/useForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import { contactFormSchema } from '../constants';

const MyForm = () => {
  const { mutateAsync: submit, isPending } = trpc.module.create.useMutation();

  const { Form, Input, PasswordInput, Submit } = useForm({
    defaultValues: { email: '', password: '' },
    schema: contactFormSchema,
    onSubmit: toastErrors(async ({ value }) => {
      await submit(value);
    }),
  });

  return (
    <Form>
      <Input name="email" label="Email" />
      <PasswordInput name="password" label="Mot de passe" />
      <Submit loading={isPending}>Envoyer</Submit>
    </Form>
  );
};
```

## Zod Schema

**Location**: Define in `module/constants.ts` (shared client/server)

```typescript
import { z } from 'zod';

export const contactFormSchema = z.object({
  email: z.string().email("Email invalide"),
  firstName: z.string().min(1, "Prénom requis"),
  message: z.string().min(10, "Message trop court"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
```

**Complex validation**:
```typescript
.refine((data) => data.role !== 'pro' || !!data.company, {
  message: 'Entreprise requise pour les pros',
  path: ['company'],
})
```

## Form Components

**Available from `useForm`**:
- `Input`, `EmailInput`, `PhoneInput`, `NumberInput`, `UrlInput`, `HiddenInput`
- `PasswordInput`, `Textarea`
- `Select`, `SelectCheckboxes`
- `Checkbox`, `Checkboxes`, `Radio`
- `Submit` - Auto-disabled on validation errors
- `Form` - Wrapper with `noValidate`

**Layout helpers**:
- `Fieldset`, `FieldsetLegend`, `FieldWrapper`

## Advanced Patterns

### Access form values
```typescript
const { useValue, form } = useForm({ ... });

const email = useValue<string>('email');
form.setFieldValue('email', 'new@example.com');
```

### Wrap onSubmit with error handling
```typescript
import { toastErrors } from '@/modules/notification';

onSubmit: toastErrors(async ({ value }) => {
  await submit(value);
})
```

### Debug form (Ctrl+Shift+D)
`<FormDebug />` automatically included in `<Form>` - shows values/errors

## Best Practices

- **Define schemas in `constants.ts`** for client/server reuse
- **Always re-validate on server** (security)
- **Use `toastErrors`** wrapper for mutations
- **Infer types** with `z.infer<typeof schema>`
- **Auto-disabled Submit** - validation errors prevent submission
