import { useCallback, useEffect, useMemo, useState } from 'react';

import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { getHeatingModeCosts, setPublicodesSituation } from '@/modules/chaleur-renouvelable/client/heatingModeCosts';
import { useAddressEligibility } from '@/modules/chaleur-renouvelable/client/hooks/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import { useRemoveHashOnScroll } from '@/modules/chaleur-renouvelable/client/hooks/useRemoveHashOnScroll';
import { getIncompatibleSolutionRows, getModesDeChauffage } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import { HOT_WATER_PARAMS_SECTION_ID } from '@/modules/chaleur-renouvelable/client/ParamsForm';
import { buildSimulationSituation } from '@/modules/chaleur-renouvelable/client/simulationSituation';
import { DEFAULT_SIMULATION_PARAMS } from '@/modules/chaleur-renouvelable/constants';
import { getSimulationPrefillFromBatEnrBatiment } from '@/modules/chaleur-renouvelable/simulation-prefill';

export function useChoixChauffageResults() {
  const engine = useSimulatorEngine();
  const urlParams = useChoixChauffageQueryParams();
  const params = urlParams.params;
  useRemoveHashOnScroll('#help-ademe');
  const {
    geoAddress,
    setGeoAddress,
    batEnr,
    batEnrBatiments,
    codeDepartement,
    eligibiliteReseauChaleur,
    shouldSelectBatEnrBatiment,
    temperatureRef,
    onSelectGeoAddress,
    resetEligibility,
    selectBatEnrBatiment,
    selectedBatEnrBatiment,
  } = useAddressEligibility(params.adresse ?? null, params.constructionId);

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const contactForm = useContactFormFCU();

  const situation = useMemo(
    () => buildSimulationSituation({ batEnr, eligibiliteReseauChaleur, urlParams: params }),
    [
      params,
      batEnr.architecturalProtectionAc1,
      batEnr.architecturalProtectionAc2,
      batEnr.architecturalProtectionAc3,
      batEnr.architecturalProtectionAc4,
      batEnr.architecturalProtectionAc4bis,
      batEnr.geothermiePossible,
      batEnr.geothermalNappeGmi,
      batEnr.geothermalNappePotential,
      batEnr.geothermalSondeGmi,
      batEnr.hasGeothermalProbeSpace,
      batEnr.planProtectionAtmosphere,
      batEnr.solarThermalCoverage,
      eligibiliteReseauChaleur,
    ]
  );

  useEffect(() => {
    if (!codeDepartement) {
      return;
    }

    setPublicodesSituation(engine, { codeDepartement, situation, temperatureRef });
  }, [codeDepartement, situation, temperatureRef]);

  const effectiveTypeLogement = params.typeLogement ?? DEFAULT_SIMULATION_PARAMS.typeLogement;
  const modesDeChauffage = useMemo(() => getModesDeChauffage(effectiveTypeLogement, situation), [effectiveTypeLogement, situation]);
  const incompatibleSolutionRows = useMemo(
    () => getIncompatibleSolutionRows(situation, effectiveTypeLogement),
    [effectiveTypeLogement, situation]
  );
  const { coutParAnGaz, coutParAnGazHotWaterOnly, modesEnriched } = useMemo(
    () => getHeatingModeCosts(engine, modesDeChauffage, situation),
    [engine, modesDeChauffage, situation]
  );
  const [recommended, ...otherModes] = modesEnriched;

  useEffect(() => {
    if (!recommended) {
      return;
    }

    trackPostHogEvent('fcr_results:recommended_solution_displayed', { solution_type: recommended.label });
  }, [recommended]);

  useEffect(() => {
    if (modesEnriched.length > 0) {
      return;
    }

    trackPostHogEvent('fcr_results:no_solution_displayed', {
      heating_mode: params.typeLogement,
      outdoor_space: params.espaceExterieur,
    });
  }, [modesEnriched.length, params.espaceExterieur, params.typeLogement]);

  const handleAccordionOpenChange = useCallback((id: string, expanded: boolean) => {
    setOpenAccordionId(expanded ? id : null);
    trackPostHogEvent('chaleur-renouvelable:accordeon', { name: id });
  }, []);

  const handleEditHotWaterParamsClick = useCallback(() => {
    setIsParamsOpen(true);
    document.getElementById(HOT_WATER_PARAMS_SECTION_ID)?.scrollIntoView({ block: 'start' });
  }, []);

  const openHeatNetworkContactModal = useCallback(() => {
    if (!geoAddress || !params.adresse || !eligibiliteReseauChaleur) {
      return;
    }

    const [lon, lat] = geoAddress.geometry.coordinates;
    contactForm.handleOnSuccessAddress(
      {
        address: params.adresse,
        coords: { lat, lon },
        eligibility: eligibiliteReseauChaleur,
        geoAddress,
        heatingType: 'collectif',
      },
      'chaleur-renouvelable'
    );
  }, [contactForm, eligibiliteReseauChaleur, geoAddress, params.adresse]);

  const handleSelectGeoAddress = useCallback(
    (geoAddress?: BANAddressFeature) => {
      urlParams.setParams({ constructionId: null });

      if (!geoAddress) {
        resetEligibility();
        return;
      }

      onSelectGeoAddress(geoAddress);
    },
    [onSelectGeoAddress, resetEligibility, urlParams]
  );

  const handleSelectBatEnrBatiment = useCallback(
    (batEnrBatiment: (typeof batEnrBatiments)[number]) => {
      if (!batEnrBatiment.batiment_construction_id) {
        return;
      }

      urlParams.setParams({ constructionId: batEnrBatiment.batiment_construction_id });
      selectBatEnrBatiment(batEnrBatiment);
    },
    [selectBatEnrBatiment, urlParams]
  );

  useEffect(() => {
    const batimentConstructionId = selectedBatEnrBatiment?.batiment_construction_id;

    if (!batimentConstructionId) {
      return;
    }

    urlParams.setPrefillParams(getSimulationPrefillFromBatEnrBatiment(selectedBatEnrBatiment));
  }, [selectedBatEnrBatiment, urlParams]);

  return {
    batEnrBatiments,
    contactForm,
    coutParAnGaz,
    coutParAnGazHotWaterOnly,
    effectiveTypeLogement,
    geoAddress,
    handleAccordionOpenChange,
    handleEditHotWaterParamsClick,
    handleSelectBatEnrBatiment,
    handleSelectGeoAddress,
    incompatibleSolutionRows,
    isParamsOpen,
    modesEnriched,
    openAccordionId,
    openHeatNetworkContactModal,
    otherModes,
    recommended,
    setGeoAddress,
    setIsParamsOpen,
    shouldSelectBatEnrBatiment,
    situation,
    urlParams,
  };
}
