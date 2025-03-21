import { createContext, type MouseEvent, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import Modal, { createModal } from './Modal';

type ModalSimpleProps = PropsWithChildren<{
  trigger: React.ReactNode;
  title: string;
  size?: React.ComponentProps<typeof Modal>['size'];
}>;

type ModalContextType = {
  closeModal: () => void;
} | null;

const ModalContext = createContext<ModalContextType>(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalSimple component');
  }
  return context;
};

/**
 * ModalSimple is a modal component that is only mounted in the DOM when opened.
 * This lazy loading approach improves initial page performance by not rendering unused modals.
 * The modal is created when the trigger is clicked and destroyed when closed.
 */
const ModalSimple = ({ children, trigger, title, size = 'medium' }: ModalSimpleProps) => {
  const [isOpen, setOpen] = useState(false);

  const modal = useMemo(() => {
    if (!isOpen) return null;
    return createModal({
      id: `modal-${Math.random().toString(36).slice(2)}`,
      isOpenedByDefault: false,
    });
  }, [isOpen]);

  const handleTriggerClick = useCallback((e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    // prevent propagation in case the modal is inside another button
    e.stopPropagation();
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      closeModal: handleClose,
    }),
    [handleClose]
  );

  return (
    <>
      <div onClickCapture={handleTriggerClick}>{trigger}</div>
      {modal && (
        <Modal modal={modal} title={title} size={size} open={isOpen} onClose={handleClose}>
          <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>
        </Modal>
      )}
    </>
  );
};

export default ModalSimple;
