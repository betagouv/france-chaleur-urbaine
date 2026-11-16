import type { z } from 'zod';

import { zCcrtIdentification } from '@/modules/chaleur-renouvelable/constants';
import type { CcrtDemand } from '@/modules/chaleur-renouvelable/types';
import trpc from '@/modules/trpc/client';

import { invalidateCcrtDemand } from '../ccrt-demand-cache';
import { useCcrtAutosaveForm } from './useCcrtAutosaveForm';

/**
 * Autosaves applicant and co-ownership corrections.
 */
export function useCcrtIdentificationForm(demand: CcrtDemand) {
  const utils = trpc.useUtils();
  const invalidate = () => invalidateCcrtDemand(utils, demand.id);
  const mutation = trpc.batEnr.ccrt.updateIdentification.useMutation({ onError: invalidate });
  const autosave = useCcrtAutosaveForm({
    demand,
    disabled: !!demand.archived_at,
    getDefaultValues: getIdentificationValues,
    invalidate,
    isError: mutation.isError,
    persist: (values, updatedAt) => mutation.mutateAsync({ demandId: demand.id, updatedAt, values }),
    resetError: mutation.reset,
    schema: zCcrtIdentification,
  });
  return { ...autosave, error: mutation.error };
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
