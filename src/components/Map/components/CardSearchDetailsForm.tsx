import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import { useContactFormFCU } from '@hooks';
import React, { useState } from 'react';
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

  const [formIsSend, setFormIsSend] = useState(false);

  const handleSubmitForm = (data: Record<string, any>) => {
    handleOnSubmitContact(data);
    onSubmit?.(data);
    setFormIsSend(true);
  };

  return (
    <>
      <div>
        <ContactFormWrapper active={!formIsSend}>
          <EligibilityFormAddress
            heatingLabel="Mode de chauffage actuel"
            fullAddress={fullAddress}
            onChange={handleOnChangeAddress}
            onFetch={handleOnFetchAddress}
            onSuccess={handleOnSuccessAddress}
          />
        </ContactFormWrapper>
      </div>

      <CardSearchDetailsFormStyle />
      <div ref={EligibilityFormContactRef}>
        <ContactFormWrapper active={contactReady && !messageReceived}>
          <EligibilityFormContact
            addressData={addressData}
            isSent={messageSent}
            onSubmit={handleSubmitForm}
            cardMode
          />
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
