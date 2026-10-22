import type { TypeLogement } from '../constants';

// Pilot departments from the DEPARTEMENTS column of the CCRT operators export (2026-10-15).
export const CCRT_EXPERIMENTATION_DEPARTMENT_CODES = [
  '01',
  '03',
  '04',
  '05',
  '06',
  '07',
  '13',
  '15',
  '16',
  '17',
  '19',
  '23',
  '24',
  '26',
  '33',
  '38',
  '40',
  '42',
  '44',
  '47',
  '49',
  '53',
  '59',
  '60',
  '62',
  '63',
  '64',
  '69',
  '70',
  '72',
  '73',
  '74',
  '79',
  '80',
  '83',
  '84',
  '85',
  '86',
  '87',
] as const;

/** Determines public CCRT/France Rénov routing independently of user permissions. */
export function isCcrtExperimentationEligible(departmentCode: string | null | undefined, housingType: TypeLogement | null | undefined) {
  return (
    housingType === 'immeuble_chauffage_collectif' &&
    CCRT_EXPERIMENTATION_DEPARTMENT_CODES.some((experimentationDepartmentCode) => experimentationDepartmentCode === departmentCode)
  );
}
