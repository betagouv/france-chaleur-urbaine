import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/constants';

export type BatEnrInfo = {
  architecturalProtectionAc1: boolean;
  architecturalProtectionAc2: boolean;
  architecturalProtectionAc3: boolean;
  architecturalProtectionAc4: boolean;
  architecturalProtectionAc4bis: boolean;
  geothermiePossible: boolean;
  geothermalNappePotential: number | null;
  geothermalNappeGmi: number | null;
  geothermalSondeGmi: number | null;
  hasGeothermalProbeSpace: boolean | null;
  planProtectionAtmosphere: boolean;
  solarThermalCoverage: number | null;
};

export const EMPTY_BAT_ENR_INFO = {
  architecturalProtectionAc1: false,
  architecturalProtectionAc2: false,
  architecturalProtectionAc3: false,
  architecturalProtectionAc4: false,
  architecturalProtectionAc4bis: false,
  geothermalNappeGmi: null,
  geothermalNappePotential: null,
  geothermalSondeGmi: null,
  geothermiePossible: false,
  hasGeothermalProbeSpace: null,
  planProtectionAtmosphere: false,
  solarThermalCoverage: null,
} satisfies BatEnrInfo;

export const getBatEnrInfoFromBatiment = (batEnrDetails?: BatEnrBatiment | null): BatEnrInfo => ({
  architecturalProtectionAc1: batEnrDetails?.ac1 ?? false,
  architecturalProtectionAc2: batEnrDetails?.ac2 ?? false,
  architecturalProtectionAc3: batEnrDetails?.ac3 ?? false,
  architecturalProtectionAc4: batEnrDetails?.ac4 ?? false,
  architecturalProtectionAc4bis: batEnrDetails?.ac4bis ?? false,
  geothermalNappeGmi: batEnrDetails?.gmi_nappe_200 != null ? Number(batEnrDetails.gmi_nappe_200) : null,
  geothermalNappePotential: batEnrDetails?.pot_nappe != null ? Number(batEnrDetails.pot_nappe) : null,
  geothermalSondeGmi: batEnrDetails?.gmi_sonde_200 != null ? Number(batEnrDetails.gmi_sonde_200) : null,
  geothermiePossible: [1, 2].includes(Number(batEnrDetails?.gmi_nappe_200)) || [1, 2].includes(Number(batEnrDetails?.gmi_sonde_200)),
  hasGeothermalProbeSpace: batEnrDetails?.place_nappe ?? null,
  planProtectionAtmosphere: batEnrDetails?.etat_ppa === 'PPA Validés',
  solarThermalCoverage: batEnrDetails?.couv_st_ecs_2025 != null ? Number(batEnrDetails.couv_st_ecs_2025) : null,
});
