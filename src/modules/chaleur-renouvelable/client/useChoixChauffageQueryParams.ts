import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';

import { type DPE, DPE_ORDER, espaceExterieurValues, typeLogementValues } from '@/modules/chaleur-renouvelable/constants';

export function useChoixChauffageQueryParams() {
  const [adresse, setAdresse] = useQueryState('adresse');
  const [typeLogement, setTypeLogement] = useQueryState('typeLogement', parseAsStringLiteral(typeLogementValues));
  const [espaceExterieur, setEspaceExterieur] = useQueryState('espaceExterieur', parseAsStringLiteral(espaceExterieurValues));
  const [dpe, setDpe] = useQueryState('dpe', parseAsStringLiteral(DPE_ORDER).withDefault('E' as DPE));
  const [nbLogements, setNbLogements] = useQueryState('nbLogements', parseAsInteger.withDefault(25));
  const [surfaceMoyenne, setSurfaceMoyenne] = useQueryState('surfaceMoyenne', parseAsInteger.withDefault(70));
  const [habitantsMoyen, setHabitantsMoyen] = useQueryState('habitantsMoyen', parseAsString.withDefault('2'));

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
