import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';

import type { SimulatorEngine } from '@/components/ComparateurPublicodes/useSimulatorEngine';
import type { ModeDeChauffageEnriched, ModeDeChauffageResolved, Situation } from '@/modules/chaleur-renouvelable/client/modesChauffageData';

function getPublicodesFieldAsNumber(
  engine: SimulatorEngine,
  rule: RuleName,
  situationOverride: Partial<Record<RuleName, string | number>> = {}
) {
  return Number(
    engine.internalEngine.evaluate({
      contexte: {
        ...engine.getSituation(),
        ...situationOverride,
      },
      valeur: rule,
    }).nodeValue ?? 0
  );
}

function formatEuroAmount(amount: number) {
  return Math.round(amount).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function formatEuroRange(minimum: number, maximum: number) {
  return `${formatEuroAmount(minimum)} € à ${formatEuroAmount(maximum)} €`;
}

function getInstallationCost(mode: ModeDeChauffageResolved, engine: SimulatorEngine) {
  const situationOverride = mode.publicodeSituation;
  const minimumRule = `${mode.publicodeKey} . coûts . installation . minimum` satisfies RuleName;
  const maximumRule = `${mode.publicodeKey} . coûts . installation . maximum` satisfies RuleName;
  const minimum = getPublicodesFieldAsNumber(engine, minimumRule, situationOverride);
  const maximum = getPublicodesFieldAsNumber(engine, maximumRule, situationOverride);

  return formatEuroRange(minimum, maximum);
}

function enrichHeatingMode(mode: ModeDeChauffageResolved, engine: SimulatorEngine): ModeDeChauffageEnriched {
  const coutParAnPublicodeRule = `${mode.publicodeKey} . bilan . total sans installation` satisfies RuleName;
  const coutParAn = getPublicodesFieldAsNumber(engine, coutParAnPublicodeRule, mode.publicodeSituation);
  const coutInstallation = getInstallationCost(mode, engine);

  return { ...mode, coutInstallation, coutParAn };
}

function getGasCostWithoutInstallation(engine: SimulatorEngine, situationOverride: Partial<Record<RuleName, string | number>>) {
  const costRules = [
    'gaz coll sans cond . bilan . P1abo',
    'gaz coll sans cond . bilan . P1conso',
    'gaz coll sans cond . bilan . P1prime',
    'gaz coll sans cond . bilan . P1ECS',
    'gaz coll sans cond . bilan . P2',
    'gaz coll sans cond . bilan . P3',
  ] satisfies RuleName[];

  return costRules.reduce((totalCost, costRule) => totalCost + getPublicodesFieldAsNumber(engine, costRule, situationOverride), 0);
}

export function setPublicodesSituation(
  engine: SimulatorEngine,
  {
    codeDepartement,
    situation,
    temperatureRef,
  }: {
    codeDepartement: string;
    situation: Situation;
    temperatureRef: number | null;
  }
) {
  engine.setSituation({
    'bâtiment . DPE': `'${situation.dpe}'`,
    'bâtiment . habitants par logement': `${situation.habitantsMoyen}`,
    'bâtiment . nombre de logements': situation.nbLogements,
    'bâtiment . surface tertiaire': `${situation.surfaceMoyenne}`,
    'climat . code département': `'${codeDepartement}'`,
    'climat . température de référence chaud commune': temperatureRef,
    'climatisation . incluse': 'non',
    'ecs . production': 'oui',
  });

  engine.resetField('ecs . type de production');
}

export function getHeatingModeCosts(engine: SimulatorEngine, modes: ModeDeChauffageResolved[]) {
  const modesEnriched = modes.map((modeDeChauffage) => enrichHeatingMode(modeDeChauffage, engine));
  const coutParAnGaz = engine.getFieldAsNumber('gaz coll sans cond . bilan . total avec aides');
  const coutParAnGazHotWaterOnly = Math.max(
    0,
    getGasCostWithoutInstallation(engine, {
      'ecs . production': 'oui',
      'ecs . type de production': "'Avec équipement chauffage'",
    }) -
      getGasCostWithoutInstallation(engine, {
        'ecs . production': 'non',
        'ecs . type de production': "'Avec équipement chauffage'",
      })
  );

  return {
    coutParAnGaz,
    coutParAnGazHotWaterOnly,
    modesEnriched,
  };
}
