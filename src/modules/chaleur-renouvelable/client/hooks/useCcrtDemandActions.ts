import { useRef, useState } from 'react';

import { trackPostHogEvent } from '@/modules/analytics/client';
import type { CcrtTrackingPlacement } from '@/modules/analytics/posthog.config';
import type { CcrtDemand, CcrtDemandUpdate } from '@/modules/chaleur-renouvelable/types';
import trpc from '@/modules/trpc/client';

import { invalidateCcrtDemand } from '../ccrt-demand-cache';

/**
 * Preserves contact tracking and applies follow-up changes confirmed by the server.
 */
export function useCcrtDemandActions(structureName: string | null) {
  const [emailDemand, setEmailDemand] = useState<CcrtDemand | null>(null);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [emailPlacement, setEmailPlacement] = useState<CcrtTrackingPlacement>('liste');
  const utils = trpc.useUtils();
  const mutation = trpc.batEnr.ccrt.updateDemandeChaleurRenouvelable.useMutation();
  const openedDemands = useRef(new Set<string>());
  const updatingDemands = useRef(new Set<string>());

  const getTrackingProperties = (demand: CcrtDemand) => ({
    demande_id: demand.id,
    departement: demand.departement_code,
    solution_1: demand.alternative_heating_solutions[0] ?? null,
    structure_ccrt: structureName,
  });

  const updateDemand = async (demand: CcrtDemand, values: CcrtDemandUpdate, trigger: 'contact' | 'manual' = 'manual') => {
    if (updatingDemands.current.has(demand.id)) {
      return;
    }
    updatingDemands.current.add(demand.id);
    try {
      const updatedDemand = await mutation.mutateAsync({ demandId: demand.id, trigger, values });
      utils.batEnr.ccrt.listDemandesChaleurRenouvelable.setData(
        undefined,
        (data) =>
          data && {
            ...data,
            items: data.items.map((item) => (item.id === demand.id ? { ...item, ...updatedDemand } : item)),
          }
      );
      await invalidateCcrtDemand(utils, demand.id);
    } finally {
      updatingDemands.current.delete(demand.id);
    }
  };

  const trackContact = (demand: CcrtDemand, contactType: 'email' | 'phone', emplacement: CcrtTrackingPlacement = 'liste') => {
    trackPostHogEvent(contactType === 'email' ? 'ccrt_demande:contact_email_clicked' : 'ccrt_demande:contact_phone_clicked', {
      ...getTrackingProperties(demand),
      emplacement,
    });
  };

  const trackOpening = (demand: CcrtDemand) => {
    trackPostHogEvent('ccrt_demandes:demande_opened', {
      ...getTrackingProperties(demand),
      premiere_ouverture: !openedDemands.current.has(demand.id),
    });
    openedDemands.current.add(demand.id);
  };

  const trackSimulation = (demand: CcrtDemand, emplacement: CcrtTrackingPlacement = 'liste') => {
    trackPostHogEvent('ccrt_demande:simulation_viewed', { ...getTrackingProperties(demand), emplacement });
  };

  const openEmail = (demand: CcrtDemand, showHistory = false, emplacement: CcrtTrackingPlacement = 'liste') => {
    if (!showHistory) {
      trackPostHogEvent('ccrt_demande:contact_clicked', { ...getTrackingProperties(demand), emplacement });
    }
    setShowEmailHistory(showHistory);
    setEmailPlacement(emplacement);
    setEmailDemand(demand);
  };

  return {
    closeEmail: () => setEmailDemand(null),
    emailDemand,
    emailPlacement,
    isUpdating: mutation.isPending,
    openEmail,
    showEmailHistory,
    trackAccess: (demand: CcrtDemand) => trackPostHogEvent('ccrt_demande:access_managed', getTrackingProperties(demand)),
    trackContact,
    trackMap: (demand: CcrtDemand) => trackPostHogEvent('ccrt_demande:map_opened', getTrackingProperties(demand)),
    trackOpening,
    trackSimulation,
    updateDemand,
  };
}
