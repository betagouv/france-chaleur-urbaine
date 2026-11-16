import { useStore } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';
import type { z } from 'zod';

import type { CcrtDemand } from '@/modules/chaleur-renouvelable/types';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { handleClientError } from '@/modules/notification';

type UseCcrtAutosaveFormOptions<Values> = {
  demand: CcrtDemand;
  schema: z.ZodType<Values, Values>;
  getDefaultValues: (demand: CcrtDemand) => Values;
  persist: (values: Values, updatedAt: string) => Promise<{ updatedAt: string }>;
  invalidate: () => Promise<unknown>;
  isError: boolean;
  resetError: () => void;
  disabled?: boolean;
};

/**
 * Serializes corrections while retaining newer drafts and their original conflict token.
 */
export function useCcrtAutosaveForm<Values>({
  demand,
  schema,
  getDefaultValues,
  persist,
  invalidate,
  isError,
  resetError,
  disabled = false,
}: UseCcrtAutosaveFormOptions<Values>) {
  const updatedAt = useRef(demand.updated_at);
  const savedValues = useRef(getDefaultValues(demand));
  const form = useAppForm({
    ...schemaValidation(schema),
    defaultValues: savedValues.current,
    onSubmit: async ({ value }) => {
      if (JSON.stringify(value) === JSON.stringify(savedValues.current)) {
        return;
      }
      const saveDraft = async (draft: Values): Promise<void> => {
        const result = await persist(draft, updatedAt.current);
        updatedAt.current = result.updatedAt;
        savedValues.current = draft;
        await invalidate();
        const latestValues = form.state.values;
        if (JSON.stringify(latestValues) === JSON.stringify(draft)) {
          form.reset(draft);
        } else if (schema.safeParse(latestValues).success) {
          await saveDraft(latestValues); // Finish newer edits even if the sheet closed during the request.
        }
      };
      await saveDraft(value);
    },
  });
  const values = useStore(form.store, (state) => state.values);
  const isSaving = useStore(form.store, (state) => state.isSubmitting);
  const hasChanges = JSON.stringify(values) !== JSON.stringify(savedValues.current);
  const isValid = schema.safeParse(values).success;

  // Clean editors follow server refreshes; drafts retain the version against which they were edited.
  useEffect(() => {
    if (JSON.stringify(form.state.values) === JSON.stringify(savedValues.current) && !form.state.isSubmitting) {
      savedValues.current = getDefaultValues(demand);
      updatedAt.current = demand.updated_at;
      form.reset(savedValues.current);
    }
  }, [demand, form, getDefaultValues]);

  // Coalesce typing and serialize saves; failures require an explicit retry.
  useEffect(() => {
    if (!hasChanges || !isValid || isSaving || isError || disabled) {
      return;
    }
    const timeout = setTimeout(() => void form.handleSubmit().catch(handleClientError), 800);
    return () => clearTimeout(timeout);
  }, [values, hasChanges, isValid, isSaving, isError, disabled, form]);

  // Warn before closing the browser with an unsaved draft or an in-flight correction.
  useEffect(() => {
    if (!hasChanges && !isSaving) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isSaving]);

  return {
    form,
    hasChanges,
    isSaving,
    isValid,
    reset: () => {
      savedValues.current = getDefaultValues(demand);
      updatedAt.current = demand.updated_at;
      form.reset(savedValues.current);
      resetError();
    },
    save: () => {
      if (!form.state.isSubmitting) {
        void form.handleSubmit().catch(handleClientError);
      }
    },
  };
}
