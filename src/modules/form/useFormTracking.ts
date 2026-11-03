import type { AnyFormApi, AnyFormState } from '@tanstack/react-form';
import { useEffect } from 'react';

import { trackPostHogEvent } from '@/modules/analytics/client';
import type { FormName, FormSubmittedProperties } from '@/modules/analytics/posthog.config';

export type FormTrackingOptions<TValues> = {
  formName: FormName;
  /** Page or placement the form is embedded in, when it exists in several places. */
  source?: string;
  /** Extra non-personal properties of `form:submitted`, derived from the submitted values. */
  getSubmittedProperties?: (values: TValues) => FormSubmittedProperties;
};

/**
 * Generic PostHog tracking of a `useAppForm` form, driven by the form store only (no code in the fields):
 * `form:started` on the first modified field, `form:field_filled` the first time each field is modified,
 * `form:submitted` / `form:submit_failed` on the outcome of every submit attempt.
 * Values are never sent, only field names.
 */
export function useFormTracking<TValues>(form: AnyFormApi, { formName, source, getSubmittedProperties }: FormTrackingOptions<TValues>) {
  useEffect(() => {
    const base = { form_name: formName, source };
    let wasSubmitting = form.store.state.isSubmitting;
    // `isDirty` is sticky, so each field is reported once; a blur-based "completed" event is not
    // reliable (the flag is sticky too and a field can be left before being filled)
    const filledFields = new Set<string>();

    const subscription = form.store.subscribe((state: AnyFormState) => {
      const fieldMetas = Object.entries(state.fieldMeta);

      fieldMetas
        .filter(([fieldName, meta]) => meta?.isDirty && !filledFields.has(fieldName))
        .forEach(([fieldName]) => {
          if (filledFields.size === 0) {
            trackPostHogEvent('form:started', { ...base, field_name: fieldName });
          }
          filledFields.add(fieldName);
          trackPostHogEvent('form:field_filled', { ...base, field_name: fieldName });
        });

      // the outcome is only known once the attempt that validated (and maybe called onSubmit) is over
      const isAttemptOver = wasSubmitting && !state.isSubmitting;
      wasSubmitting = state.isSubmitting;
      if (isAttemptOver) {
        if (state.isSubmitSuccessful) {
          trackPostHogEvent('form:submitted', { ...base, ...getSubmittedProperties?.(state.values as TValues) });
        } else {
          const fieldsInError = fieldMetas.filter(([, meta]) => (meta?.errors.length ?? 0) > 0).map(([fieldName]) => fieldName);
          trackPostHogEvent('form:submit_failed', {
            ...base,
            fields_in_error: fieldsInError,
            reason: state.isValid ? 'server' : 'validation',
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, formName, source, getSubmittedProperties]);
}
