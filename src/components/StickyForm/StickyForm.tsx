import { EligibilityFormAddress, EligibilityFormContact, EligibilityFormMessageConfirmation } from '@components/EligibilityForm';
import { FormWarningMessage, SliceContactFormStyle } from '@components/HeadSliceForm/HeadSliceForm.style';
import Slice from '@components/Slice';
import Loader from '@components/ui/Loader';
import Modal, { createModal } from '@components/ui/Modal';
import { useContactFormFCU } from '@hooks';

import { Container, Form, Title } from './StickyForm.styles';

const eligibilityTestModal = createModal({
  id: 'eligibility-test-modal',
  isOpenedByDefault: false,
});

const StickyForm = ({ title }: { title?: string }) => {
  const {
    EligibilityFormContactRef,
    addressData,
    contactReady,
    showWarning,
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
      <Title className="sticky-form-title">{title || 'Votre bâtiment est-il raccordable à un réseau de chaleur ?'}</Title>
      <EligibilityFormAddress onChange={handleOnChangeAddress} onFetch={handleOnFetchAddress} onSuccess={handleOnSuccessAddress} />
      {showWarning && <FormWarningMessage show>{warningMessage}</FormWarningMessage>}

      <SliceContactFormStyle />
      {loadingStatus === 'loading' && <Loader size="md" />}
      <Modal
        modal={eligibilityTestModal}
        title="Tester une adresse"
        open={contactReady}
        size="custom"
        onClose={handleResetFormContact}
        loading={loadingStatus === 'loading'}
      >
        <Form ref={EligibilityFormContactRef}>
          <Slice theme="grey" className={`slice-contact-form-wrapper ${contactReady && !messageReceived ? 'active' : ''}`}>
            <EligibilityFormContact addressData={addressData} onSubmit={handleOnSubmitContact} />
          </Slice>

          <Slice padding={5} theme="grey" className={`slice-contact-form-wrapper ${messageReceived ? 'active' : ''}`}>
            <EligibilityFormMessageConfirmation addressData={addressData} />
          </Slice>
        </Form>
      </Modal>
    </Container>
  );
};

export default StickyForm;
