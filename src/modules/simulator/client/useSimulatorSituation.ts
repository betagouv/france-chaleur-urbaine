import { useEffect } from 'react';

import type { SimulatorEngine } from '@/components/ComparateurPublicodes/useSimulatorEngine';
import { buildPublicodeSituation, type SimulatorFormState, type SimulatorSituation } from '@/modules/simulator/constants';

export function useSimulatorSituation(engine: SimulatorEngine) {
  const updateSituation = (partialSituation: SimulatorSituation) => {
    engine.setSituation({
      ...engine.getSituation(),
      ...partialSituation,
    });
  };

  return { updateSituation };
}

export function useSyncSimulatorSituation({
  engine,
  formState,
  ceeValue = '',
}: {
  engine: SimulatorEngine;
  formState: SimulatorFormState;
  ceeValue?: string;
}) {
  const { updateSituation } = useSimulatorSituation(engine);
  const { nbLogements, producesHotWater, surface, tertiarySector, typeBatiment } = formState;

  const normalizedCeeValue = ceeValue.replace(',', '.').trim();

  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    updateSituation({
      'Paramètres économiques . Aides . Valeur CEE': normalizedCeeValue === '' ? null : Number(normalizedCeeValue) / 1000,
    });
  }, [engine.loaded, normalizedCeeValue]);

  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    updateSituation(
      buildPublicodeSituation({
        nbLogements,
        producesHotWater,
        surface,
        tertiarySector,
        typeBatiment,
      })
    );
  }, [engine.loaded, nbLogements, producesHotWater, surface, tertiarySector, typeBatiment]);
}
