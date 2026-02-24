import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';

import type { DPE } from '@/components/choix-chauffage/modesChauffageData';
import { DPE_ORDER } from '@/components/choix-chauffage/modesChauffageData';
import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import type { EspaceExterieur } from '@/modules/app/types';

const espaceExterieurValues = ['shared', 'private', 'both', 'none'] as const satisfies readonly EspaceExterieur[];

const typeLogementValues = [
  'immeuble_chauffage_collectif',
  'immeuble_chauffage_individuel',
  'maison_individuelle',
] as const satisfies readonly TypeLogement[];

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
