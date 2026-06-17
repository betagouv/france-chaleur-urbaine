import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import type { IfpenHeatingSimulationInput } from '../constants';
import { getIfpenHeatingSimulation } from './heating-simulation-service';

const baseInput = {
  cityCode: '75056',
  departmentCode: '75',
  dpe: 'D',
  incomeCategory: 'Modeste',
  occupants: 3,
  surface: 100,
  temperatureReference: -7,
} satisfies IfpenHeatingSimulationInput;

describe('getIfpenHeatingSimulation', () => {
  it('returns individual residential heating costs and heat pump prices', () => {
    const result = getIfpenHeatingSimulation(baseInput);

    expect(result).toStrictEqual({
      gasBoilerAnnualBill: 2365.08,
      heatingCostBreakdowns: [
        {
          label: 'PAC air/eau',
          p1: 1410.46,
          p2: 238.8,
          p4: 1281.26,
        },
        {
          label: 'Chaudière gaz condensation',
          p1: 2193.48,
          p2: 171.6,
          p4: 257.86,
        },
        {
          label: 'Chaudière fioul',
          p1: 2382.23,
          p2: 171.6,
          p4: 229.62,
        },
      ],
      heatPumpAnnualBill: 1649.26,
      heatPumpGrossPrice: 21781.5,
      heatPumpNetPrice: 13781.5,
      heatPumpProposedPower: 10.64,
      oilBoilerAnnualBill: 2553.83,
    });
  });

  const incomeCases: TestCase<IfpenHeatingSimulationInput['incomeCategory'], number>[] = [
    { expectedOutput: 14281.5, input: 'Très modeste', label: 'very low income gets the highest aid' },
    { expectedOutput: 16281.5, input: 'Intermédiaire', label: 'middle income gets a lower aid' },
    { expectedOutput: 19281.5, input: 'Supérieur', label: 'high income still gets non MaPrimeRénov aids' },
  ];

  it.each(incomeCases)('$label', (testCase) => {
    expect(getIfpenHeatingSimulation({ ...baseInput, incomeCategory: testCase.input }).heatPumpNetPrice).toStrictEqual(
      testCase.expectedOutput
    );
  });
});
