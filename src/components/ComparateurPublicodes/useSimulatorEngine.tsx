import rules from '@betagouv/france-chaleur-urbaine-publicodes';

import usePublicodesEngine from '@/components/ComparateurPublicodes/usePublicodesEngine';

export type SimulatorEngine = ReturnType<typeof useSimulatorEngine>;

const useSimulatorEngine = () => {
  return usePublicodesEngine(rules, {
    logger: {
      log: console.info,
      error: console.error,
      // hide all warnings about conversions
      warn: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
    },
  });
};

export default useSimulatorEngine;
