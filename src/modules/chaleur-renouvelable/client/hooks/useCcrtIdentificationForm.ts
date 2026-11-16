import { useStore } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';
import type { z } from 'zod';

import { zCcrtIdentification } from '@/modules/chaleur-renouvelable/constants';
import type { CcrtDemand } from '@/modules/chaleur-renouvelable/types';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { handleClientError } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { invalidateCcrtDemand } from '../ccrt-demand-cache';

/** Keeps unsaved identity corrections attached to their original server version. */
export function useCcrtIdentificationForm(demand: CcrtDemand) {
  const utils = trpc.useUtils();
  const mutation = trpc.batEnr.ccrt.updateIdentification.useMutation({
    onError: () => invalidateCcrtDemand(utils, demand.id),
  });
  const updatedAt = useRef(demand.updated_at);
  const savedValues = useRef(getIdentificationValues(demand));
  const form = useAppForm({
    ...schemaValidation(zCcrtIdentification),
    defaultValues: savedValues.current,
    onSubmit: async ({ value }) => {
      if (JSON.stringify(value) === JSON.stringify(savedValues.current)) return;
      const saveDraft = async (draft: z.input<typeof zCcrtIdentification>): Promise<void> => {
        const result = await mutation.mutateAsync({ demandId: demand.id, updatedAt: updatedAt.current, values: draft });
        updatedAt.current = result.updatedAt;
        savedValues.current = draft;
        await invalidateCcrtDemand(utils, demand.id);
        const latestValues = form.state.values;
        if (JSON.stringify(latestValues) === JSON.stringify(draft)) {
          form.reset(draft);
        } else if (zCcrtIdentification.safeParse(latestValues).success) {
          await saveDraft(latestValues);
        }
      };
      await saveDraft(value);
    },
  });
  const values = useStore(form.store, (state) => state.values);
  const hasChanges = JSON.stringify(values) !== JSON.stringify(savedValues.current);
  const isSaving = useStore(form.store, (state) => state.isSubmitting);
  useEffect(() => {
    if (JSON.stringify(form.state.values) === JSON.stringify(savedValues.current) && !form.state.isSubmitting) {
      savedValues.current = getIdentificationValues(demand);
      updatedAt.current = demand.updated_at;
      form.reset(savedValues.current);
    }
  }, [demand, form]);
  useEffect(() => {
    if (!hasChanges && !isSaving) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isSaving]);
  useEffect(() => {
    if (!hasChanges || isSaving || mutation.isError || demand.archived_at || !zCcrtIdentification.safeParse(values).success) return;
    const timeout = setTimeout(() => void form.handleSubmit().catch(handleClientError), 800);
    return () => clearTimeout(timeout);
  }, [values, hasChanges, isSaving, mutation.isError, demand.archived_at, form]);
  return {
    error: mutation.error,
    form,
    hasChanges,
    isSaving,
    reset: () => {
      savedValues.current = getIdentificationValues(demand);
      updatedAt.current = demand.updated_at;
      form.reset(savedValues.current);
      mutation.reset();
    },
    save: () => {
      if (!form.state.isSubmitting) void form.handleSubmit().catch(handleClientError);
    },
  };
}

const getIdentificationValues = (demand: CcrtDemand): z.input<typeof zCcrtIdentification> => ({
  email: demand.email,
  first_name: demand.first_name,
  last_name: demand.last_name,
  occupant_status: demand.occupant_status,
  organization_name: demand.organization_name ?? '',
  phone: demand.phone ?? '',
  rnic_nom_copropriete: demand.rnic_nom_copropriete ?? '',
  rnic_numero_immatriculation: demand.rnic_numero_immatriculation ?? '',
  rnic_siret_representant_legal: demand.rnic_siret_representant_legal ?? '',
});
