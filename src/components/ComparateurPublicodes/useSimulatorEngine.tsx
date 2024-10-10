import rules, { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';

import usePublicodesEngine from '@helpers/publicodes/usePublicodesEngine';

export type SimulatorEngine = ReturnType<typeof useSimulatorEngine>;

const useSimulatorEngine = () => {
  return usePublicodesEngine<DottedName>(rules, {
    logger: {
      log: console.log,
      error: console.error,
      // hide all warnings about conversions
      warn: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
    },
  });
};

export default useSimulatorEngine;
