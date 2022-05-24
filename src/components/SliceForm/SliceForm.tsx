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
import React, { useCallback, useState } from 'react';
import {
  Container,
  FormWarningMessage,
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

  const handleOnChangeAddress = useCallback((data) => {
    const { address, chauffage } = data;
    setAddressData(data);
    setShowWarning(address && !chauffage);
  }, []);
  const handleOnFetch = useCallback(
    ({ address }) => {
      const { chauffage }: any = addressData;
      callMarkup__handleOnFetchAddress(address);
      setShowWarning(address && !chauffage);
    },
    [addressData]
  );
  const handleOnSuccessAddress = useCallback((data: any) => {
    const { address, chauffage, eligibility } = data;
    callMarkup__handleOnSuccessAddress({ eligibility, address });
    // TODO: Prefer context ?
    setAddressData(data);
    if (address && chauffage) {
      setContactReady(true);
    }
  }, []);

  const handleOnSubmitContact = useCallback((data: Record<string, any>) => {
    callMarkup__handleOnSubmitContact(data);
  }, []);
  const handleAfterSubmitContact = useCallback(() => {
    setMessageSent(true);
  }, []);

  return (
    <>
      <Slice>
        <Container>
          <>
            <EligibilityFormAddress
              onChange={handleOnChangeAddress}
              onFetch={handleOnFetch}
              onSuccess={handleOnSuccessAddress}
            />

            <FormWarningMessage show={showWarning}>
              {warningMessage}
            </FormWarningMessage>
          </>
        </Container>
      </Slice>

      <SliceContactFormStyle />

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
          afterSubmit={handleAfterSubmitContact}
        />
      </Slice>

      <Slice
        padding={5}
        theme="grey"
        className={`slice-contact-form-wrapper ${messageSent ? 'active' : ''}`}
      >
        <EligibilityFormMessageConfirmation />
      </Slice>
    </>
  );
};

export default HeadSlice;
