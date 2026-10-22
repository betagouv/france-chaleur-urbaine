import { expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { canProposeHeatNetwork } from './heat-network-eligibility';

const eligibleParams = {
  hasAlreadyReceivedHeatNetworkRefusal: false,
  heatNetworkEligibility: { distance: 100, isEligible: true },
  radiatorType: 'radiateur-eau',
} satisfies Parameters<typeof canProposeHeatNetwork>[0];

const cases: TestCase<Parameters<typeof canProposeHeatNetwork>[0], boolean>[] = [
  { expectedOutput: true, input: eligibleParams, label: 'eligible network and water radiators' },
  {
    expectedOutput: false,
    input: { ...eligibleParams, heatNetworkEligibility: { distance: 100, isEligible: false } },
    label: 'ineligible network',
  },
  {
    expectedOutput: true,
    input: { ...eligibleParams, heatNetworkEligibility: { distance: 199.9, isEligible: true } },
    label: 'just below 200 m',
  },
  {
    expectedOutput: false,
    input: { ...eligibleParams, heatNetworkEligibility: { distance: 200, isEligible: true } },
    label: 'exactly 200 m',
  },
  {
    expectedOutput: false,
    input: { ...eligibleParams, heatNetworkEligibility: { distance: 450, isEligible: true } },
    label: 'above 200 m',
  },
  {
    expectedOutput: false,
    input: { ...eligibleParams, heatNetworkEligibility: { distance: null, isEligible: true } },
    label: 'unknown distance',
  },
  { expectedOutput: false, input: { ...eligibleParams, heatNetworkEligibility: null }, label: 'missing network' },
  { expectedOutput: false, input: { ...eligibleParams, heatNetworkEligibility: undefined }, label: 'unloaded eligibility' },
  { expectedOutput: false, input: { ...eligibleParams, hasAlreadyReceivedHeatNetworkRefusal: true }, label: 'identified refusal' },
  { expectedOutput: false, input: { ...eligibleParams, radiatorType: 'radiateur-electrique' }, label: 'electric radiators' },
  { expectedOutput: false, input: { ...eligibleParams, radiatorType: 'none' }, label: 'other heating emitters' },
  { expectedOutput: false, input: { ...eligibleParams, radiatorType: null }, label: 'unspecified radiators' },
];

it.each(cases)('$label', ({ input, expectedOutput }) => {
  expect(canProposeHeatNetwork(input)).toStrictEqual(expectedOutput);
});
