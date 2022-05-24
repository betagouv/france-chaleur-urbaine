import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import markupData, { facebookEvent, matomoEvent } from '@components/Markup';
import Slice from '@components/Slice';
import React, { useState } from 'react';
import {
  Container,
  FormWarningMessage,
  SliceContactFormStyle,
} from './SliceForm.style';

const HeadSlice: React.FC = () => {
  const [contactReady, setContactReady] = useState(false);
  const [addressData, setAddressData] = useState({});
  const updateContactData = (data: any) => {
    setAddressData(data);
    const { address, chauffage } = data;
    if (address && chauffage) {
      setContactReady(true);
    }
  };

  const [messageSent, setMessageSent] = useState(false);
  const handleOnSubmit = (data: Record<string, any>) => {
    const { estEligible: eligibility, address } = data;
    const markupEligibilityKey = eligibility
      ? 'contactFormEligible'
      : 'contactFormIneligible';
    matomoEvent(markupData[markupEligibilityKey].matomoEvent, [address]);
    facebookEvent(markupData[markupEligibilityKey].facebookEvent);
  };
  const handleAfterSubmit = () => {
    setMessageSent(true);
  };

  const warningMessage = "N'oubliez pas d'indiquer votre type de chauffage.";
  const [showWarning, setShowWarning] = useState(false);

  return (
    <>
      <Slice>
        <Container>
          <>
            <EligibilityFormAddress
              onChange={(data) => {
                const { address, chauffage } = data;
                setAddressData(data);
                setShowWarning(address && !chauffage);
              }}
              onFetch={(address) => {
                const { chauffage }: any = addressData;
                setShowWarning(address && !chauffage);
              }}
              onSuccess={(data) => {
                // TODO: Prefer context ?
                updateContactData(data);
              }}
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
          onSubmit={handleOnSubmit}
          afterSubmit={handleAfterSubmit}
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
