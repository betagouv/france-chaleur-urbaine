import { EligibilityFormContact } from '@/components/EligibilityForm';
import Modal, { createModal } from '@/components/ui/Modal';
import DemandSubmittedPanel from '@/modules/demands/client/public-forms/DemandSubmittedPanel';

import type { useEligibilityTest } from './hooks/useEligibilityTest';

const eligibilityContactModal = createModal({
  id: 'home-eligibility-contact-modal',
  isOpenedByDefault: false,
});

type EligibilityContactModalProps = Pick<
  ReturnType<typeof useEligibilityTest>,
  'addressData' | 'contactReady' | 'handleOnSubmitContact' | 'handleResetFormContact' | 'isLoading' | 'messageReceived'
>;

/**
 * Modal opened after an eligibility test: the contact form with the result, then the
 * confirmation panel once the demand is submitted.
 */
export function EligibilityContactModal({
  addressData,
  contactReady,
  handleOnSubmitContact,
  handleResetFormContact,
  isLoading,
  messageReceived,
}: EligibilityContactModalProps) {
  return (
    <Modal modal={eligibilityContactModal} title="" open={contactReady} size="custom" onClose={handleResetFormContact} loading={isLoading}>
      <div>
        {contactReady && !messageReceived && (
          <EligibilityFormContact addressData={addressData} onSubmit={handleOnSubmitContact} className="p-0" />
        )}
        {messageReceived && addressData.submissionResult && <DemandSubmittedPanel submissionResult={addressData.submissionResult} />}
      </div>
    </Modal>
  );
}
