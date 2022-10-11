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
import { Col } from '@dataesr/react-dsfr';
import { useContactFormFCU } from '@hooks';
import { Container, Title } from './StickyForm.styles';

const StickyForm = () => {
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
    <Container>
      <Title>Votre bâtiment est-il raccordable à un réseau de chaleur ?</Title>
      <EligibilityFormAddress
        onChange={handleOnChangeAddress}
        onFetch={handleOnFetchAddress}
        onSuccess={handleOnSuccessAddress}
      />
      {showWarning && (
        <FormWarningMessage show>{warningMessage}</FormWarningMessage>
      )}

      {!showWarning && loadingStatus === 'loading' && (
        <Col n="12">
          <LoaderWrapper show>
            <Loader color="balck" />
          </LoaderWrapper>
        </Col>
      )}

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
    </Container>
  );
};

export default StickyForm;
