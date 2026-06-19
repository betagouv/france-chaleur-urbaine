import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import type { HeatingSimulationInput } from '../constants';
import { getHeatingSimulation } from './simulation-service';

const baseInput = {
  departmentCode: '75',
  dpe: 'D',
  incomeCategory: 'Modeste',
  occupants: 3,
  surface: 100,
  temperatureReference: -7,
} satisfies HeatingSimulationInput;

describe('getHeatingSimulation', () => {
  it('returns individual residential heating costs and heat pump prices', () => {
    const result = getHeatingSimulation(baseInput);

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
      heatPumpBoilerReplacementBonus: 0,
      heatPumpGrossPrice: 21781.5,
      heatPumpMaprimerenovAid: 4000,
      heatPumpNetPrice: 17781.5,
      heatPumpProposedPower: 10.64,
      oilBoilerAnnualBill: 2553.83,
    });
  });

  const incomeCases: TestCase<HeatingSimulationInput['incomeCategory'], number>[] = [
    { expectedOutput: 16781.5, input: 'Très modeste', label: 'very low income gets the highest MaPrimeRénov aid' },
    { expectedOutput: 18781.5, input: 'Intermédiaire', label: 'middle income gets a lower MaPrimeRénov aid' },
    { expectedOutput: 21781.5, input: 'Supérieur', label: 'high income gets no aid in the default heat pump case' },
  ];

  it.each(incomeCases)('$label', (testCase) => {
    expect(getHeatingSimulation({ ...baseInput, incomeCategory: testCase.input }).heatPumpNetPrice).toStrictEqual(testCase.expectedOutput);
  });
});
