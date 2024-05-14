import { formatDataToAirtable, submitToAirtable } from '@helpers/airtable';
import { useCallback, useRef, useState } from 'react';
import { trackEvent } from 'src/services/analytics';
import { AddressDataType } from 'src/types/AddressData';
import { Airtable } from 'src/types/enum/Airtable';
import useURLParamOrLocalStorage, {
  parseAsString,
} from '@hooks/useURLParamOrLocalStorage';

const warningMessage = "N'oubliez pas d'indiquer votre type de chauffage.";

const useContactFormFCU = () => {
  const EligibilityFormContactRef = useRef<null | HTMLDivElement>(null);

  const [addressData, setAddressData] = useState<AddressDataType>({});
  const [contactReady, setContactReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageReceived, setMessageReceived] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('idle');
  const [mtm_campaign] = useURLParamOrLocalStorage(
    'mtm_campaign',
    'mtm_campaign',
    null,
    parseAsString
  );

  const timeoutScroller = useCallback(
    (delai: number, callback?: () => void) =>
      window.setTimeout(() => {
        EligibilityFormContactRef.current?.scrollIntoView({
          behavior: 'smooth',
        });
        if (callback) {
          callback();
        }
      }, delai),
    []
  );

  const handleOnChangeAddress = useCallback((data: AddressDataType) => {
    const { address, heatingType } = data;
    setAddressData(data as AddressDataType);
    setShowWarning(!!(address && !heatingType));
  }, []);

  const handleOnFetchAddress = (
    { address }: { address: any },
    fromMap?: boolean
  ) => {
    setLoadingStatus('loading');
    setMessageSent(false);
    setMessageReceived(false);
    trackEvent(
      `Eligibilité|Formulaire de test${fromMap ? ' - Carte' : ''} - Envoi`,
      address
    );
  };

  const handleOnSuccessAddress = useCallback(
    (data: AddressDataType, fromMap?: boolean, dontNotify?: boolean) => {
      const { address, heatingType, eligibility } = data;
      if (!dontNotify) {
        trackEvent(
          `Eligibilité|Formulaire de test${
            fromMap ? ' - Carte' : ''
          } - Adresse ${eligibility?.isEligible ? 'É' : 'Iné'}ligible`,
          address || 'Adresse indefini'
        );
      }
      setAddressData(data);
      if (address && heatingType) {
        setContactReady(true);
        const scrollTimer = timeoutScroller(500, () =>
          setLoadingStatus('loaded')
        );
        return () => window.clearTimeout(scrollTimer);
      }
    },
    [timeoutScroller]
  );

  const handleOnSubmitContact = useCallback(
    async (data?: AddressDataType, fromMap?: boolean) => {
      if (data && data.structure !== 'Tertiaire') {
        data.company = '';
      }
      setMessageSent(true);
      const { eligibility, address = '' } = (data as AddressDataType) || {};
      trackEvent(
        `Eligibilité|Formulaire de contact ${
          eligibility?.isEligible ? 'é' : 'iné'
        }ligible${fromMap ? ' - Carte' : ''} - Envoi`,
        address
      );
      const response = await submitToAirtable(
        formatDataToAirtable({ ...data, mtm_campaign }),
        Airtable.UTILISATEURS
      );
      const { id } = await response.json();
      const scrollTimer = timeoutScroller(500);
      setAddressData({
        ...addressData,
        ...data,
        airtableId: id,
      });
      setMessageReceived(true);
      return () => window.clearTimeout(scrollTimer);
    },
    [addressData, timeoutScroller]
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
    EligibilityFormContactRef,
    addressData,
    contactReady,
    showWarning,
    messageSent,
    messageReceived,
    loadingStatus,
    warningMessage,
    handleOnChangeAddress,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
    handleResetFormContact,
  };
};

export default useContactFormFCU;
