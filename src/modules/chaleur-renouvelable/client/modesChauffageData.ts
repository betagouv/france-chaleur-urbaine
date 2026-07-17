export type {
  IncompatibleSolutionRow,
  ModeDeChauffage,
  ModeDeChauffageEnriched,
  ModeDeChauffageId,
  ModeDeChauffageUsage,
  PrerequisiteRow,
  PrerequisiteStatus,
  Situation,
} from '@/modules/chaleur-renouvelable/constants';

export { modesDeChauffage } from './heating-modes/catalog';
export { getIncompatibleSolutionRows, getModesDeChauffage, improveDpe } from './heating-modes/selectors';
