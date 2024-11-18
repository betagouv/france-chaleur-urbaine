import { EligibilityFormAddress, EligibilityFormContact, EligibilityFormMessageConfirmation } from '@components/EligibilityForm';
import { FormWarningMessage, SliceContactFormStyle } from '@components/HeadSliceForm/HeadSliceForm.style';
import Loader from '@components/ui/Loader';
import Modal, { createModal } from '@components/ui/Modal';
import { useContactFormFCU } from '@hooks';

import { Container, Form, Title } from './StickyForm.styles';

const eligibilityTestModal = createModal({
  id: 'eligibility-test-sticky-form-modal',
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
    <>
      <SliceContactFormStyle />
      <Container>
        <Title className="sticky-form-title">{title || 'Votre bâtiment est-il raccordable à un réseau de chaleur ?'}</Title>
        <EligibilityFormAddress onChange={handleOnChangeAddress} onFetch={handleOnFetchAddress} onSuccess={handleOnSuccessAddress} />
        {showWarning && <FormWarningMessage show>{warningMessage}</FormWarningMessage>}

        {loadingStatus === 'loading' && <Loader size="md" />}
      </Container>

      <Modal
        modal={eligibilityTestModal}
        title=""
        open={contactReady}
        size="custom"
        onClose={handleResetFormContact}
        loading={loadingStatus === 'loading'}
      >
        <Form ref={EligibilityFormContactRef}>
          {contactReady && !messageReceived && <EligibilityFormContact addressData={addressData} onSubmit={handleOnSubmitContact} />}
          {messageReceived && <EligibilityFormMessageConfirmation addressData={addressData} />}
        </Form>
      </Modal>
    </>
  );
};

export default StickyForm;
