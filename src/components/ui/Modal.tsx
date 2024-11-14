import { createModal as createdDSFRModal } from '@codegouvfr/react-dsfr/Modal';
import dynamic from 'next/dynamic';
import React from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';

export { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';

type CreateModal = ReturnType<typeof createdDSFRModal>;
type ModalProps = Omit<React.ComponentProps<CreateModal['Component']>, 'size'> & {
  modal: CreateModal;
  size?: React.ComponentProps<CreateModal['Component']>['size'] | 'custom';
};

export const StyledModal = styled.div<{ customSize?: boolean }>`
  ${({ customSize }) =>
    customSize &&
    css`
      // Surcharge la disposition par défaut qui est prédéfinie et statique
      // afin d'avoir plus de contrôle sur la largeur de la modal
      // cf https://github.com/codegouvfr/react-dsfr/blob/35557b500126b4876737aeca8af1fd36e3a9e86b/src/Modal/Modal.tsx#L83-L90

      // force la classe fr-col-12 plutôt que fr-col-md-6
      & .fr-container-md .fr-col-12 {
        flex: 0 0 100% !important;
        max-width: 100% !important;
        width: 100% !important;
      }
    `}
`;

/**
 * Create a modal within a portal that is rendered outside the components tree.
 */
const Modal = ({ modal, size, ...props }: ModalProps) => {
  return createPortal(
    <StyledModal customSize={size === 'custom'}>
      <modal.Component size={size !== 'custom' ? size : undefined} {...props} />
    </StyledModal>,
    document.body
  );
};

// Dynamically import Modal to optimize loading
export default dynamic(() => Promise.resolve(Modal as React.ComponentType<ModalProps>), { ssr: false });

export const createModal = createdDSFRModal;
