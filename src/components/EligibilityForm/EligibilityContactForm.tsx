import React, { useCallback, useState } from 'react';

import { EligibilityFormAddress, EligibilityFormContact, EligibilityFormMessageConfirmation } from '@/components/EligibilityForm';
import Box from '@/components/ui/Box';
import Link from '@/components/ui/Link';
import useContactFormFCU, { type ContactFormContext } from '@/hooks/useContactFormFCU';

import { ContactFormWrapper, EligibilityContactFormStyle } from './EligibilityContactForm.style';

export type EligibilityContactFormProps = {
  fullAddress: any;
  initialHeatingType?: string;
  onSubmit?: (data?: Record<string, any>) => void;
  context?: ContactFormContext;
};

const EligibilityContactForm: React.FC<EligibilityContactFormProps> = ({ fullAddress, initialHeatingType, onSubmit, context }) => {
  const {
    addressData,
    contactReady,
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
    (data: any) => handleOnSuccessAddress(data, context, { doTrackEvent: false }),
    [handleOnSuccessAddress]
  );
  const handleSubmitForm = async (data: Record<string, any>) => {
    try {
      setContactFormError(false);
      await handleOnSubmitContact(data, context);
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
          initialHeatingType={initialHeatingType}
          onChange={handleOnChangeAddress}
          onFetch={handleOnFetchAddress}
          onSuccess={onSuccess}
          cardMode
        />
      </ContactFormWrapper>

      <EligibilityContactFormStyle />
      <div>
        <ContactFormWrapper active={contactReady && !messageReceived}>
          <EligibilityFormContact addressData={addressData} onSubmit={handleSubmitForm} cardMode />
          {contactFormError && (
            <Box textColor="#c00" mt="1w">
              Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
            </Box>
          )}
        </ContactFormWrapper>

        <ContactFormWrapper active={messageReceived}>
          <EligibilityFormMessageConfirmation addressData={addressData} cardMode />
        </ContactFormWrapper>
      </div>
    </>
  );
};

export default EligibilityContactForm;
