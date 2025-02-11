import { useMemo } from 'react';

import EligibilityContactForm, { type EligibilityContactFormProps } from '@/components/EligibilityForm/EligibilityContactForm';
import Modal, { createModal, useIsModalOpen } from '@/components/ui/Modal';

type EligibilityFormProps = {
  id: string;
  address: EligibilityContactFormProps['fullAddress'];
  onSubmit?: EligibilityContactFormProps['onSubmit'];
};

const useEligibilityForm = ({ id, address, onSubmit }: EligibilityFormProps) => {
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
        <EligibilityContactForm fullAddress={address} onSubmit={onSubmit} />
      </Modal>
    ),
  };
};

export default useEligibilityForm;
