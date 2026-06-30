import { createRequire } from 'node:module';

import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Engine from 'publicodes';

import type { HeatingSimulationInput, HeatingSimulationResult, IncomeOption, IncomeOptionsInput } from '../constants';

const require = createRequire(import.meta.url);
const publicodesRules = require('@betagouv/france-chaleur-urbaine-publicodes/publicodes-build/france-chaleur-urbaine-publicodes.model.json');

const HEATING_BILL_PARTS = ['P1abo', 'P1conso', 'P1prime', 'P1ECS', 'P2'] as const;
const HEATING_P1_PARTS = ['P1abo', 'P1conso', 'P1prime', 'P1ECS', 'P1Consofroid'] as const;

const INCOME_PUBLICODES_THRESHOLDS = {
  Intermédiaire: 'ménage . revenu . plafond intermédiaire',
  Modeste: 'ménage . revenu . plafond modeste',
  'Très modeste': 'ménage . revenu . plafond très modeste',
} as const satisfies Record<Exclude<HeatingSimulationInput['incomeCategory'], 'Supérieur'>, string>;

export function getHeatingSimulation(input: HeatingSimulationInput): HeatingSimulationResult {
  const engine = new Engine<RuleName>(publicodesRules);

  engine.setSituation({
    'code département': `'${input.departmentCode}'`,
    DPE: `'${input.dpe}'`,
    'Inclure la climatisation': 'non',
    'méthode résidentiel': "'DPE'",
    "Nombre d'habitants moyen par appartement": input.occupants,
    "nombre de logements dans l'immeuble concerné": 1,
    "Paramètres économiques . Aides . Éligibilité x Je dispose actuellement d'une chaudière gaz ou fioul": 'oui',
    'Paramètres économiques . Aides . Éligibilité x Je suis un particulier': 'oui',
    'Paramètres économiques . Aides . Éligibilité x Prise en compte des aides': 'oui',
    'Paramètres économiques . Aides . Éligibilité x Ressources du ménage': `'${input.incomeCategory}'`,
    'Production eau chaude sanitaire': 'oui',
    'ratios . GNRL Appartement ou maison': "'Maison'",
    'surface logement type tertiaire': input.surface,
    'température de référence chaud commune': input.temperatureReference,
    'type de bâtiment': "'résidentiel'",
    'type de production ECS': "'Avec équipement chauffage'",
  });

  const heatPumpGrossPrice = getRuleValue(engine, 'Calcul Eco . PAC air-eau indiv . Investissement équipement Total');
  const heatPumpMaprimerenovAid = getRuleValue(
    engine,
    "Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Ma prime renov'"
  );
  const heatPumpBoilerReplacementBonus = getRuleValue(
    engine,
    'Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Coup de pouce'
  );
  const heatPumpAidAmount = getRuleValue(engine, 'Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Total');

  return {
    gasBoilerAnnualBill: roundNumber(getAnnualBill(engine, 'Bilan x Gaz indiv avec cond')),
    heatingCostBreakdowns: [
      getHeatingCostBreakdown(engine, 'PAC air/eau', 'Bilan x PAC air-eau indiv'),
      getHeatingCostBreakdown(engine, 'Chaudière gaz condensation', 'Bilan x Gaz indiv avec cond'),
      getHeatingCostBreakdown(engine, 'Chaudière fioul', 'Bilan x Fioul indiv'),
    ],
    heatPumpAnnualBill: roundNumber(getAnnualBill(engine, 'Bilan x PAC air-eau indiv')),
    heatPumpBoilerReplacementBonus: roundNumber(heatPumpBoilerReplacementBonus),
    heatPumpGrossPrice: roundNumber(heatPumpGrossPrice),
    heatPumpMaprimerenovAid: roundNumber(heatPumpMaprimerenovAid),
    heatPumpNetPrice: roundNumber(Math.max(0, heatPumpGrossPrice - heatPumpAidAmount)),
    heatPumpProposedPower: roundNumber(getRuleValue(engine, 'Installation x PAC air-eau x Individuel . puissance équipement')),
    oilBoilerAnnualBill: roundNumber(getAnnualBill(engine, 'Bilan x Fioul indiv')),
  };
}

export function getIncomeOptions(input: IncomeOptionsInput): IncomeOption[] {
  const engine = createEngineForIncome(input);
  const veryLowThreshold = getRuleValue(engine, INCOME_PUBLICODES_THRESHOLDS['Très modeste'] as RuleName);
  const lowThreshold = getRuleValue(engine, INCOME_PUBLICODES_THRESHOLDS.Modeste as RuleName);
  const middleThreshold = getRuleValue(engine, INCOME_PUBLICODES_THRESHOLDS.Intermédiaire as RuleName);

  return [
    {
      label: `inférieur à ${formatCurrency(veryLowThreshold + 1)}`,
      value: 'Très modeste',
    },
    {
      label: `de ${formatCurrency(veryLowThreshold + 1)} à ${formatCurrency(lowThreshold)}`,
      value: 'Modeste',
    },
    {
      label: `de ${formatCurrency(lowThreshold + 1)} à ${formatCurrency(middleThreshold)}`,
      value: 'Intermédiaire',
    },
    {
      label: `supérieur à ${formatCurrency(middleThreshold)}`,
      value: 'Supérieur',
    },
  ];
}

function createEngineForIncome(input: IncomeOptionsInput) {
  const engine = new Engine<RuleName>(publicodesRules);

  engine.setSituation({
    'code département': `'${input.departmentCode}'`,
    "Nombre d'habitants moyen par appartement": input.occupants,
  });

  return engine;
}

function getAnnualBill(
  engine: Engine<RuleName>,
  prefix: 'Bilan x PAC air-eau indiv' | 'Bilan x Gaz indiv avec cond' | 'Bilan x Fioul indiv'
) {
  return HEATING_BILL_PARTS.reduce((total, billPart) => total + getRuleValue(engine, `${prefix} . ${billPart}` as RuleName), 0);
}

function getHeatingCostBreakdown(
  engine: Engine<RuleName>,
  label: string,
  prefix: 'Bilan x PAC air-eau indiv' | 'Bilan x Gaz indiv avec cond' | 'Bilan x Fioul indiv'
) {
  return {
    label,
    p1: roundNumber(HEATING_P1_PARTS.reduce((total, billPart) => total + getRuleValue(engine, `${prefix} . ${billPart}` as RuleName), 0)),
    p2: roundNumber(getRuleValue(engine, `${prefix} . P2` as RuleName)),
    p4: roundNumber(getRuleValue(engine, `${prefix} . P4` as RuleName)),
  };
}

function getRuleValue(engine: Engine<RuleName>, ruleName: RuleName) {
  return Number(engine.evaluate(ruleName).nodeValue ?? 0);
}

function roundNumber(value: number) {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}
