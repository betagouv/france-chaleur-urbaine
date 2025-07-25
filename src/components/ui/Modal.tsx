import { createModal as createdDSFRModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen as useIsDSFRModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { usePrevious } from '@react-hookz/web';
import dynamic from 'next/dynamic';
import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';

import Loader from './Loader';
export const useIsModalOpen = useIsDSFRModalOpen;

type CreateModal = ReturnType<typeof createdDSFRModal>;
type ModalProps = Omit<React.ComponentProps<CreateModal['Component']>, 'size'> & {
  modal: CreateModal;
  size?: React.ComponentProps<CreateModal['Component']>['size'] | 'custom';
  lazy?: boolean;
} & {
  onClose?: NonNullable<Parameters<typeof useIsDSFRModalOpen>[1]>['onDisclose'];
  onOpen?: NonNullable<Parameters<typeof useIsDSFRModalOpen>[1]>['onConceal'];
  open?: boolean;
  loading?: boolean;
};

export const StyledModal = styled.div<{ customSize?: boolean }>`
  .fr-modal__title:empty {
    display: none;
  }
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
const Modal = ({ modal, size, onOpen, loading, onClose, open, lazy = false, children, ...props }: ModalProps) => {
  const [isFirstLoad, setIsFirstLoad] = React.useState(true);
  const previousOpen = usePrevious(open);
  const isOpened = useIsModalOpen(modal, {
    onDisclose: onOpen,
    onConceal: () => {
      // On first load, React DSFR is launching an onConceal event
      // This is incompatible with the onClose event when modal is opened by default
      if (isFirstLoad && !previousOpen) {
        setIsFirstLoad(false);
        return;
      }
      setIsFirstLoad(false);
      onClose?.();
    },
  });

  React.useEffect(() => {
    if (!modal || open === previousOpen) {
      return;
    }

    if (open && !isOpened) {
      setTimeout(() => {
        // modal might not be initialized yet, this is a hack to make sure it is
        modal.open();
      }, 0);
    } else if (!open && isOpened) {
      setTimeout(() => {
        // modal might not be initialized yet, this is a hack to make sure it is
        modal.close();
      }, 0);
    }
  }, [open, modal, isOpened, previousOpen]);

  const preventPropagationClick = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
  }, []);

  return createPortal(
    <StyledModal customSize={size === 'custom'} onClick={preventPropagationClick}>
      <modal.Component size={size !== 'custom' ? size : undefined} {...props}>
        {loading && <Loader size="lg" variant="section" />}
        {(!lazy || isOpened) && children}
      </modal.Component>
    </StyledModal>,
    document.body
  );
};

// Dynamically import Modal to optimize loading
export default dynamic(() => Promise.resolve(Modal as React.ComponentType<ModalProps>), { ssr: false });

export const createModal = createdDSFRModal;
