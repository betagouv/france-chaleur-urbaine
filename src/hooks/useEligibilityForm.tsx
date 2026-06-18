import { useCallback, useMemo, useRef } from 'react';

import EligibilityContactForm, { type EligibilityContactFormProps } from '@/components/EligibilityForm/EligibilityContactForm';
import Modal, { createModal, useIsModalOpen } from '@/components/ui/Modal';
import type { ContactFormContext } from '@/hooks/useContactFormFCU';

type EligibilityFormProps = {
  id: string;
  address: EligibilityContactFormProps['fullAddress'];
  initialHeatingType?: EligibilityContactFormProps['initialHeatingType'];
  onSubmit?: EligibilityContactFormProps['onSubmit'];
  context?: ContactFormContext;
};

const useEligibilityForm = ({ id, address, initialHeatingType, onSubmit, context }: EligibilityFormProps) => {
  const modal = useMemo(() => {
    return createModal({
      id,
      isOpenedByDefault: false,
    });
  }, []);

  const isVisible = useIsModalOpen(modal);

  // Identité stable obligatoire : sinon le re-render de `useIsModalOpen` à l'ouverture remonte le
  // <dialog> DSFR, qui repart fermé (double-clic). Props lues via ref car la dépendance est figée à [modal].
  const formPropsRef = useRef({ address, context, initialHeatingType, onSubmit });
  formPropsRef.current = { address, context, initialHeatingType, onSubmit };

  const EligibilityFormModal = useCallback(
    () => (
      <Modal modal={modal} title="Être mis en relation">
        <EligibilityContactForm
          fullAddress={formPropsRef.current.address}
          initialHeatingType={formPropsRef.current.initialHeatingType}
          onSubmit={formPropsRef.current.onSubmit}
          context={formPropsRef.current.context}
        />
      </Modal>
    ),
    [modal]
  );

  return {
    isVisible,
    ...modal,
    EligibilityFormModal,
  };
};

export default useEligibilityForm;
