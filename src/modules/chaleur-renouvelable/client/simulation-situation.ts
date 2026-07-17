import type { BatEnrInfo } from '@/modules/chaleur-renouvelable/bat-enr';
import type { ChoixChauffageParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import type { Situation } from '@/modules/chaleur-renouvelable/constants';
import { DEFAULT_SIMULATION_PARAMS } from '@/modules/chaleur-renouvelable/constants';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

type BuildSimulationSituationParams = {
  batEnr: BatEnrInfo;
  eligibiliteReseauChaleur: HeatNetwork | null;
  params: ChoixChauffageParams;
};

export const buildSimulationSituation = ({ batEnr, eligibiliteReseauChaleur, params }: BuildSimulationSituationParams): Situation => ({
  adresse: params.adresse,
  architecturalProtectionAc1: batEnr.architecturalProtectionAc1,
  architecturalProtectionAc2: batEnr.architecturalProtectionAc2,
  architecturalProtectionAc3: batEnr.architecturalProtectionAc3,
  architecturalProtectionAc4: batEnr.architecturalProtectionAc4,
  architecturalProtectionAc4bis: batEnr.architecturalProtectionAc4bis,
  dpe: params.dpe,
  eligibiliteReseauChaleur,
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
