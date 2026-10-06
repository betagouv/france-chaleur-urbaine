import type { BatEnrBatiment, DPE, ModeEauChaudeSanitaire } from '@/modules/chaleur-renouvelable/constants';

export type SimulationPrefillParams = {
  dpe?: DPE;
  modeEauChaudeSanitaire?: ModeEauChaudeSanitaire;
  nbLogements?: number;
  surfaceMoyenne?: number;
};

const MINIMUM_AVERAGE_HOUSING_AREA = 9;

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

  return surfaceMoyenne >= MINIMUM_AVERAGE_HOUSING_AREA ? surfaceMoyenne : undefined;
};

export function getSimulationPrefillFromBatEnrBatiment(batEnrBatiment: BatEnrBatiment): SimulationPrefillParams {
  const nbLogements =
    batEnrBatiment.ffo_bat_nb_log != null && batEnrBatiment.ffo_bat_nb_log > 0 ? batEnrBatiment.ffo_bat_nb_log : undefined;
  const surfaceMoyenne = getAverageHousingAreaFromBatEnr(batEnrBatiment.dpe_representatif_logement_surface_habitable_immeuble, nbLogements);

  return {
    dpe: batEnrBatiment.classe_bilan_dpe ?? undefined,
    modeEauChaudeSanitaire: getModeEauChaudeSanitaireFromBatEnr(batEnrBatiment.type_installation_ecs),
    nbLogements,
    surfaceMoyenne,
  };
}
