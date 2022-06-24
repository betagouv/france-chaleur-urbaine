import {
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import Slice from '@components/Slice';
import { useContactFormFCU } from '@hooks';
import React, { useEffect } from 'react';
import { SliceContactFormStyle } from './MapContactForm.style';

const MapContactForm: React.FC<{ addressData: any }> = ({
  addressData: addressDataProps,
}) => {
  const {
    EligibilityFormContactRef,
    addressData,
    messageSent,
    handleOnSubmitContact,
    resetContactFormFCU,
  } = useContactFormFCU();

  useEffect(() => {
    resetContactFormFCU(addressDataProps);
  }, [addressDataProps, resetContactFormFCU]);

  if (!addressData) return null;

  return (
    <>
      <SliceContactFormStyle />

      <div ref={EligibilityFormContactRef}>
        <Slice
          padding={5}
          theme="grey"
          className={`slice-contact-form-wrapper ${
            !messageSent ? 'active' : ''
          }`}
        >
          <EligibilityFormContact
            addressData={{ ...addressData }}
            onSubmit={handleOnSubmitContact}
            forceMobile
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

export default MapContactForm;
