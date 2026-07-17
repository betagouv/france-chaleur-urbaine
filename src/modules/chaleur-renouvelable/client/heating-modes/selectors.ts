import {
  type DPE,
  DPE_VALUES,
  type IncompatibleSolutionRow,
  type ModeDeChauffageId,
  type Situation,
  type TypeLogement,
} from '@/modules/chaleur-renouvelable/constants';

import { modesDeChauffage } from './catalog';

export function improveDpe(dpe: DPE, gainClasse: number): DPE {
  const currentIndex = DPE_VALUES.indexOf(dpe);
  const nextIndex = Math.max(0, currentIndex - Math.max(0, gainClasse));
  return DPE_VALUES[nextIndex];
}

export function getModesDeChauffage(typeLogement: TypeLogement, situation: Situation) {
  return modesDeChauffage[typeLogement].filter((heatingMode) => heatingMode.estPossible(situation));
}

export function getIncompatibleSolutionRows(situation: Situation, typeLogement: TypeLogement): IncompatibleSolutionRow[] {
  const rowsById = new Map<ModeDeChauffageId, IncompatibleSolutionRow>();

  modesDeChauffage[typeLogement].forEach((heatingMode) => {
    (heatingMode.incompatibilites ?? [])
      .filter((incompatibilite) => incompatibilite.isIncompatible(situation))
      .forEach(({ reason, source }) => {
        const existingRow = rowsById.get(heatingMode.id);

        if (existingRow) {
          existingRow.reasons.push({ reason, source });
          return;
        }

        rowsById.set(heatingMode.id, {
          id: heatingMode.id,
          label: heatingMode.label,
          reasons: [{ reason, source }],
        });
      });
  });

  return [...rowsById.values()];
}
