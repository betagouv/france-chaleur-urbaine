import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import type { HeatingSimulationInput } from '../constants';
import { getHeatingSimulation, getIncomeOptions } from './simulation-service';

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
      heatingModeComparisons: [
        {
          co2: 1092.69,
          label: 'PAC air/eau',
          p1: 1410.46,
        },
        {
          co2: 4658.5,
          label: 'Chaudière gaz condensation',
          p1: 2193.48,
        },
        {
          co2: 6882.42,
          label: 'Chaudière fioul',
          p1: 2382.23,
        },
      ],
      heatPumpAnnualBill: 1649.26,
      heatPumpBoilerReplacementBonus: 5267.81,
      heatPumpGrossPrice: 21781.5,
      heatPumpMaprimerenovAid: 4000,
      heatPumpNetPrice: 11460.13,
      heatPumpProposedPower: 10.64,
      oilBoilerAnnualBill: 2553.83,
    });
  });

  const incomeCases: TestCase<HeatingSimulationInput['incomeCategory'], number>[] = [
    { expectedOutput: 10365.78, input: 'Très modeste', label: 'very low income gets the highest total aid' },
    { expectedOutput: 12460.13, input: 'Intermédiaire', label: 'middle income gets a lower total aid' },
    { expectedOutput: 15460.13, input: 'Supérieur', label: 'high income still gets CEE aid in the default heat pump case' },
  ];

  it.each(incomeCases)('$label', (testCase) => {
    expect(getHeatingSimulation({ ...baseInput, incomeCategory: testCase.input }).heatPumpNetPrice).toStrictEqual(testCase.expectedOutput);
  }, 15_000);
});

describe('getIncomeOptions', () => {
  it('returns income ranges for the requested department and household size', () => {
    const result = getIncomeOptions({
      departmentCode: '75',
      occupants: 3,
    });

    expect(result).toStrictEqual([
      {
        label: 'inférieur à 42 358 €',
        value: 'Très modeste',
      },
      {
        label: 'de 42 358 € à 51 564 €',
        value: 'Modeste',
      },
      {
        label: 'de 51 565 € à 71 846 €',
        value: 'Intermédiaire',
      },
      {
        label: 'supérieur à 71 846 €',
        value: 'Supérieur',
      },
    ]);
  });
});
