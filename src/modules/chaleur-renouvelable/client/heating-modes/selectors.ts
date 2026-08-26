import {
  type DPE,
  DPE_VALUES,
  type IncompatibleSolutionRow,
  type ModeDeChauffage,
  type ModeDeChauffageId,
  type Situation,
  type TypeLogement,
} from '@/modules/chaleur-renouvelable/constants';

import { getHeatingModePertinence } from '../heating-mode-rules';
import { modesDeChauffage } from './catalog';

export function improveDpe(dpe: DPE, gainClasse: number): DPE {
  const currentIndex = DPE_VALUES.indexOf(dpe);
  const nextIndex = Math.max(0, currentIndex - Math.max(0, gainClasse));
  return DPE_VALUES[nextIndex];
}

export function getModesDeChauffage(typeLogement: TypeLogement, situation: Situation) {
  return modesDeChauffage[typeLogement]
    .map((heatingMode, catalogIndex) => ({ catalogIndex, heatingMode }))
    .filter((catalogHeatingMode) => catalogHeatingMode.heatingMode.estPossible(situation))
    .map((catalogHeatingMode) => ({
      ...catalogHeatingMode.heatingMode,
      classement: getHeatingModeClassement(catalogHeatingMode.heatingMode, situation, catalogHeatingMode.catalogIndex),
      pertinence: getHeatingModePertinence(catalogHeatingMode.heatingMode.id, situation, catalogHeatingMode.heatingMode.pertinence),
    }))
    .sort((leftHeatingMode, rightHeatingMode) => leftHeatingMode.classement - rightHeatingMode.classement);
}

const getHeatingModeClassement = (heatingMode: ModeDeChauffage, situation: Situation, fallbackClassement: number) =>
  typeof heatingMode.classement === 'function' ? heatingMode.classement(situation) : (heatingMode.classement ?? fallbackClassement);

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
