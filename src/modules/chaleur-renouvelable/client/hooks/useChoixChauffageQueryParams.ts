import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';

import { type DPE, DPE_VALUES, ESPACE_EXTERIEUR_VALUES, TYPE_LOGEMENT_VALUES } from '@/modules/chaleur-renouvelable/constants';

export function useChoixChauffageQueryParams() {
  const queryOptions = {
    history: 'replace' as const,
    scroll: false,
  };
  const [adresse, setAdresse] = useQueryState('adresse', parseAsString.withOptions(queryOptions));
  const [typeLogement, setTypeLogement] = useQueryState(
    'typeLogement',
    parseAsStringLiteral(TYPE_LOGEMENT_VALUES).withOptions(queryOptions)
  );
  const [espaceExterieur, setEspaceExterieur] = useQueryState(
    'espaceExterieur',
    parseAsStringLiteral(ESPACE_EXTERIEUR_VALUES).withOptions(queryOptions)
  );
  const [dpe, setDpe] = useQueryState(
    'dpe',
    parseAsStringLiteral(DPE_VALUES)
      .withDefault('E' as DPE)
      .withOptions(queryOptions)
  );
  const [nbLogements, setNbLogements] = useQueryState('nbLogements', parseAsInteger.withOptions(queryOptions));
  const [surfaceMoyenne, setSurfaceMoyenne] = useQueryState('surfaceMoyenne', parseAsInteger.withOptions(queryOptions));
  const [habitantsMoyen, setHabitantsMoyen] = useQueryState('habitantsMoyen', parseAsString.withOptions(queryOptions));

  return {
    adresse,
    dpe,
    espaceExterieur,
    habitantsMoyen,
    nbLogements,
    setAdresse,
    setDpe,
    setEspaceExterieur,
    setHabitantsMoyen,
    setNbLogements,
    setSurfaceMoyenne,
    setTypeLogement,
    surfaceMoyenne,
    typeLogement,
  };
}
