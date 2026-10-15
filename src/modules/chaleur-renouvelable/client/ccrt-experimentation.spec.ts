import { expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import type { TypeLogement } from '../constants';
import { CCRT_EXPERIMENTATION_DEPARTMENT_CODES, isCcrtExperimentationEligible } from './ccrt-experimentation';

const cases: TestCase<{ department: string | null; housingType: TypeLogement | null }, boolean>[] = [
  ...CCRT_EXPERIMENTATION_DEPARTMENT_CODES.map((department) => ({
    expectedOutput: true,
    input: { department, housingType: 'immeuble_chauffage_collectif' as const },
    label: `CCRT for collective housing in ${department}`,
  })),
  {
    expectedOutput: false,
    input: { department: '75', housingType: 'immeuble_chauffage_collectif' },
    label: 'France Rénov outside the pilot',
  },
  {
    expectedOutput: false,
    input: { department: null, housingType: 'immeuble_chauffage_collectif' },
    label: 'France Rénov without a department',
  },
  { expectedOutput: false, input: { department: '13', housingType: 'maison_individuelle' }, label: 'France Rénov for a house' },
  {
    expectedOutput: false,
    input: { department: '13', housingType: 'immeuble_chauffage_individuel' },
    label: 'France Rénov for individual heating',
  },
];

it.each(cases)('$label', ({ input, expectedOutput }) => {
  expect(isCcrtExperimentationEligible(input.department, input.housingType)).toStrictEqual(expectedOutput);
});
