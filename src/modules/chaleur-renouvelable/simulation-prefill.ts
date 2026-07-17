import type { BatEnrBatiment, DPE, ModeEauChaudeSanitaire, TypeLogement } from '@/modules/chaleur-renouvelable/constants';

export type SimulationPrefillParams = {
  dpe?: DPE;
  modeEauChaudeSanitaire?: ModeEauChaudeSanitaire;
  nbLogements?: number;
  surfaceMoyenne?: number;
  typeLogement?: TypeLogement;
};

const getTypeLogementFromBatEnr = (
  categorieMajoritaire: string | null,
  typeInstallationChauffage: string | null
): TypeLogement | undefined => {
  const normalizedCategorieMajoritaire = categorieMajoritaire?.trim().toLowerCase();
  const normalizedTypeInstallationChauffage = typeInstallationChauffage?.trim().toLowerCase();

  if (normalizedCategorieMajoritaire === 'res col' && normalizedTypeInstallationChauffage === 'individuel') {
    return 'immeuble_chauffage_individuel';
  }

  if (normalizedCategorieMajoritaire === 'res col' && normalizedTypeInstallationChauffage === 'collectif') {
    return 'immeuble_chauffage_collectif';
  }

  return normalizedCategorieMajoritaire === 'res ind' && normalizedTypeInstallationChauffage === 'individuel'
    ? 'maison_individuelle'
    : undefined;
};

const getModeEauChaudeSanitaireFromBatEnr = (typeInstallationEcs: string | null): ModeEauChaudeSanitaire | undefined => {
  const normalizedTypeInstallationEcs = typeInstallationEcs?.trim().toLowerCase();

  return normalizedTypeInstallationEcs === 'individuel'
    ? 'Individuel'
    : normalizedTypeInstallationEcs === 'collectif'
      ? 'Collectif'
      : undefined;
};

export function getSimulationPrefillFromBatEnrBatiment(batEnrBatiment: BatEnrBatiment): SimulationPrefillParams {
  const nbLogements =
    batEnrBatiment.ffo_bat_nb_log != null && batEnrBatiment.ffo_bat_nb_log > 0 ? batEnrBatiment.ffo_bat_nb_log : undefined;
  const surfaceMoyenne =
    batEnrBatiment.dpe_representatif_logement_surface_habitable_immeuble != null && nbLogements
      ? Math.round(batEnrBatiment.dpe_representatif_logement_surface_habitable_immeuble / nbLogements)
      : undefined;

  return {
    dpe: batEnrBatiment.classe_bilan_dpe ?? undefined,
    modeEauChaudeSanitaire: getModeEauChaudeSanitaireFromBatEnr(batEnrBatiment.type_installation_ecs),
    nbLogements,
    surfaceMoyenne,
    typeLogement: getTypeLogementFromBatEnr(batEnrBatiment.categorie_majoritaire, batEnrBatiment.type_installation_chauffage),
  };
}
