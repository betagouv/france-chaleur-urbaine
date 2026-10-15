import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { buildSimulationSituation } from '@/modules/chaleur-renouvelable/client/simulation-situation';
import { DEFAULT_SIMULATION_PARAMS } from '@/modules/chaleur-renouvelable/constants';
import { getSimulationPrefillFromBatEnrBatiment } from '@/modules/chaleur-renouvelable/simulation-prefill';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

export function useChoixChauffageResults() {
  const engine = useSimulatorEngine();
  const urlParams = useChoixChauffageQueryParams();
  const params = urlParams.params;
  const utils = trpc.useUtils();
  const selectionVersion = useRef(0);

  useRemoveHashOnScroll('#help-ademe');

  const {
    altitude,
    geoAddress,
    setGeoAddress,
    batEnr,
    batEnrBatiments,
    codeDepartement,
    eligibiliteReseauChaleur,
    eligibiliteReseauFroid,
    isEligibilityLoading,
    shouldSelectBatEnrBatiment,
    temperatureRef,
    onSelectGeoAddress,
    resetEligibility,
    selectBatEnrBatiment,
    selectedBatEnrBatiment,
  } = useAddressEligibility(params.adresse ?? null, params.constructionId);
  const selectedConstructionId = selectedBatEnrBatiment?.batiment_construction_id;
  const prefill = trpc.batEnr.getSimulationPrefill.useQuery(
    { batiment_construction_id: selectedConstructionId ?? '' },
    { enabled: Boolean(selectedConstructionId) }
  );
  // Preserve explicit URL/user values; RNIC only fills missing inputs for the current building.
  useEffect(() => {
    if (!prefill.data || isEligibilityLoading || geoAddress?.properties.label !== params.adresse) {
      return;
    }
    const missing = {
      ...(params.nbLogements === null && prefill.data.nbLogements !== undefined && { nbLogements: prefill.data.nbLogements }),
      ...(params.surfaceMoyenne === null && prefill.data.surfaceMoyenne !== undefined && { surfaceMoyenne: prefill.data.surfaceMoyenne }),
    };
    if (Object.keys(missing).length > 0) {
      void urlParams.setParams(missing);
    }
  }, [prefill.data, params.nbLogements, params.surfaceMoyenne, params.adresse, isEligibilityLoading, geoAddress, urlParams]);

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [shouldScrollToHotWaterParams, setShouldScrollToHotWaterParams] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>();
  const contactForm = useContactFormFCU();

  const situation = useMemo(
    () => buildSimulationSituation({ altitude, batEnr, eligibiliteReseauChaleur, eligibiliteReseauFroid, params }),
    [altitude, batEnr, eligibiliteReseauChaleur, eligibiliteReseauFroid, params]
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
    setShouldScrollToHotWaterParams(true);
    setIsParamsOpen(true);
  }, []);

  // Scroll only after React has rendered the newly opened parameters section.
  useEffect(() => {
    if (!isParamsOpen || !shouldScrollToHotWaterParams) {
      return;
    }

    document.getElementById(HOT_WATER_PARAMS_SECTION_ID)?.scrollIntoView({ block: 'start' });
    setShouldScrollToHotWaterParams(false);
  }, [isParamsOpen, shouldScrollToHotWaterParams]);

  const handleSelectGeoAddress = useCallback(
    (geoAddress?: BANAddressFeature) => {
      selectionVersion.current += 1;
      if (!geoAddress) {
        urlParams.setParams({ adresse: null, constructionId: null });
        resetEligibility();
        return;
      }

      urlParams.setParams({ adresse: geoAddress.properties.label, constructionId: null });
      onSelectGeoAddress(geoAddress);
    },
    [onSelectGeoAddress, resetEligibility, urlParams]
  );

  const handleSelectBatEnrBatiment = useCallback(
    toastErrors(async (batEnrBatiment: (typeof batEnrBatiments)[number]) => {
      if (!batEnrBatiment.batiment_construction_id) {
        return;
      }

      const version = ++selectionVersion.current;
      const prefillParams = await utils.batEnr.getSimulationPrefill.fetch({
        batiment_construction_id: batEnrBatiment.batiment_construction_id,
      });
      if (selectionVersion.current !== version) {
        return;
      }
      await urlParams.setParams({
        ...getSimulationPrefillFromBatEnrBatiment(batEnrBatiment),
        ...prefillParams,
        constructionId: batEnrBatiment.batiment_construction_id,
      });
      selectBatEnrBatiment(batEnrBatiment);
    }),
    [selectBatEnrBatiment, urlParams, utils]
  );

  return {
    batEnrBatiments,
    codeDepartement,
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
    isEligibilityLoading,
    isParamsOpen,
    modesEnriched,
    openAccordionId,
    otherModes,
    recommended,
    selectedBatEnrBatiment,
    setGeoAddress,
    setIsParamsOpen,
    shouldSelectBatEnrBatiment,
    situation,
    urlParams,
  };
}
