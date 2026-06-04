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
  } = useAddressEligibility(urlParams.adresse ?? null, urlParams.constructionId);

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const contactForm = useContactFormFCU();

  const situation = useMemo(
    () => buildSimulationSituation({ batEnr, eligibiliteReseauChaleur, urlParams: urlParams.simulationParams }),
    [
      urlParams.adresse,
      batEnr.architecturalProtectionAc1,
      batEnr.architecturalProtectionAc2,
      batEnr.architecturalProtectionAc3,
      batEnr.architecturalProtectionAc4,
      batEnr.architecturalProtectionAc4bis,
      urlParams.dpe,
      urlParams.espaceExterieur,
      urlParams.habitantsMoyen,
      urlParams.modeEauChaudeSanitaire,
      urlParams.nbLogements,
      urlParams.surfaceMoyenne,
      urlParams.typeRadiateur,
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

  const effectiveTypeLogement = urlParams.typeLogement ?? DEFAULT_SIMULATION_PARAMS.typeLogement;
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
      heating_mode: urlParams.typeLogement,
      outdoor_space: urlParams.espaceExterieur,
    });
  }, [modesEnriched.length, urlParams.espaceExterieur, urlParams.typeLogement]);

  const handleAccordionOpenChange = useCallback((id: string, expanded: boolean) => {
    setOpenAccordionId(expanded ? id : null);
    trackPostHogEvent('chaleur-renouvelable:accordeon', { name: id });
  }, []);

  const handleEditHotWaterParamsClick = useCallback(() => {
    setIsParamsOpen(true);
    document.getElementById(HOT_WATER_PARAMS_SECTION_ID)?.scrollIntoView({ block: 'start' });
  }, []);

  const openHeatNetworkContactModal = useCallback(() => {
    if (!geoAddress || !urlParams.adresse || !eligibiliteReseauChaleur) {
      return;
    }

    const [lon, lat] = geoAddress.geometry.coordinates;
    contactForm.handleOnSuccessAddress(
      {
        address: urlParams.adresse,
        coords: { lat, lon },
        eligibility: eligibiliteReseauChaleur,
        geoAddress,
        heatingType: 'collectif',
      },
      'chaleur-renouvelable'
    );
  }, [contactForm, eligibiliteReseauChaleur, geoAddress, urlParams.adresse]);

  const handleSelectGeoAddress = useCallback(
    (geoAddress?: BANAddressFeature) => {
      urlParams.setConstructionId(null);

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

      urlParams.setConstructionId(batEnrBatiment.batiment_construction_id);
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
