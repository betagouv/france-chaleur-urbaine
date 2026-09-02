import { z } from 'zod';

import type { FranceRenovSpace } from '@/modules/chaleur-renouvelable/constants';
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

export const SIMULATEUR_PAC_EVENT_NAMES = [
  'simulateur_pac:form_started',
  'simulateur_pac:results_requested',
  'simulateur_pac:france_renov_coordinates_requested',
  'simulateur_pac:france_renov_external_link_clicked',
  'simulateur_pac:fcu_outbound_link_clicked',
] as const;

export const zSimulateurPacEventProperties = z.strictObject({
  current_step: z.number().int().min(0).max(9).optional(),
  department_code: z.string().trim().min(2).max(3).optional(),
  dpe: z.enum([...DPE_VALUES, 'unknown']).optional(),
  heating_equipment: z.enum(['electric-radiator', 'gas-boiler', 'oil-boiler', 'other']).optional(),
  housing_type: z.enum(['apartment', 'house']).optional(),
  link_name: z.string().trim().min(1).max(100).optional(),
  owner_status: z.enum(['owner', 'tenant']).optional(),
  referrer_host: z.string().trim().min(1).max(255).optional(),
  route_outcome: z.enum(['apartment', 'continue', 'electric-radiator', 'tenant']).optional(),
  source_host: z.string().trim().min(1).max(255).optional(),
  source_path: z.string().trim().min(1).max(500).optional(),
});

export type SimulateurPacEventProperties = z.infer<typeof zSimulateurPacEventProperties>;

export const zSimulateurPacEventInput = z.strictObject({
  distinctId: z.string().trim().min(1).max(120),
  event: z.enum(SIMULATEUR_PAC_EVENT_NAMES),
  properties: zSimulateurPacEventProperties.default({}),
});

export type SimulateurPacEventInput = z.infer<typeof zSimulateurPacEventInput>;

export const zFranceRenovSpaceInput = z.object({
  cityCode: z.string().trim().min(5).max(5),
});

export type FranceRenovSpaceInput = z.infer<typeof zFranceRenovSpaceInput>;

export type { FranceRenovSpace };

export type IncomeOption = {
  max: number | null;
  min: number | null;
  value: (typeof INCOME_CATEGORY_VALUES)[number];
};

export type HeatingModeComparison = {
  co2: number;
  label: string;
  p1: number;
};

export type HeatingSimulationResult = {
  oilBoilerAnnualBill: number;
  gasBoilerAnnualBill: number;
  heatPumpAnnualBill: number;
  heatingModeComparisons: HeatingModeComparison[];
  heatPumpCoupDePouce: number;
  heatPumpGrossPrice: number;
  heatPumpMaprimerenovAid: number;
  heatPumpNetPrice: number;
  heatPumpProposedPower: number;
};
