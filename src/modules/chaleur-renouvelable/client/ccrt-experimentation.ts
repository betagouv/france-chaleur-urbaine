import type { TypeLogement } from '../constants';

// Pilot departments used only for public contact routing.
export const CCRT_EXPERIMENTATION_DEPARTMENT_CODES = [
  '01',
  '03',
  '04',
  '05',
  '06',
  '07',
  '13',
  '15',
  '22',
  '26',
  '29',
  '35',
  '38',
  '42',
  '56',
  '61',
  '63',
  '69',
  '73',
  '74',
  '77',
  '78',
  '83',
  '84',
  '91',
  '92',
  '93',
  '94',
  '95',
] as const;

/** Determines public CCRT/France Rénov routing independently of user permissions. */
export function isCcrtExperimentationEligible(departmentCode: string | null | undefined, housingType: TypeLogement | null | undefined) {
  return (
    housingType === 'immeuble_chauffage_collectif' &&
    CCRT_EXPERIMENTATION_DEPARTMENT_CODES.some((experimentationDepartmentCode) => experimentationDepartmentCode === departmentCode)
  );
}
