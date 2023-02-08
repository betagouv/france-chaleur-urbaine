import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import { FormLabel } from '@components/HeadSliceForm/HeadSliceForm.style';
import Slice from '@components/Slice';
import { useContactFormFCU } from '@hooks';
import {
  Container,
  FormWarningMessage,
  Loader,
  LoaderWrapper,
  SliceContactFormStyle,
} from './SliceForm.style';

const HeadSlice = ({
  title,
  colored,
}: {
  title?: string;
  colored?: boolean;
}) => {
  const {
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
  } = useContactFormFCU();

  return (
    <>
      <Slice>
        <Container>
          <EligibilityFormAddress
            colored={colored}
            formLabel={
              <FormLabel colored={colored}>
                {title || 'Votre immeuble pourrait-il être raccordé ?'}
              </FormLabel>
            }
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
        </Container>
      </Slice>

      <SliceContactFormStyle />
      <div ref={EligibilityFormContactRef}>
        <Slice
          padding={5}
          theme="grey"
          className={`slice-contact-form-wrapper ${
            contactReady && !messageReceived ? 'active' : ''
          }`}
        >
          <EligibilityFormContact
            addressData={addressData}
            isSent={messageSent}
            onSubmit={handleOnSubmitContact}
          />
        </Slice>

        <Slice
          padding={5}
          theme="grey"
          className={`slice-contact-form-wrapper ${
            messageReceived ? 'active' : ''
          }`}
        >
          <EligibilityFormMessageConfirmation addressData={addressData} />
        </Slice>
      </div>
    </>
  );
};

export default HeadSlice;
