import { useRef, useState } from 'react';

import { trackPostHogEvent } from '@/modules/analytics/client';
import {
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
} from '@/modules/chaleur-renouvelable/constants';
import type { CcrtDemand, CcrtDemandUpdate } from '@/modules/chaleur-renouvelable/types';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

import { invalidateCcrtDemand } from '../ccrt-demand-cache';

/**
 * Preserves contact tracking and applies follow-up changes confirmed by the server.
 */
export function useCcrtDemandActions(structureName: string | null) {
  const [emailDemand, setEmailDemand] = useState<CcrtDemand | null>(null);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
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

  const trackContact = (demand: CcrtDemand, contactType: 'email' | 'phone', shouldUpdateStatus = true) => {
    const trackingProperties = { ...getTrackingProperties(demand), emplacement: 'liste' as const };
    trackPostHogEvent('ccrt_demande:contact_clicked', trackingProperties);
    trackPostHogEvent(
      contactType === 'email' ? 'ccrt_demande:contact_email_clicked' : 'ccrt_demande:contact_phone_clicked',
      trackingProperties
    );
    if (shouldUpdateStatus && demand.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS) {
      void toastErrors(updateDemand)(demand, { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT }, 'contact');
    }
  };

  const trackOpening = (demand: CcrtDemand) => {
    trackPostHogEvent('ccrt_demandes:demande_opened', {
      ...getTrackingProperties(demand),
      premiere_ouverture: !openedDemands.current.has(demand.id),
    });
    openedDemands.current.add(demand.id);
  };

  const trackSimulation = (demand: CcrtDemand) => {
    trackPostHogEvent('ccrt_demande:simulation_viewed', { ...getTrackingProperties(demand), emplacement: 'liste' });
  };

  const openEmail = (demand: CcrtDemand, showHistory = false) => {
    if (!showHistory) {
      trackContact(demand, 'email', false);
    }
    setShowEmailHistory(showHistory);
    setEmailDemand(demand);
  };

  return {
    closeEmail: () => setEmailDemand(null),
    emailDemand,
    isUpdating: mutation.isPending,
    openEmail,
    showEmailHistory,
    trackContact,
    trackOpening,
    trackSimulation,
    updateDemand,
  };
}
