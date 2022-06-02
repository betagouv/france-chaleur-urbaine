import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import markupData, {
  facebookEvent,
  googleAdsEvent,
  linkedInEvent,
  matomoEvent,
} from '@components/Markup';
import Slice from '@components/Slice';
import React, { useCallback, useRef, useState } from 'react';
import { useBackEndFCU } from 'src/hooks';
import {
  Container,
  FormWarningMessage,
  Loader,
  LoaderWrapper,
  SliceContactFormStyle,
} from './SliceForm.style';

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

const HeadSlice: React.FC = () => {
  const [addressData, setAddressData] = useState({});
  const [contactReady, setContactReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('idle');
  const [submitToFCU] = useBackEndFCU();

  const EligibilityFormContactRef = useRef(null);

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
  const handleOnSuccessAddress = useCallback((data: any) => {
    const { address, heatingType, eligibility } = data;
    callMarkup__handleOnSuccessAddress({ eligibility, address });
    // TODO: Prefer context ?
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
  }, []);

  const handleOnSubmitContact = useCallback(
    async (data: Record<string, any>) => {
      callMarkup__handleOnSubmitContact(data);
      await submitToFCU(data);
      setAddressData({ ...addressData, ...data });
      setMessageSent(true);
    },
    [addressData, submitToFCU]
  );

  return (
    <>
      <Slice>
        <Container>
          <>
            <EligibilityFormAddress
              onChange={handleOnChangeAddress}
              onFetch={handleOnFetchAddress}
              onSuccess={handleOnSuccessAddress}
            />

            <FormWarningMessage show={showWarning}>
              {warningMessage}
            </FormWarningMessage>

            <LoaderWrapper show={!showWarning && loadingStatus === 'loading'}>
              <Loader />
            </LoaderWrapper>
          </>
        </Container>
      </Slice>

      <SliceContactFormStyle />
      <div ref={EligibilityFormContactRef}>
        <Slice
          padding={5}
          theme="grey"
          className={`slice-contact-form-wrapper ${
            contactReady && !messageSent ? 'active' : ''
          }`}
        >
          <EligibilityFormContact
            addressData={addressData}
            onSubmit={handleOnSubmitContact}
          />
        </Slice>

        <Slice
          padding={5}
          theme="grey"
          className={`slice-contact-form-wrapper ${
            messageSent ? 'active' : ''
          }`}
        >
          <EligibilityFormMessageConfirmation addressData={addressData} />
        </Slice>
      </div>
    </>
  );
};

export default HeadSlice;
