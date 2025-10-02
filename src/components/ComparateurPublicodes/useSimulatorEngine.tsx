import rules from '@betagouv/france-chaleur-urbaine-publicodes';

import usePublicodesEngine from '@/components/ComparateurPublicodes/usePublicodesEngine';

export type SimulatorEngine = ReturnType<typeof useSimulatorEngine>;

const useSimulatorEngine = () => {
  return usePublicodesEngine(rules, {
    logger: {
      error: console.error,
      log: console.info,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: hide all warnings about conversions
      warn: () => {},
    },
  });
};

export default useSimulatorEngine;
