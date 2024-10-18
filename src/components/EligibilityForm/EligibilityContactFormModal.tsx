import EligibilityContactForm from '@components/EligibilityForm/EligibilityContactForm';
import Modal, { createModal } from '@components/ui/Modal';

export { useIsModalOpen } from '@components/ui/Modal';
export const modal = createModal({
  id: 'contact-form-modal',
  isOpenedByDefault: false,
});

const EligibilityContactFormModal: typeof EligibilityContactForm = (props) => {
  return (
    <Modal modal={modal} title="Être mis en relation">
      <EligibilityContactForm {...props} />
    </Modal>
  );
};

export default EligibilityContactFormModal;
