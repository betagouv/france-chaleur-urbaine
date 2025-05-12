import { useCallback, useState } from 'react';

import useURLParamOrLocalStorage, { parseAsString } from '@/hooks/useURLParamOrLocalStorage';
import { formatDataToAirtable, submitToAirtable } from '@/services/airtable';
import { trackEvent } from '@/services/analytics';
import { type AddressDataType } from '@/types/AddressData';
import { Airtable } from '@/types/enum/Airtable';
import { type FormDemandCreation } from '@/types/Summary/Demand';

const warningMessage = "N'oubliez pas d'indiquer votre type de chauffage.";

export type ContactFormContext = 'comparateur' | 'carte' | 'choix-chauffage';

const contextToAnalyticsPrefix = {
  comparateur: 'Comparateur',
  carte: 'Carte',
  'choix-chauffage': 'Choix chauffage',
} as const;

function getContextPrefix(context?: ContactFormContext) {
  return context && contextToAnalyticsPrefix[context] ? (` - ${contextToAnalyticsPrefix[context]}` as const) : '';
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
    // TODO à corriger
    // @ts-ignore
    trackEvent(`Eligibilité|Formulaire de test${getContextPrefix(context)} - Envoi`, address);
  };

  const handleOnSuccessAddress = useCallback((data: AddressDataType, context?: ContactFormContext, doTrackEvent: boolean = true) => {
    const { address, heatingType, eligibility } = data;
    if (doTrackEvent) {
      // TODO à corriger
      trackEvent(
        // @ts-ignore
        `Eligibilité|Formulaire de test${getContextPrefix(context)} - Adresse ${eligibility?.isEligible ? 'É' : 'Iné'}ligible`,
        address || 'Adresse indefini'
      );
    }
    setAddressData(data);
    if (address && heatingType) {
      setContactReady(true);
    }
  }, []);

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
      const formatData = formatDataToAirtable({
        ...data,
        mtm_campaign,
        mtm_kwd,
        mtm_source,
      } as FormDemandCreation);
      const response = await submitToAirtable(formatData, Airtable.UTILISATEURS);
      const { id } = await response.json();
      setMessageSent(true);
      const { eligibility, address = '' } = (data as AddressDataType) || {};
      trackEvent(
        `Eligibilité|Formulaire de contact ${eligibility?.isEligible ? 'é' : 'iné'}ligible${getContextPrefix(context)} - Envoi`,
        address
      );
      setAddressData({
        ...addressData,
        ...data,
        airtableId: id,
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
    showWarning,
    messageSent,
    messageReceived,
    loadingStatus,
    warningMessage,
    setLoadingStatus,
    handleOnChangeAddress,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
    handleResetFormContact,
  };
};

export default useContactFormFCU;
