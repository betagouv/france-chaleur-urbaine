import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import Slice from '@components/Slice';
import { useContactFormFCU } from '@hooks';
import React from 'react';
import {
  Container,
  FormWarningMessage,
  Loader,
  LoaderWrapper,
  SliceContactFormStyle,
} from './SliceForm.style';

const HeadSlice: React.FC = () => {
  const {
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
  } = useContactFormFCU();

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
