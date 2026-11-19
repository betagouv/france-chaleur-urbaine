import type { z } from 'zod';

import { MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE, zCcrtBuilding } from '@/modules/chaleur-renouvelable/constants';
import type { CcrtDemand } from '@/modules/chaleur-renouvelable/types';
import trpc from '@/modules/trpc/client';

import { invalidateCcrtDemand } from '../ccrt-demand-cache';
import { useCcrtAutosaveForm } from './useCcrtAutosaveForm';

/**
 * Autosaves building corrections and refreshes their simulation.
 */
export function useCcrtBuildingAutosave(demand: CcrtDemand) {
  const utils = trpc.useUtils();
  const invalidate = () => invalidateCcrtDemand(utils, demand.id, { buildingChanged: true });
  const mutation = trpc.batEnr.ccrt.updateBuilding.useMutation({ onError: invalidate });
  const autosave = useCcrtAutosaveForm({
    demand,
    getDefaultValues: getBuildingDefaultValues,
    invalidate,
    isError: mutation.isError,
    persist: (values, updatedAt) => mutation.mutateAsync({ demandId: demand.id, updatedAt, values }),
    resetError: mutation.reset,
    schema: zCcrtBuilding,
  });
  return { ...autosave, error: mutation.error };
}

const getBuildingDefaultValues = (demand: CcrtDemand): z.input<typeof zCcrtBuilding> => ({
  ...zCcrtBuilding.parse(demand),
  annual_heating_consumption: demand.annual_heating_consumption ?? undefined,
  hot_water_system_type: demand.hot_water_system_type ?? MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
  refusal_period: demand.refusal_period ?? '',
  refusal_reason: demand.refusal_reason ?? '',
  surface_area: demand.surface_area ?? undefined,
});
