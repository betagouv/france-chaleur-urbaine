import rules, { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';

import usePublicodesEngine from '@helpers/publicodes/usePublicodesEngine';

export type SimulatorEngine = ReturnType<typeof useSimulatorEngine>;

const useSimulatorEngine = () => {
  return usePublicodesEngine<DottedName>(rules);
};

export default useSimulatorEngine;
