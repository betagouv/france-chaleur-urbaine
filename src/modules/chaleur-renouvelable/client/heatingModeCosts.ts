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
  const coutParAnPublicodeRule = `Bilan x ${mode.coutParAnPublicodeKey} . total sans installation` as RuleName;
  const coutParAn = mode.coutParAnPublicodeKey
    ? getPublicodesFieldAsNumber(engine, coutParAnPublicodeRule, mode.coutParAnPublicodesSituation)
    : 0;
  const coutInstallation =
    typeof mode.coutInstallation === 'function' ? mode.coutInstallation(situation) : String(mode.coutInstallation ?? '0');

  return { ...mode, coutInstallation, coutParAn };
}

function getGasCostWithoutInstallation(engine: SimulatorEngine, situationOverride: Partial<Record<RuleName, string | number>>) {
  const costRules = [
    'Bilan x Gaz coll sans cond . P1abo',
    'Bilan x Gaz coll sans cond . P1conso',
    'Bilan x Gaz coll sans cond . P1prime',
    'Bilan x Gaz coll sans cond . P1ECS',
    'Bilan x Gaz coll sans cond . P2',
    'Bilan x Gaz coll sans cond . P3',
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
    'code département': `'${codeDepartement}'`,
    DPE: `'${situation.dpe}'`,
    'Inclure la climatisation': 'non',
    "Nombre d'habitants moyen par appartement": `${situation.habitantsMoyen}`,
    "nombre de logements dans l'immeuble concerné": situation.nbLogements,
    'Production eau chaude sanitaire': 'oui',
    'surface logement type tertiaire': `${situation.surfaceMoyenne}`,
    'température de référence chaud commune': temperatureRef,
  });

  engine.resetField('type de production ECS');
}

export function getHeatingModeCosts(engine: SimulatorEngine, modes: ModeDeChauffage[], situation: Situation) {
  const modesEnriched = modes.map((modeDeChauffage) => enrichHeatingMode(modeDeChauffage, engine, situation));
  const coutParAnGaz = engine.getFieldAsNumber(`Bilan x Gaz coll sans cond . total avec aides` as RuleName);
  const coutParAnGazHotWaterOnly = Math.max(
    0,
    getGasCostWithoutInstallation(engine, {
      'Production eau chaude sanitaire': 'oui',
      'type de production ECS': "'Avec équipement chauffage'",
    }) -
      getGasCostWithoutInstallation(engine, {
        'Production eau chaude sanitaire': 'non',
        'type de production ECS': "'Avec équipement chauffage'",
      })
  );

  return {
    coutParAnGaz,
    coutParAnGazHotWaterOnly,
    modesEnriched,
  };
}
