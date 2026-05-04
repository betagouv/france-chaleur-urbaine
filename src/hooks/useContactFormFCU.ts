import { useCallback, useState } from 'react';

import useURLParamOrLocalStorage, { parseAsString } from '@/hooks/useURLParamOrLocalStorage';
import { trackEvent, trackPostHogEvent } from '@/modules/analytics/client';
import type { CreateDemandInput, ModeDeChauffage, TypeDeChauffage } from '@/modules/demands/constants';
import trpc from '@/modules/trpc/client';
import type { AddressDataType } from '@/types/AddressData';

const warningMessage = "N'oubliez pas d'indiquer votre type de chauffage.";

export type ContactFormContext = 'comparateur' | 'carte' | 'choix-chauffage' | 'chaleur-renouvelable' | 'ville';

const contextToAnalyticsPrefix = {
  carte: 'Carte',
  'chaleur-renouvelable': 'Chaleur renouvelable',
  'choix-chauffage': 'Choix chauffage',
  comparateur: 'Comparateur',
  ville: 'Ville',
} as const;

function getMatomoContextPrefix(context?: ContactFormContext) {
  return context && contextToAnalyticsPrefix[context] ? (` - ${contextToAnalyticsPrefix[context]}` as const) : '';
}

function getEligibilityMatomoContextPrefix(context?: ContactFormContext) {
  switch (context) {
    case undefined:
      return '';
    case 'carte':
      return ' - Carte';
    case 'comparateur':
      return ' - Comparateur';
    default:
      return null;
  }
}

function getContactMatomoContextPrefix(context?: ContactFormContext) {
  switch (context) {
    case undefined:
      return '';
    case 'carte':
      return ' - Carte';
    case 'choix-chauffage':
      return ' - Choix chauffage';
    case 'comparateur':
      return ' - Comparateur';
    default:
      return null;
  }
}

