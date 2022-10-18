import markupData, {
  facebookEvent,
  googleAdsEvent,
  linkedInEvent,
  matomoEvent,
} from '@components/Markup';
import { formatDataToAirtable, submitToAirtable } from '@helpers/airtable';
import { useCallback, useRef, useState } from 'react';
import { AddressDataType } from 'src/types/AddressData';

const callMarkup__handleOnFetchAddress = (address: string) => {
  matomoEvent(markupData.eligibilityTest.matomoEvent, [address]);
  linkedInEvent(markupData.eligibilityTest.linkedInEvent);
  facebookEvent(markupData.eligibilityTest.facebookEvent);
  googleAdsEvent('10986886666', markupData.eligibilityTest.googleAdsEvent);
};

const callMarkup__handleOnSuccessAddress = ({
  eligibility,
  address,
}: {
  eligibility: boolean;
  address?: string;
}) => {
  if (eligibility) {
    matomoEvent(markupData.eligibilityTestOK.matomoEvent, [
      address || 'Adresse indefini',
    ]);
    linkedInEvent(markupData.eligibilityTestOK.linkedInEvent);
    googleAdsEvent('10986886666', markupData.eligibilityTestOK.googleAdsEvent);
  } else {
    matomoEvent(markupData.eligibilityTestKO.matomoEvent, [
      address || 'Adresse indefini',
    ]);
    linkedInEvent(markupData.eligibilityTestKO.linkedInEvent);
    googleAdsEvent('10986886666', markupData.eligibilityTestKO.googleAdsEvent);
  }
};
const callMarkup__handleOnSubmitContact = (data: AddressDataType) => {
  const { eligibility, address = '' } = data;
  const markupEligibilityKey = eligibility
    ? 'contactFormEligible'
    : 'contactFormIneligible';
  matomoEvent(markupData[markupEligibilityKey].matomoEvent, [address]);
  facebookEvent(markupData[markupEligibilityKey].facebookEvent);
};

const warningMessage = "N'oubliez pas d'indiquer votre type de chauffage.";

const useContactFormFCU = () => {
  const EligibilityFormContactRef = useRef(null);

  const [addressData, setAddressData] = useState({});
  const [contactReady, setContactReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageReceived, setMessageReceived] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('idle');

  const timeoutScroller = useCallback(
    (delai: number, callback?: () => void) =>
      window.setTimeout(() => {
        const { current }: any = EligibilityFormContactRef;
        current?.scrollIntoView({
          behavior: 'smooth',
        });
        if (callback) callback();
      }, delai),
    []
  );

  const handleOnChangeAddress = useCallback(
    (data: { address: any; heatingType: string }) => {
      const { address, heatingType } = data;
      setAddressData(data);
      setShowWarning(address && !heatingType);
    },
    []
  );

  const handleOnFetchAddress = ({ address }: { address: any }) => {
    setLoadingStatus('loading');
    setMessageSent(false);
    setMessageReceived(false);
    callMarkup__handleOnFetchAddress(address);
  };

  const handleOnSuccessAddress = useCallback(
    (data: AddressDataType) => {
      const { address, heatingType, eligibility } = data;
      callMarkup__handleOnSuccessAddress({
        eligibility: eligibility ? eligibility.isEligible : false,
        address,
      });
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
    async (data?: AddressDataType) => {
      if (data && data.structure !== 'Tertiaire') {
        data.company = '';
      }
      setMessageSent(true);
      callMarkup__handleOnSubmitContact((data as AddressDataType) || {});
      await submitToAirtable(formatDataToAirtable(data), 'FCU - Utilisateurs');
      const scrollTimer = timeoutScroller(500);
      setAddressData({ ...addressData, ...data });
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
