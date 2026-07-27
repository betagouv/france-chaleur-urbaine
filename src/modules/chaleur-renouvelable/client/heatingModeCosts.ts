import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';

import type { SimulatorEngine } from '@/components/ComparateurPublicodes/useSimulatorEngine';
import type { ModeDeChauffage, ModeDeChauffageEnriched, Situation } from '@/modules/chaleur-renouvelable/client/modesChauffageData';

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

function enrichHeatingMode(mode: ModeDeChauffage, engine: SimulatorEngine, situation: Situation): ModeDeChauffageEnriched {
  const coutParAnPublicodeRule = `${mode.coutParAnPublicodeKey} . bilan . total sans installation` satisfies RuleName;
  const coutParAn = mode.coutParAnPublicodeKey
    ? getPublicodesFieldAsNumber(engine, coutParAnPublicodeRule, mode.coutParAnPublicodesSituation)
    : 0;
  const coutInstallation =
    typeof mode.coutInstallation === 'function' ? mode.coutInstallation(situation) : String(mode.coutInstallation ?? '0');

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

export function getHeatingModeCosts(engine: SimulatorEngine, modes: ModeDeChauffage[], situation: Situation) {
  const modesEnriched = modes.map((modeDeChauffage) => enrichHeatingMode(modeDeChauffage, engine, situation));
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
