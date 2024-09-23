import { createModal as createdDSFRModal } from '@codegouvfr/react-dsfr/Modal';
import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

export { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';

type CreateModal = ReturnType<typeof createdDSFRModal>;

export const StyledModal = styled.div`
  // Surcharge la disposition par défaut qui est prédéfinie et statique
  // afin d'avoir plus de contrôle sur la largeur de la modal
  // cf https://github.com/codegouvfr/react-dsfr/blob/35557b500126b4876737aeca8af1fd36e3a9e86b/src/Modal/Modal.tsx#L83-L90

  // force la classe fr-col-12 plutôt que fr-col-md-6
  & .fr-container-md .fr-col-12 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
    width: 100% !important;
  }
`;

export const createModal = createdDSFRModal;
/**
 * Create a modal within a portal that is rendered outside the components tree.
 */
export default function Modal({ modal, ...props }: { modal: CreateModal } & React.ComponentProps<CreateModal['Component']>) {
  return createPortal(
    <StyledModal>
      <modal.Component {...props} />
    </StyledModal>,
    document.body
  );
}
