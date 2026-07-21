import { createFormHook, revalidateLogic } from '@tanstack/react-form';
import type { z } from 'zod';

import { AddressSelectField } from './fields/AddressSelectField';
import { BooleanRadioField } from './fields/BooleanRadioField';
import { CheckboxField } from './fields/CheckboxField';
import { CustomField } from './fields/CustomField';
import { EmailField } from './fields/EmailField';
import { NumberField } from './fields/NumberField';
import { PasswordField } from './fields/PasswordField';
import { PhoneField } from './fields/PhoneField';
import { RadioField } from './fields/RadioField';
import { SelectField } from './fields/SelectField';
import { TextareaField } from './fields/TextareaField';
import { TextField } from './fields/TextField';
import { UploadField } from './fields/UploadField';
import { fieldContext, formContext } from './form-contexts';
import { SubmitButton } from './SubmitButton';

/**
 * App-wide TanStack Form hook. Field and form components are registered once at
 * module scope, so their identities are stable across renders: no field remount,
 * and each field only re-renders on its own state changes.
 *
 * ```tsx
 * const form = useAppForm({
 *   ...schemaValidation(zMyForm),
 *   defaultValues: { email: '' },
 *   onSubmit: async ({ value }) => { ... },
 * });
 *
 * <Form form={form}>
 *   <form.AppField name="email">{(field) => <field.EmailField label="Email" />}</form.AppField>
 *   <form.SubmitButton>Envoyer</form.SubmitButton>
 * </Form>
 * ```
 */
export const { useAppForm, withFieldGroup, withForm } = createFormHook({
  fieldComponents: {
    AddressSelectField,
    BooleanRadioField,
    CheckboxField,
    CustomField,
    EmailField,
    NumberField,
    PasswordField,
    PhoneField,
    RadioField,
    SelectField,
    TextareaField,
    TextField,
    UploadField,
  },
  fieldContext,
  formComponents: {
    SubmitButton,
  },
  formContext,
});

/**
 * Standard validation policy ("reward early, punish late"): no visible error
 * before the first submit attempt, then live revalidation on every change.
 * Free-typing fields additionally defer the *display* of new errors to blur or
 * submit (see `useDisplayedFieldErrors`), so an incomplete value being typed is
 * not flagged prematurely while visible errors still clear live.
 * Spread into `useAppForm` options; keep it as the single source of the policy.
 */
export const schemaValidation = <TSchema extends z.ZodType>(schema: TSchema) => ({
  // without this, TanStack's handleSubmit early-returns on an invalid form WITHOUT
  // re-validating (it only bumps submissionAttempts): errors wiped by a field
  // unmount (e.g. switching union branches remounts the shared fields) would never
  // be re-reported on submit. Submission stays blocked by the post-validation
  // isValid checks — this only guarantees a full fresh validation per attempt.
  canSubmitWhenInvalid: true,
  validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
  validators: { onDynamic: schema },
});
