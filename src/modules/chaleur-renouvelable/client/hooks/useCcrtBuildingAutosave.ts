import { useStore } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';
import type { z } from 'zod';

import { MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE, zCcrtBuilding } from '@/modules/chaleur-renouvelable/constants';
import type { CcrtDemand } from '@/modules/chaleur-renouvelable/types';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { invalidateCcrtDemand } from '../ccrt-demand-cache';

/**
 * Serializes automatic building corrections while preserving newer drafts and the server conflict token.
 */
export function useCcrtBuildingAutosave(demand: CcrtDemand) {
  const utils = trpc.useUtils();
  const mutation = trpc.batEnr.ccrt.updateBuilding.useMutation({
    onError: () => invalidateCcrtDemand(utils, demand.id, { buildingChanged: true }),
  });
  const updatedAt = useRef(demand.updated_at);
  const savedValues = useRef(getBuildingDefaultValues(demand));
  const form = useAppForm({
    ...schemaValidation(zCcrtBuilding),
    defaultValues: savedValues.current,
    onSubmit: toastErrors(async ({ value }) => {
      if (JSON.stringify(value) === JSON.stringify(savedValues.current)) {
        return;
      }
      const saveDraft = async (draft: z.input<typeof zCcrtBuilding>): Promise<void> => {
        const result = await mutation.mutateAsync({ demandId: demand.id, updatedAt: updatedAt.current, values: draft });
        updatedAt.current = result.updatedAt;
        savedValues.current = draft;
        await invalidateCcrtDemand(utils, demand.id, { buildingChanged: true });
        const latestValues = form.state.values;
        if (JSON.stringify(latestValues) === JSON.stringify(draft)) {
          form.reset(draft);
        } else if (zCcrtBuilding.safeParse(latestValues).success) {
          await saveDraft(latestValues); // Finish newer edits even if the sheet was closed during the request.
        }
      };
      await saveDraft(value);
    }),
  });
  const values = useStore(form.store, (state) => state.values);
  const isSaving = useStore(form.store, (state) => state.isSubmitting);
  const hasChanges = JSON.stringify(values) !== JSON.stringify(savedValues.current);
  const isValid = zCcrtBuilding.safeParse(values).success;

  // A clean editor follows server refreshes; a draft retains the version against which it was edited.
  useEffect(() => {
    if (JSON.stringify(form.state.values) === JSON.stringify(savedValues.current) && !form.state.isSubmitting) {
      savedValues.current = getBuildingDefaultValues(demand);
      form.reset(savedValues.current);
      updatedAt.current = demand.updated_at;
    }
  }, [demand, form]);

  // Coalesce typing and wait for the current request before saving a newer draft; failures require an explicit retry.
  useEffect(() => {
    if (!hasChanges || !isValid || isSaving || mutation.isError) {
      return;
    }
    const timeout = setTimeout(() => void form.handleSubmit(), 800);
    return () => clearTimeout(timeout);
  }, [values, hasChanges, isValid, isSaving, mutation.isError, form]);

  // Do not silently lose a draft or an in-flight correction when the browser closes the page.
  useEffect(() => {
    if (!hasChanges && !isSaving) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isSaving]);

  return {
    error: mutation.error,
    form,
    hasChanges,
    isSaving,
    isValid,
    reset: () => {
      savedValues.current = getBuildingDefaultValues(demand);
      updatedAt.current = demand.updated_at;
      form.reset(savedValues.current);
      mutation.reset();
    },
    save: () => {
      if (!form.state.isSubmitting) {
        void form.handleSubmit();
      }
    },
  };
}

/**
 * Normalizes nullable snapshot fields for the editable controls without discarding the stored values.
 */
const getBuildingDefaultValues = (demand: CcrtDemand): z.input<typeof zCcrtBuilding> => ({
  ...zCcrtBuilding.parse(demand),
  annual_heating_consumption: demand.annual_heating_consumption ?? undefined,
  hot_water_system_type: demand.hot_water_system_type ?? MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
  refusal_period: demand.refusal_period ?? '',
  refusal_reason: demand.refusal_reason ?? '',
  surface_area: demand.surface_area ?? undefined,
});
