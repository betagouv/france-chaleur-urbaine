import rules, { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';

import usePublicodesEngine from '@helpers/publicodes/usePublicodesEngine';

const useSimulatorEngine = () => {
  return usePublicodesEngine<DottedName>(rules);
};

export default useSimulatorEngine;
