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
      gasBoilerAnnualBill: 2001.49,
      heatingModeComparisons: [
        {
          co2: 1060.28,
          label: 'PAC air/eau',
          p1: 1331.43,
        },
        {
          co2: 4203.71,
          label: 'Chaudière gaz',
          p1: 2001.49,
        },
        {
          co2: 6372.62,
          label: 'Chaudière fioul',
          p1: 2199.71,
        },
      ],
      heatPumpAnnualBill: 1331.43,
      heatPumpCoupDePouce: 5267.81,
      heatPumpGrossPrice: 13999.85,
      heatPumpMaprimerenovAid: 4000,
      heatPumpNetPrice: 4732.04,
      heatPumpProposedPower: 10.55,
      oilBoilerAnnualBill: 2199.71,
    });
  });

  const incomeCases: TestCase<HeatingSimulationInput['incomeCategory'], number>[] = [
    { expectedOutput: 3653.42, input: 'Très modeste', label: 'very low income gets the highest total aid' },
    { expectedOutput: 5732.04, input: 'Intermédiaire', label: 'middle income gets a lower total aid' },
    { expectedOutput: 8732.04, input: 'Supérieur', label: 'high income still gets CEE aid in the default heat pump case' },
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
        max: 42_357,
        min: null,
        value: 'Très modeste',
      },
      {
        max: 51_564,
        min: 42_358,
        value: 'Modeste',
      },
      {
        max: 71_846,
        min: 51_565,
        value: 'Intermédiaire',
      },
      {
        max: null,
        min: 71_847,
        value: 'Supérieur',
      },
    ]);
  });
});
