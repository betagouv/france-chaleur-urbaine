import { z } from 'zod';

import { DPE_VALUES } from '@/modules/chaleur-renouvelable/constants';

export const IFPEN_INCOME_CATEGORY_VALUES = ['Très modeste', 'Modeste', 'Intermédiaire', 'Supérieur'] as const;

export const zIfpenHeatingSimulationInput = z.object({
  cityCode: z.string().min(2),
  departmentCode: z.string().min(2),
  dpe: z.enum(DPE_VALUES),
  incomeCategory: z.enum(IFPEN_INCOME_CATEGORY_VALUES),
  occupants: z.number().int().positive(),
  surface: z.number().positive(),
  temperatureReference: z.number().default(-7),
});

export type IfpenHeatingSimulationInput = z.infer<typeof zIfpenHeatingSimulationInput>;

export const zIfpenIncomeOptionsInput = z.object({
  departmentCode: z.string().min(2),
  occupants: z.number().int().positive(),
});

export type IfpenIncomeOptionsInput = z.infer<typeof zIfpenIncomeOptionsInput>;

export type IfpenIncomeOption = {
  help: string;
  label: string;
  value: (typeof IFPEN_INCOME_CATEGORY_VALUES)[number];
};

export type IfpenHeatingCostBreakdown = {
  label: string;
  p1: number;
  p2: number;
  p4: number;
};

export type IfpenHeatingSimulationResult = {
  oilBoilerAnnualBill: number;
  gasBoilerAnnualBill: number;
  heatPumpAnnualBill: number;
  heatingCostBreakdowns: IfpenHeatingCostBreakdown[];
  heatPumpGrossPrice: number;
  heatPumpNetPrice: number;
  heatPumpProposedPower: number;
};
