import type { BatEnrInfo } from '@/modules/chaleur-renouvelable/bat-enr';
import type { ChoixChauffageParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import type { Situation } from '@/modules/chaleur-renouvelable/constants';
import { DEFAULT_SIMULATION_PARAMS } from '@/modules/chaleur-renouvelable/constants';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

type BuildSimulationSituationParams = {
  altitude: number | null;
  batEnr: BatEnrInfo;
  eligibiliteReseauChaleur: HeatNetwork | null;
  eligibiliteReseauFroid: Situation['eligibiliteReseauFroid'];
  params: ChoixChauffageParams;
};

export const buildSimulationSituation = ({
  altitude,
  batEnr,
  eligibiliteReseauChaleur,
  eligibiliteReseauFroid,
  params,
}: BuildSimulationSituationParams): Situation => ({
  adresse: params.adresse,
  altitude,
  architecturalProtectionAc1: batEnr.architecturalProtectionAc1,
  architecturalProtectionAc2: batEnr.architecturalProtectionAc2,
  architecturalProtectionAc3: batEnr.architecturalProtectionAc3,
  architecturalProtectionAc4: batEnr.architecturalProtectionAc4,
  architecturalProtectionAc4bis: batEnr.architecturalProtectionAc4bis,
  dpe: params.dpe,
  eligibiliteReseauChaleur,
  eligibiliteReseauFroid,
  espaceExterieur: params.espaceExterieur ?? DEFAULT_SIMULATION_PARAMS.espaceExterieur,
  geothermalNappeGmi: batEnr.geothermalNappeGmi,
  geothermalNappePotential: batEnr.geothermalNappePotential,
  geothermalSondeGmi: batEnr.geothermalSondeGmi,
  geothermiePossible: batEnr.geothermiePossible,
  habitantsMoyen: Number.parseFloat(params.habitantsMoyen || String(DEFAULT_SIMULATION_PARAMS.habitantsMoyen)),
  hasGeothermalProbeSpace: batEnr.hasGeothermalProbeSpace,
  modeEauChaudeSanitaire: params.modeEauChaudeSanitaire,
  nbLogements: params.nbLogements ?? DEFAULT_SIMULATION_PARAMS.nbLogements,
  planProtectionAtmosphere: batEnr.planProtectionAtmosphere,
  solarThermalCoverage: batEnr.solarThermalCoverage,
  surfaceMoyenne: params.surfaceMoyenne ?? DEFAULT_SIMULATION_PARAMS.surfaceMoyenne,
  typeRadiateur: params.typeRadiateur,
});
