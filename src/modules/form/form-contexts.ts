import { createFormHookContexts } from '@tanstack/react-form';

/**
 * Shared TanStack Form contexts. Field components read the current field via
 * `useFieldContext`, form components (e.g. SubmitButton) via `useFormContext`.
 * Kept in a dedicated file so field components and the `createFormHook` wiring
 * in `useAppForm.tsx` can both import them without a circular dependency.
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();
