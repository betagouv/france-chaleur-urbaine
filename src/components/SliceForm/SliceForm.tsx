import { EligibilityFormAddress, EligibilityFormContact, EligibilityFormMessageConfirmation } from '@components/EligibilityForm';
import { FormLabel } from '@components/HeadSliceForm/HeadSliceForm.style';
import Slice from '@components/Slice';
import Loader from '@components/ui/Loader';
import Modal, { createModal } from '@components/ui/Modal';
import { useContactFormFCU } from '@hooks';

import { Container, Form, FormWarningMessage, SliceContactFormStyle } from './SliceForm.style';

const eligibilityTestModal = createModal({
  id: 'eligibility-test-slice-form-modal',
  isOpenedByDefault: false,
});

const SliceForm = ({ title, colored }: { title?: string; colored?: boolean }) => {
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
      <Slice>
        <Container>
          <EligibilityFormAddress
            colored={colored}
            formLabel={<FormLabel colored={colored}>{title || 'Votre immeuble pourrait-il être raccordé ?'}</FormLabel>}
            onChange={handleOnChangeAddress}
            onFetch={handleOnFetchAddress}
            onSuccess={handleOnSuccessAddress}
          />

          {showWarning && <FormWarningMessage show>{warningMessage}</FormWarningMessage>}
          {loadingStatus === 'loading' && <Loader size="md" />}
        </Container>
      </Slice>

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

export default SliceForm;
