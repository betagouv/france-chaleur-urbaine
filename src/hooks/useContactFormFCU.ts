import markupData, {
  facebookEvent,
  googleAdsEvent,
  linkedInEvent,
  matomoEvent,
  taboolaEvent,
} from '@components/Markup';
import { formatDataToAirtable, submitToAirtable } from '@helpers/airtable';
import { useCallback, useRef, useState } from 'react';
import { AddressDataType } from 'src/types/AddressData';

const callMarkup__handleOnFetchAddress = (
  address: string,
  fromMap?: boolean
) => {
  matomoEvent(
    markupData.eligibilityTest.matomoEvent[fromMap ? 'map' : 'form'],
    [address]
  );
  linkedInEvent(markupData.eligibilityTest.linkedInEvent);
  facebookEvent(markupData.eligibilityTest.facebookEvent);
  googleAdsEvent('10986886666', markupData.eligibilityTest.googleAdsEvent);
  taboolaEvent('lead', '1511088');
};

const callMarkup__handleOnSuccessAddress = ({
  eligibility,
  address,
  fromMap,
}: {
  eligibility: boolean;
  address?: string;
  fromMap?: boolean;
}) => {
  if (eligibility) {
    matomoEvent(
      markupData.eligibilityTestOK.matomoEvent[fromMap ? 'map' : 'form'],
      [address || 'Adresse indefini']
    );
    linkedInEvent(markupData.eligibilityTestOK.linkedInEvent);
    googleAdsEvent('10986886666', markupData.eligibilityTestOK.googleAdsEvent);
  } else {
    matomoEvent(
      markupData.eligibilityTestKO.matomoEvent[fromMap ? 'map' : 'form'],
      [address || 'Adresse indefini']
    );
    linkedInEvent(markupData.eligibilityTestKO.linkedInEvent);
    googleAdsEvent('10986886666', markupData.eligibilityTestKO.googleAdsEvent);
  }
};
const callMarkup__handleOnSubmitContact = (
  data: AddressDataType,
  fromMap?: boolean
) => {
  const { eligibility, address = '' } = data;
  const markupEligibilityKey = eligibility
    ? 'contactFormEligible'
    : 'contactFormIneligible';
  matomoEvent(
    markupData[markupEligibilityKey].matomoEvent[fromMap ? 'map' : 'form'],
    [address]
  );
  facebookEvent(markupData[markupEligibilityKey].facebookEvent);
  if (eligibility) {
    taboolaEvent('complete_registration', '1511088');
  }
};

const warningMessage = "N'oubliez pas d'indiquer votre type de chauffage.";

const useContactFormFCU = () => {
  const EligibilityFormContactRef = useRef<null | HTMLDivElement>(null);

  const [addressData, setAddressData] = useState<AddressDataType>({});
  const [contactReady, setContactReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageReceived, setMessageReceived] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('idle');

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
    callMarkup__handleOnFetchAddress(address, fromMap);
  };

  const handleOnSuccessAddress = useCallback(
    (data: AddressDataType, fromMap?: boolean, dontNotify?: boolean) => {
      const { address, heatingType, eligibility } = data;
      if (!dontNotify) {
        callMarkup__handleOnSuccessAddress({
          eligibility: eligibility ? eligibility.isEligible : false,
          address,
          fromMap,
        });
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
      callMarkup__handleOnSubmitContact(
        (data as AddressDataType) || {},
        fromMap
      );
      const response = await submitToAirtable(
        formatDataToAirtable(data),
        'FCU - Utilisateurs'
      );
      const responseData = await response.json();
      const scrollTimer = timeoutScroller(500);
      setAddressData({
        ...addressData,
        ...data,
        airtableId: responseData.ids[0]?.id,
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
