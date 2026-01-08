import { EligibilityFormAddress, EligibilityFormContact } from '@/components/EligibilityForm';
import { FormLabel } from '@/components/HeadSliceForm/HeadSliceForm.style';
import Slice from '@/components/Slice';
import Box from '@/components/ui/Box';
import Loader from '@/components/ui/Loader';
import Modal, { createModal } from '@/components/ui/Modal';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import DemandSondageForm from '@/modules/demands/client/DemandSondageForm';

import { Container, FormWarningMessage, SliceContactFormStyle } from './SliceForm.style';

const eligibilityTestModal = createModal({
  id: 'eligibility-test-slice-form-modal',
  isOpenedByDefault: false,
});

const SliceForm = ({ title, colored }: { title?: string; colored?: boolean }) => {
  const {
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
        <Box position="relative" width="100%">
          {contactReady && !messageReceived && <EligibilityFormContact addressData={addressData} onSubmit={handleOnSubmitContact} />}
          {messageReceived && <DemandSondageForm addressData={addressData} />}
        </Box>
      </Modal>
    </>
  );
};

export default SliceForm;
