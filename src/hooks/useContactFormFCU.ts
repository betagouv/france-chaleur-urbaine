import markupData, {
  facebookEvent,
  googleAdsEvent,
  linkedInEvent,
  matomoEvent,
} from '@components/Markup';
import { useCallback, useRef, useState } from 'react';
import { useBackEndFCU } from 'src/hooks';

const callMarkup__handleOnFetchAddress = (address: string) => {
  matomoEvent(markupData.eligibilityTest.matomoEvent, [address]);
  linkedInEvent(markupData.eligibilityTest.linkedInEvent);
  facebookEvent(markupData.eligibilityTest.facebookEvent);
  googleAdsEvent('10794036298', markupData.eligibilityTest.googleAdsEvent);
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
    googleAdsEvent('10794036298', markupData.eligibilityTestOK.googleAdsEvent);
  } else {
    matomoEvent(markupData.eligibilityTestKO.matomoEvent, [
      address || 'Adresse indefini',
    ]);
    linkedInEvent(markupData.eligibilityTestKO.linkedInEvent);
    googleAdsEvent('10794036298', markupData.eligibilityTestKO.googleAdsEvent);
  }
};
const callMarkup__handleOnSubmitContact = (data: Record<string, any>) => {
  const { estEligible: eligibility, address } = data;
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
  const [loadingStatus, setLoadingStatus] = useState('idle');
  const [submitToFCU] = useBackEndFCU();

  const handleOnChangeAddress = useCallback((data) => {
    const { address, heatingType } = data;
    setAddressData(data);
    setShowWarning(address && !heatingType);
  }, []);

  const handleOnFetchAddress = useCallback(
    ({ address }) => {
      const { heatingType }: any = addressData;
      setLoadingStatus('loading');
      setMessageSent(false);
      callMarkup__handleOnFetchAddress(address);
      setShowWarning(address && !heatingType);
    },
    [addressData]
  );

  const handleOnSuccessAddress = useCallback(
    (data: any) => {
      const { address, heatingType, eligibility } = data;
      callMarkup__handleOnSuccessAddress({ eligibility, address });
      setAddressData(data);
      if (address && heatingType) {
        setContactReady(true);
        const scrollTimer = window.setTimeout(() => {
          const { current }: any = EligibilityFormContactRef;
          current?.scrollIntoView({
            behavior: 'smooth',
          });
          setLoadingStatus('loaded');
        }, 500);

        return () => window.clearTimeout(scrollTimer);
      }
    },
    [EligibilityFormContactRef]
  );

  const handleOnSubmitContact = useCallback(
    async (data: Record<string, any>) => {
      callMarkup__handleOnSubmitContact(data);
      await submitToFCU(data);
      setAddressData({ ...addressData, ...data });
      setMessageSent(true);
    },
    [addressData, submitToFCU]
  );

  return {
    EligibilityFormContactRef,
    addressData,
    contactReady,
    showWarning,
    messageSent,
    loadingStatus,
    warningMessage,
    handleOnChangeAddress,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
  };
};

export default useContactFormFCU;
