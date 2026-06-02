import type { ChoixChauffageParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import type { Situation } from '@/modules/chaleur-renouvelable/client/modesChauffageData';

type BuildSimulationSituationParams = {
  batEnr: Pick<
    Situation,
    | 'architecturalProtectionAc1'
    | 'architecturalProtectionAc2'
    | 'architecturalProtectionAc3'
    | 'architecturalProtectionAc4'
    | 'architecturalProtectionAc4bis'
    | 'geothermalNappeGmi'
    | 'geothermalNappePotential'
    | 'geothermalSondeGmi'
    | 'geothermiePossible'
    | 'hasGeothermalProbeSpace'
    | 'planProtectionAtmosphere'
    | 'solarThermalCoverage'
  >;
  eligibiliteReseauChaleur: Situation['eligibiliteReseauChaleur'];
  urlParams: ChoixChauffageParams;
};

export function buildSimulationSituation({ batEnr, eligibiliteReseauChaleur, urlParams }: BuildSimulationSituationParams): Situation {
  return {
    adresse: urlParams.adresse,
    architecturalProtectionAc1: batEnr.architecturalProtectionAc1,
    architecturalProtectionAc2: batEnr.architecturalProtectionAc2,
    architecturalProtectionAc3: batEnr.architecturalProtectionAc3,
    architecturalProtectionAc4: batEnr.architecturalProtectionAc4,
    architecturalProtectionAc4bis: batEnr.architecturalProtectionAc4bis,
    dpe: urlParams.dpe,
    eligibiliteReseauChaleur,
    espaceExterieur: urlParams.espaceExterieur ?? 'none',
    geothermalNappeGmi: batEnr.geothermalNappeGmi,
    geothermalNappePotential: batEnr.geothermalNappePotential,
    geothermalSondeGmi: batEnr.geothermalSondeGmi,
    geothermiePossible: batEnr.geothermiePossible,
    habitantsMoyen: Number.parseFloat(urlParams.habitantsMoyen || '2'),
    hasGeothermalProbeSpace: batEnr.hasGeothermalProbeSpace,
    modeEauChaudeSanitaire: urlParams.modeEauChaudeSanitaire,
    nbLogements: urlParams.nbLogements ?? 25,
    planProtectionAtmosphere: batEnr.planProtectionAtmosphere,
    solarThermalCoverage: batEnr.solarThermalCoverage,
    surfaceMoyenne: urlParams.surfaceMoyenne ?? 70,
    typeRadiateur: urlParams.typeRadiateur,
  };
}