const useContactFormFCU = () => {
  const [addressData, setAddressData] = useState<AddressDataType>({});
  const [contactReady, setContactReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageReceived, setMessageReceived] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('idle');
  const [mtm_campaign] = useURLParamOrLocalStorage('mtm_campaign', 'mtm_campaign', null, parseAsString);
  const [mtm_kwd] = useURLParamOrLocalStorage('mtm_kwd', 'mtm_kwd', null, parseAsString);
  const [mtm_source] = useURLParamOrLocalStorage('mtm_source', 'mtm_source', null, parseAsString);
  const trpcUtils = trpc.useUtils();

  const handleOnChangeAddress = useCallback((data: AddressDataType) => {
    const { address, heatingType } = data;
    setAddressData(data as AddressDataType);
    setShowWarning(!!(address && !heatingType));
    setLoadingStatus('idle');
  }, []);

  const handleOnFetchAddress = ({ address }: { address: any }, context?: ContactFormContext) => {
    setLoadingStatus('loading');
    setMessageSent(false);
    setMessageReceived(false);
    const prefix = getEligibilityMatomoContextPrefix(context);
    // on ne track pas les événements pour le choix chauffage car ce n'est pas de l'éligibilité
    // ni Chaleur renouvelable (que l'on gère uniquement via postHog)
    if (prefix !== null) {
      trackEvent(`Eligibilité|Formulaire de test${prefix} - Envoi`, address);
    }
  };

  const handleOnSuccessAddress = useCallback(
    (data: AddressDataType, context?: ContactFormContext, options: { doTrackEvent?: boolean } = { doTrackEvent: true }) => {
      const { address, heatingType, eligibility } = data;
      if (options.doTrackEvent) {
        const prefix = getEligibilityMatomoContextPrefix(context);
        // on ne track pas les événements pour le choix chauffage car ce n'est pas de l'éligibilité
        // ni Chaleur renouvelable (que l'on gère uniquement via postHog)
        if (prefix !== null) {
          trackEvent(
            `Eligibilité|Formulaire de test${prefix} - Adresse ${eligibility?.isEligible ? 'É' : 'Iné'}ligible`,
            address || 'Adresse indefini'
          );
          trackPostHogEvent('address_test:submitted', {
            address: address || '',
            chauffage_type: heatingType,
            distance_reseau_m: eligibility?.distance ?? undefined,
            is_eligible: !!eligibility?.isEligible,
            source: context || 'homepage',
          });
        }
      }
      trackPostHogEvent('address_test:result_displayed', {
        chauffage_type: heatingType,
        distance_reseau_m: eligibility?.distance ?? undefined,
        result_type: eligibility?.futurNetwork
          ? 'en construction'
          : eligibility?.inPDP
            ? 'pdp'
            : eligibility?.isEligible
              ? 'eligible'
              : 'non eligible',
        source: context || 'homepage',
      });
      setAddressData(data);
      if (address && heatingType) {
        setContactReady(true);
      }
    },
    []
  );

  const handleOnSubmitContact = useCallback(
    async (data?: AddressDataType, context?: ContactFormContext) => {
      if (data) {
        if (data.structure !== 'Tertiaire') {
          data.company = '';
          data.companyType = '';
          data.demandCompanyType = '';
          data.demandCompanyName = '';
          data.demandArea = undefined;
          if (data.structure !== 'Copropriété') {
            data.nbLogements = undefined;
          }
        } else {
          if (
            data.companyType === 'Syndic de copropriété' ||
            data.companyType === 'Bailleur social' ||
            data.companyType === 'Gestionnaire de parc tertiaire'
          ) {
            data.demandCompanyType = '';
            data.demandCompanyName = '';
            if (data.companyType === 'Gestionnaire de parc tertiaire') {
              data.nbLogements = undefined;
            } else {
              data.demandArea = undefined;
            }
          } else {
            switch (data.demandCompanyType) {
              case 'Copropriété':
                data.demandArea = undefined;
                data.demandCompanyName = '';
                break;
              case 'Bâtiment tertiaire':
                data.nbLogements = undefined;
                break;
              case 'Bailleur social':
                data.demandArea = undefined;
                break;
              case 'Autre':
                data.demandArea = undefined;
                data.nbLogements = undefined;
                break;
              default:
                data.demandArea = undefined;
                data.demandCompanyName = '';
                data.nbLogements = undefined;
                break;
            }
          }
        }
      }

      const result = await trpcUtils.client.demands.user.create.mutate({
        ...data,
        mtm_campaign: mtm_campaign ?? undefined,
        mtm_kwd: mtm_kwd ?? undefined,
        mtm_source: mtm_source ?? undefined,
      } as unknown as CreateDemandInput);

      setMessageSent(true);
      const { eligibility, address = '' } = (data as AddressDataType) || {};
      // On ne track pas Matomo pour chaleur-renouvelable car ce parcours est tracké via PostHog.
      const prefix = getContactMatomoContextPrefix(context);
      if (prefix !== null) {
        trackEvent(`Eligibilité|Formulaire de contact ${eligibility?.isEligible ? 'é' : 'iné'}ligible${prefix} - Envoi`, address);
      }
      trackPostHogEvent('address_test:contact_form_submitted', {
        address,
        company_type: data?.companyType || undefined,
        demand_area_m2: data?.demandArea,
        heating_energy: (data as unknown as { heatingEnergy?: string })?.heatingEnergy as ModeDeChauffage,
        heating_type: data?.heatingType as TypeDeChauffage | undefined,
        is_eligible: !!eligibility?.isEligible,
        nb_logements: data?.nbLogements,
        source: context || 'homepage',
        structure_type: data?.structure || '',
      });
      setAddressData({
        ...addressData,
        ...data,
        demandId: result.id,
      });
      setMessageReceived(true);
    },
    [addressData]
  );

  const handleResetFormContact = useCallback(() => {
    setAddressData({});
    setContactReady(false);
    setShowWarning(false);
    setMessageSent(false);
    setMessageReceived(false);
    setLoadingStatus('idle');
  }, []);

  return {
    addressData,
    contactReady,
    handleOnChangeAddress,
    handleOnFetchAddress,
    handleOnSubmitContact,
    handleOnSuccessAddress,
    handleResetFormContact,
    loadingStatus,
    messageReceived,
    messageSent,
    setLoadingStatus,
    showWarning,
    warningMessage,
  };
};

export default useContactFormFCU;
