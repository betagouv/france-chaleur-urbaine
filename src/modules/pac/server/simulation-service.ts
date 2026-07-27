import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import publicodesRules from '@betagouv/france-chaleur-urbaine-publicodes/publicodes-build/france-chaleur-urbaine-publicodes.model.json';
import Engine from 'publicodes';

import type { HeatingSimulationInput, HeatingSimulationResult, IncomeOption, IncomeOptionsInput } from '../constants';

const HEATING_P1_PARTS = ['P1abo', 'P1conso'] as const;

type HeatingBillPrefix = 'PAC air-eau indiv . bilan' | 'gaz indiv avec cond . bilan' | 'fioul indiv . bilan';

const HEATING_MODES = [
  {
    billPrefix: 'PAC air-eau indiv . bilan',
    co2RuleName: 'PAC air-eau indiv . environnement . total',
    label: 'PAC air/eau',
  },
  {
    billPrefix: 'gaz indiv avec cond . bilan',
    co2RuleName: 'gaz indiv avec cond . environnement . total',
    label: 'Chaudière gaz',
  },
  {
    billPrefix: 'fioul indiv . bilan',
    co2RuleName: 'fioul indiv . environnement . total',
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
  const heatPumpGrossPrice = getRuleValue(engine, 'PAC air-eau indiv . coûts . investissement équipement');
  const heatPumpMaprimerenovAid = getOptionalRuleValue(engine, 'PAC air-eau indiv . aides . ma prime rénov');
  const heatPumpCoupDePouce = getOptionalRuleValue(engine, 'aides . coup de pouce PAC air-eau');

  return {
    gasBoilerAnnualBill: getAnnualBill(engine, 'gaz indiv avec cond . bilan'),
    heatingModeComparisons: HEATING_MODES.map((heatingMode) => getHeatingModeComparison(engine, heatingMode)),
    heatPumpAnnualBill: getAnnualBill(engine, 'PAC air-eau indiv . bilan'),
    heatPumpCoupDePouce,
    heatPumpGrossPrice,
    heatPumpMaprimerenovAid,
    heatPumpNetPrice: Math.max(0, heatPumpGrossPrice - heatPumpMaprimerenovAid - heatPumpCoupDePouce),
    heatPumpProposedPower: getRuleValue(engine, 'PAC air-eau indiv . installation . puissance équipement'),
    oilBoilerAnnualBill: getAnnualBill(engine, 'fioul indiv . bilan'),
  };
}

export function getIncomeOptions(input: IncomeOptionsInput): IncomeOption[] {
  const engine = createEngineForIncome(input);
  const veryLowThreshold = getRuleValue(engine, INCOME_PUBLICODES_THRESHOLDS['Très modeste'] as RuleName);
  const lowThreshold = getRuleValue(engine, INCOME_PUBLICODES_THRESHOLDS.Modeste as RuleName);
  const middleThreshold = getRuleValue(engine, INCOME_PUBLICODES_THRESHOLDS.Intermédiaire as RuleName);

  return [
    {
      max: veryLowThreshold,
      min: null,
      value: 'Très modeste',
    },
    {
      max: lowThreshold,
      min: veryLowThreshold + 1,
      value: 'Modeste',
    },
    {
      max: middleThreshold,
      min: lowThreshold + 1,
      value: 'Intermédiaire',
    },
    {
      max: null,
      min: middleThreshold + 1,
      value: 'Supérieur',
    },
  ];
}

function createEngineForSimulation(input: HeatingSimulationInput) {
  const engine = createPublicodesEngine();

  engine.setSituation({
    'aides . CEE . BAR-TH-171 PAC air-eau . efficacité énergétique saisonnière': '150%',
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

// Si surcharge serveur, faire un singleton
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
    co2: getRuleValue(engine, heatingMode.co2RuleName),
    label: heatingMode.label,
    p1: getAnnualBill(engine, heatingMode.billPrefix),
  };
}

function getRuleValue(engine: Engine<RuleName>, ruleName: RuleName) {
  const ruleValue = engine.evaluate(ruleName).nodeValue;

  if (typeof ruleValue !== 'number') {
    throw new Error(`Publicodes rule "${ruleName}" did not resolve to a number`);
  }

  return ruleValue;
}

function getOptionalRuleValue(engine: Engine<RuleName>, ruleName: RuleName) {
  const ruleValue = engine.evaluate(ruleName).nodeValue;

  if (ruleValue === null || ruleValue === undefined) {
    return 0;
  }

  if (typeof ruleValue !== 'number') {
    throw new Error(`Publicodes rule "${ruleName}" did not resolve to a number`);
  }

  return ruleValue;
}
