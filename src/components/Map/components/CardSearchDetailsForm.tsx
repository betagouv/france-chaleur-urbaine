import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import Box from '@components/ui/Box';
import Link from '@components/ui/Link';
import { useContactFormFCU } from '@hooks';
import React, { useCallback, useState } from 'react';
import {
  CardSearchDetailsFormStyle,
  ContactFormWrapper,
} from './CardSearchDetailsForm.style';

const CardSearchDetailsForm: React.FC<{
  fullAddress: any;
  onSubmit?: (data?: Record<string, any>) => void;
}> = ({ fullAddress, onSubmit }) => {
  const {
    EligibilityFormContactRef,
    addressData,
    contactReady,
    messageSent,
    messageReceived,
    handleOnChangeAddress,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
  } = useContactFormFCU();

  const [contactFormError, setContactFormError] = useState(false);
  const [formIsSend, setFormIsSend] = useState(false);

  const onSuccess = useCallback(
    // Notification of success is done directly when receving the result, because of the heatingtype late asking
    (data: any) => handleOnSuccessAddress(data, true, true),
    [handleOnSuccessAddress]
  );
  const handleSubmitForm = async (data: Record<string, any>) => {
    try {
      setContactFormError(false);
      await handleOnSubmitContact(data, true);
      onSubmit?.(data);
      setFormIsSend(true);
    } catch (err) {
      setContactFormError(true);
    }
  };

  return (
    <>
      <ContactFormWrapper active={!formIsSend}>
        <EligibilityFormAddress
          heatingLabel="Mode de chauffage actuel :"
          fullAddress={fullAddress}
          onChange={handleOnChangeAddress}
          onFetch={handleOnFetchAddress}
          onSuccess={onSuccess}
          cardMode
        />
      </ContactFormWrapper>

      <CardSearchDetailsFormStyle />
      <div ref={EligibilityFormContactRef}>
        <ContactFormWrapper active={contactReady && !messageReceived}>
          <EligibilityFormContact
            addressData={addressData}
            isSent={messageSent}
            onSubmit={handleSubmitForm}
            cardMode
          />
          {contactFormError && (
            <Box textColor="#c00" mt="1w">
              Une erreur est survenue. Veuillez réessayer ou bien{' '}
              <Link href="/contact">contacter le support</Link>.
            </Box>
          )}
        </ContactFormWrapper>

        <ContactFormWrapper active={messageReceived}>
          <EligibilityFormMessageConfirmation
            addressData={addressData}
            cardMode
          />
        </ContactFormWrapper>
      </div>
    </>
  );
};

export default CardSearchDetailsForm;
