import { useCallback } from 'react';

import { EligibilityFormAddress, EligibilityFormContact } from '@/components/EligibilityForm';
import { FormWarningMessage, SliceContactFormStyle } from '@/components/HeadSliceForm/HeadSliceForm.style';
import Box from '@/components/ui/Box';
import Loader from '@/components/ui/Loader';
import Modal, { createModal } from '@/components/ui/Modal';
import useContactFormFCU, { type ContactFormContext } from '@/hooks/useContactFormFCU';
import DemandSubmittedPanel from '@/modules/demands/client/public-forms/DemandSubmittedPanel';
import type { AddressDataType } from '@/types/AddressData';

import { Container, Title } from './StickyForm.styles';

const eligibilityTestModal = createModal({
  id: 'eligibility-test-sticky-form-modal',
  isOpenedByDefault: false,
});

const StickyForm = ({ context, title }: { title?: string; context?: ContactFormContext }) => {
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

  const handleSuccessAddressWithContext = useCallback(
    (data: AddressDataType) => {
      return handleOnSuccessAddress(data, context);
    },
    [context, handleOnSuccessAddress]
  );

  return (
    <>
      <SliceContactFormStyle />
      <Container>
        <Title className="sticky-form-title">{title || 'Votre bâtiment est-il raccordable à un réseau de chaleur ?'}</Title>
        <EligibilityFormAddress
          onChange={handleOnChangeAddress}
          onFetch={handleOnFetchAddress}
          onSuccess={handleSuccessAddressWithContext}
          heatingLabel={<>Mode de chauffage actuel&nbsp;:</>}
        />
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
        <Box position="relative" width="100%">
          {contactReady && !messageReceived && (
            <EligibilityFormContact addressData={addressData} onSubmit={(data) => handleOnSubmitContact(data, context)} />
          )}
          {messageReceived && addressData.submissionResult && <DemandSubmittedPanel submissionResult={addressData.submissionResult} />}
        </Box>
      </Modal>
    </>
  );
};

export default StickyForm;
