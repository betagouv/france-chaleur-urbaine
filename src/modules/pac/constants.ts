import { z } from 'zod';

import { DPE_VALUES } from '@/modules/chaleur-renouvelable/constants';

export const INCOME_CATEGORY_VALUES = ['Très modeste', 'Modeste', 'Intermédiaire', 'Supérieur'] as const;

export const zHeatingSimulationInput = z.object({
  departmentCode: z.string().min(2),
  dpe: z.enum(DPE_VALUES),
  incomeCategory: z.enum(INCOME_CATEGORY_VALUES),
  occupants: z.number().int().positive(),
  surface: z.number().positive(),
  temperatureReference: z.number().default(-7),
});

export type HeatingSimulationInput = z.infer<typeof zHeatingSimulationInput>;

export const zIncomeOptionsInput = z.object({
  departmentCode: z.string().min(2),
  occupants: z.number().int().positive(),
});

export type IncomeOptionsInput = z.infer<typeof zIncomeOptionsInput>;

export type IncomeOption = {
  label: string;
  value: (typeof INCOME_CATEGORY_VALUES)[number];
};

export type HeatingCostBreakdown = {
  label: string;
  p1: number;
  p2: number;
  p4: number;
};

export type HeatingSimulationResult = {
  oilBoilerAnnualBill: number;
  gasBoilerAnnualBill: number;
  heatPumpAnnualBill: number;
  heatingCostBreakdowns: HeatingCostBreakdown[];
  heatPumpBoilerReplacementBonus: number;
  heatPumpGrossPrice: number;
  heatPumpMaprimerenovAid: number;
  heatPumpNetPrice: number;
  heatPumpProposedPower: number;
};
