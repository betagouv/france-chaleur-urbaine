import { type BatEnrBatiment, type DPE, type ModeEauChaudeSanitaire, zAverageHousingArea } from './constants';

export type SimulationPrefillParams = {
  dpe?: DPE;
  modeEauChaudeSanitaire?: ModeEauChaudeSanitaire;
  nbLogements?: number;
  surfaceMoyenne?: number;
};

const getModeEauChaudeSanitaireFromBatEnr = (typeInstallationEcs: string | null): ModeEauChaudeSanitaire | undefined => {
  const normalizedTypeInstallationEcs = typeInstallationEcs?.trim().toLowerCase();

  return normalizedTypeInstallationEcs === 'individuel'
    ? 'Individuel'
    : normalizedTypeInstallationEcs === 'collectif'
      ? 'Collectif'
      : undefined;
};

const getAverageHousingAreaFromBatEnr = (surfaceHabitable: number | null, nbLogements?: number) => {
  if (surfaceHabitable == null || !nbLogements) {
    return undefined;
  }

  const surfaceMoyenne = Math.round(surfaceHabitable / nbLogements);

  return zAverageHousingArea.safeParse(surfaceMoyenne).success ? surfaceMoyenne : undefined;
};

export function getSimulationPrefillFromBatEnrBatiment(
  batEnrBatiment: BatEnrBatiment,
  rnicHousingCount?: number | null
): SimulationPrefillParams {
  const bdnbHousingCount =
    batEnrBatiment.ffo_bat_nb_log != null && batEnrBatiment.ffo_bat_nb_log > 0 ? batEnrBatiment.ffo_bat_nb_log : undefined;
  // RNIC describes the co-ownership; BDNB's building surface must keep its own housing-count denominator.
  const surfaceMoyenne = getAverageHousingAreaFromBatEnr(
    batEnrBatiment.dpe_representatif_logement_surface_habitable_immeuble,
    bdnbHousingCount
  );
  const nbLogements =
    rnicHousingCount != null && Number.isSafeInteger(rnicHousingCount) && rnicHousingCount > 0 ? rnicHousingCount : bdnbHousingCount;

  return {
    dpe: batEnrBatiment.classe_bilan_dpe ?? undefined,
    modeEauChaudeSanitaire: getModeEauChaudeSanitaireFromBatEnr(batEnrBatiment.type_installation_ecs),
    nbLogements,
    surfaceMoyenne,
  };
}
