import { useStore } from '@tanstack/react-form';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { getSchemaField } from '@/utils/validation';

import { useFieldContext } from '../form-contexts';

/**
 * Unique, human-readable error messages of the enclosing field.
 * With `schemaValidation`, errors only exist from the first submit attempt
 * onwards (then update live on change) — no extra display gating is needed.
 */
export function useFieldErrors(): string[] {
  const field = useFieldContext();
  const errors = field.state.meta.errors;
  // several validators can report the same message for one field
  return useMemo(() => [...new Set(errors.map(errorMessage).filter(isNonEmptyMessage))], [errors]);
}

/**
 * Whether a submit attempt happened while the calling field component was
 * mounted. A conditional field revealed after a failed submit starts pristine:
 * the earlier attempts must not make its (legitimate) errors visible.
 */
function useSubmitAttemptedSinceMount(): boolean {
  const field = useFieldContext();
  const submissionAttempts = useStore(field.form.store, (state) => state.submissionAttempts);
  const attemptsAtMountRef = useRef(submissionAttempts);
  return submissionAttempts > attemptsAtMountRef.current;
}

/**
 * Errors of a discrete field (select, radio, checkbox — a change is a complete
 * action): hidden until the field was interacted with (touched/blurred) or a
 * submit happened while it was mounted; live from then on.
 */
export function useDiscreteFieldErrors(): string[] {
  const field = useFieldContext();
  const errors = useFieldErrors();
  const isSubmitAttempted = useSubmitAttemptedSinceMount();
  return isSubmitAttempted || field.state.meta.isTouched || field.state.meta.isBlurred ? errors : [];
}

/**
 * `useDiscreteFieldErrors` mapped to the DSFR `state` / `stateRelatedMessage` props.
 */
export function useFieldErrorState(): { state: 'error' | 'default'; stateRelatedMessage: string | undefined } {
  return toErrorState(useDiscreteFieldErrors());
}

/**
 * Error display for free-typing fields ("validate eagerly, reveal lazily"):
 * an error already visible updates and clears live while typing, but a field
 * that was error-free when focused is not flagged mid-typing, and a field
 * mounted after a failed submit stays pristine — new errors only show on blur
 * or on a submit attempt made while the field exists.
 * Wire `onFocus`/`onBlur` on the input (alongside `field.handleBlur`).
 */
export function useDisplayedFieldErrors(): { errors: string[]; onBlur: () => void; onFocus: () => void } {
  const field = useFieldContext();
  const errors = useFieldErrors();
  const submissionAttempts = useStore(field.form.store, (state) => state.submissionAttempts);
  const attemptsAtMountRef = useRef(submissionAttempts);
  const isSubmitAttempted = submissionAttempts > attemptsAtMountRef.current;
  const [hasBlurred, setHasBlurred] = useState(false);
  const [isSuppressed, setIsSuppressed] = useState(false);

  // a submit attempt always reveals errors, even while the field keeps focus
  useEffect(() => {
    if (submissionAttempts > attemptsAtMountRef.current) {
      setIsSuppressed(false);
    }
  }, [submissionAttempts]);

  return {
    errors: (isSubmitAttempted || hasBlurred) && !isSuppressed ? errors : [],
    onBlur: () => {
      setHasBlurred(true);
      setIsSuppressed(false);
    },
    onFocus: () => {
      if (errors.length === 0) {
        setIsSuppressed(true);
      }
    },
  };
}

/**
 * `useDisplayedFieldErrors` mapped to the DSFR `state` / `stateRelatedMessage` props.
 */
export function useEditableFieldErrorState(): {
  onBlur: () => void;
  onFocus: () => void;
  state: 'error' | 'default';
  stateRelatedMessage: string | undefined;
} {
  const { errors, onBlur, onFocus } = useDisplayedFieldErrors();
  return { onBlur, onFocus, ...toErrorState(errors) };
}

const toErrorState = (errors: string[]): { state: 'error' | 'default'; stateRelatedMessage: string | undefined } =>
  errors.length > 0 ? { state: 'error', stateRelatedMessage: errors.join(', ') } : { state: 'default', stateRelatedMessage: undefined };

/**
 * Whether the enclosing field is required, derived from the form's zod schema
 * (a field is optional when `undefined` passes its sub-schema).
 */
export function useFieldIsRequired(): boolean {
  const field = useFieldContext();
  const validators = field.form.options.validators;
  const fieldName = field.name;
  return useMemo(() => {
    const schema = validators?.onDynamic;
    const fieldSchema = schema instanceof z.ZodType ? getSchemaField(schema, fieldName) : undefined;
    return fieldSchema ? !fieldSchema.safeParse(undefined).success : false;
  }, [validators, fieldName]);
}

// field errors are standard-schema issues ({ message }) or plain strings
const errorMessage = (error: unknown): string | undefined => {
  if (typeof error === 'string') {
    return error;
  }
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : undefined;
};

const isNonEmptyMessage = (message: string | undefined): message is string => Boolean(message);
