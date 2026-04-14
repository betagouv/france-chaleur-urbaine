import { useEffect } from 'react';

import type { SimulatorEngine } from '@/components/ComparateurPublicodes/useSimulatorEngine';
import {
  buildBuildingSituation,
  buildCeeValueSituation,
  type SimulatorFormState,
  type SimulatorSituation,
} from '@/modules/simulator/constants';

type UseSyncBuildingSituationParams = {
  engine: SimulatorEngine;
  formState: SimulatorFormState;
  housingCountOrArea: number;
};

/**
 * Provides a shared updater for the simulator engine situation and keeps common rules in sync.
 */
export function useSimulatorSituation(engine: SimulatorEngine) {
  const updateSituation = (partialSituation: SimulatorSituation) => {
    engine.setSituation({
      ...engine.getSituation(),
      ...partialSituation,
    });
  };

  return { updateSituation };
}

export function useSyncBuildingSituation({ engine, formState, housingCountOrArea }: UseSyncBuildingSituationParams) {
  const { updateSituation } = useSimulatorSituation(engine);

  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    updateSituation(
      buildBuildingSituation({
        nbLogements: housingCountOrArea,
        producesHotWater: formState.producesHotWater,
        surface: housingCountOrArea,
        tertiarySector: formState.tertiarySector,
        typeBatiment: formState.typeBatiment,
      })
    );
  }, [engine.loaded, formState.producesHotWater, formState.tertiarySector, formState.typeBatiment, housingCountOrArea]);
}

export function useSyncCeeValueSituation(engine: SimulatorEngine, ceeValue: string) {
  const { updateSituation } = useSimulatorSituation(engine);

  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    updateSituation(buildCeeValueSituation(ceeValue));
  }, [ceeValue, engine.loaded]);
}
