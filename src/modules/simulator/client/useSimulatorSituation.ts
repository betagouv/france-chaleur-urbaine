import { useEffect } from 'react';

import type { SimulatorEngine } from '@/components/ComparateurPublicodes/useSimulatorEngine';
import { buildBuildingSituation, CEE_VALUE_RULE, type SimulatorFormState, type SimulatorSituation } from '@/modules/simulator/constants';

export function useSimulatorSituation(engine: SimulatorEngine) {
  const updateSituation = (partialSituation: SimulatorSituation) => {
    engine.setSituation({
      ...engine.getSituation(),
      ...partialSituation,
    });
  };

  return { updateSituation };
}

export function useSyncBuildingSituation({ engine, formState }: { engine: SimulatorEngine; formState: SimulatorFormState }) {
  const { updateSituation } = useSimulatorSituation(engine);
  const { nbLogements, producesHotWater, surface, tertiarySector, typeBatiment } = formState;

  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    updateSituation(
      buildBuildingSituation({
        nbLogements,
        producesHotWater,
        surface,
        tertiarySector,
        typeBatiment,
      })
    );
  }, [engine.loaded, nbLogements, producesHotWater, surface, tertiarySector, typeBatiment]);
}

export function useSyncCeeValueSituation(engine: SimulatorEngine, ceeValue: string) {
  const { updateSituation } = useSimulatorSituation(engine);
  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    const normalizedCeeValue = ceeValue.replace(',', '.').trim();
    const parsedCeeValue = normalizedCeeValue === '' ? null : Number(normalizedCeeValue) / 1000;
    updateSituation({
      [CEE_VALUE_RULE]: parsedCeeValue,
    });
  }, [ceeValue, engine.loaded]);
}
