import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import {
  FormWarningMessage,
  Loader,
  LoaderWrapper,
  SliceContactFormStyle,
} from '@components/HeadSliceForm/HeadSliceForm.style';
import Slice from '@components/Slice';
import { useContactFormFCU } from '@hooks';
import { Close, Container, Form, Title } from './StickyForm.styles';
import Box from '@components/ui/Box';
import Icon from '@components/ui/Icon';

const StickyForm = ({ title }: { title?: string }) => {
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
    handleResetFormContact,
  } = useContactFormFCU();

  return (
    <Container>
      <Title className="sticky-form-title">
        {title || 'Votre bâtiment est-il raccordable à un réseau de chaleur ?'}
      </Title>
      <EligibilityFormAddress
        onChange={handleOnChangeAddress}
        onFetch={handleOnFetchAddress}
        onSuccess={handleOnSuccessAddress}
      />
      {showWarning && (
        <FormWarningMessage show>{warningMessage}</FormWarningMessage>
      )}

      {!showWarning && loadingStatus === 'loading' && (
        <Box className="fr-col-12">
          <LoaderWrapper show>
            <Loader color="balck" />
          </LoaderWrapper>
        </Box>
      )}

      <SliceContactFormStyle />
      <Form ref={EligibilityFormContactRef}>
        {(contactReady || messageReceived) && (
          <Close onClick={handleResetFormContact}>
            <Icon name="ri-close-line" size="lg" />
          </Close>
        )}
        <Slice
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
      </Form>
    </Container>
  );
};

export default StickyForm;
