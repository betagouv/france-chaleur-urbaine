import { createRequire } from 'node:module';

import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Engine from 'publicodes';

import type { HeatingSimulationInput, HeatingSimulationResult, IncomeOption, IncomeOptionsInput } from '../constants';

const require = createRequire(import.meta.url);
const publicodesRules = require('@betagouv/france-chaleur-urbaine-publicodes/publicodes-build/france-chaleur-urbaine-publicodes.model.json');

const HEATING_P1_PARTS = ['P1abo', 'P1conso'] as const;

type HeatingBillPrefix = 'Bilan x PAC air-eau indiv' | 'Bilan x Gaz indiv avec cond' | 'Bilan x Fioul indiv';

const HEATING_MODES = [
  {
    billPrefix: 'Bilan x PAC air-eau indiv',
    co2RuleName: 'env . Installation x PAC air-eau x Individuel . Total',
    label: 'PAC air/eau',
  },
  {
    billPrefix: 'Bilan x Gaz indiv avec cond',
    co2RuleName: 'env . Installation x Gaz indiv avec cond x Individuel . Total',
    label: 'Chaudière gaz',
  },
  {
    billPrefix: 'Bilan x Fioul indiv',
    co2RuleName: 'env . Installation x Fioul indiv x Individuel . Total',
    label: 'Chaudière fioul',
  },
] as const satisfies {
  billPrefix: HeatingBillPrefix;
  co2RuleName: RuleName;
  label: string;
}[];

const INCOME_PUBLICODES_THRESHOLDS = {
  Intermédiaire: 'ménage . revenu . plafond intermédiaire',
  Modeste: 'ménage . revenu . plafond modeste',
  'Très modeste': 'ménage . revenu . plafond très modeste',
} as const satisfies Record<Exclude<HeatingSimulationInput['incomeCategory'], 'Supérieur'>, string>;

export function getHeatingSimulation(input: HeatingSimulationInput): HeatingSimulationResult {
  const engine = createEngineForSimulation(input);
  const heatPumpGrossPrice = getRuleValue(engine, 'Calcul Eco . PAC air-eau indiv . Investissement équipement Total');
  const heatPumpMaprimerenovAid = getRuleValue(
    engine,
    "Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Ma prime renov'"
  );
  const heatPumpBoilerReplacementBonus = getRuleValue(engine, 'ratios économiques x aides . Coup de pouce x PAC air-eau');
  const heatPumpAidAmount = getRuleValue(engine, 'Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Total');

  return {
    gasBoilerAnnualBill: roundNumber(getAnnualBill(engine, 'Bilan x Gaz indiv avec cond')),
    heatingModeComparisons: HEATING_MODES.map((heatingMode) => getHeatingModeComparison(engine, heatingMode)),
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

function createEngineForSimulation(input: HeatingSimulationInput) {
  const engine = createPublicodesEngine();

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
    'ratios économiques x aides . CEE x PAC air-eau indiv x BAR-TH-171 . efficacité énergétique saisonnière': '150%',
    'surface logement type tertiaire': input.surface,
    'température de référence chaud commune': input.temperatureReference,
    'type de bâtiment': "'résidentiel'",
    'type de production ECS': "'Avec équipement chauffage'",
  });

  return engine;
}

function createEngineForIncome(input: IncomeOptionsInput) {
  const engine = createPublicodesEngine();

  engine.setSituation({
    'code département': `'${input.departmentCode}'`,
    "Nombre d'habitants moyen par appartement": input.occupants,
  });

  return engine;
}

function createPublicodesEngine() {
  return new Engine<RuleName>(publicodesRules, {
    logger: {
      error: () => undefined,
      log: () => undefined,
      warn: () => undefined,
    },
  });
}

function getAnnualBill(engine: Engine<RuleName>, prefix: HeatingBillPrefix) {
  return HEATING_P1_PARTS.reduce((total, billPart) => total + getRuleValue(engine, `${prefix} . ${billPart}` as RuleName), 0);
}

function getHeatingModeComparison(engine: Engine<RuleName>, heatingMode: (typeof HEATING_MODES)[number]) {
  return {
    co2: roundNumber(getRuleValue(engine, heatingMode.co2RuleName)),
    label: heatingMode.label,
    p1: roundNumber(
      HEATING_P1_PARTS.reduce((total, billPart) => total + getRuleValue(engine, `${heatingMode.billPrefix} . ${billPart}` as RuleName), 0)
    ),
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
