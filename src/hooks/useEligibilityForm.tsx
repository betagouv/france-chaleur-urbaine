import { useMemo } from 'react';

import EligibilityContactForm, { type EligibilityContactFormProps } from '@/components/EligibilityForm/EligibilityContactForm';
import Modal, { createModal, useIsModalOpen } from '@/components/ui/Modal';
import { type ContactFormContext } from '@/hooks/useContactFormFCU';

type EligibilityFormProps = {
  id: string;
  address: EligibilityContactFormProps['fullAddress'];
  onSubmit?: EligibilityContactFormProps['onSubmit'];
  context?: ContactFormContext;
};

const useEligibilityForm = ({ id, address, onSubmit, context }: EligibilityFormProps) => {
  const modal = useMemo(() => {
    return createModal({
      id,
      isOpenedByDefault: false,
    });
  }, []);

  const isVisible = useIsModalOpen(modal);

  return {
    isVisible,
    ...modal,
    EligibilityFormModal: () => (
      <Modal modal={modal} title="Être mis en relation">
        <EligibilityContactForm fullAddress={address} onSubmit={onSubmit} context={context} />
      </Modal>
    ),
  };
};

export default useEligibilityForm;
