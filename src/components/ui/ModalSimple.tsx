import { type PropsWithChildren, useCallback, useMemo, useState, createContext, useContext } from 'react';

import Modal, { createModal } from './Modal';

type ModalSimpleProps = PropsWithChildren<{
  title: string;
  trigger: React.ReactNode;
  size?: React.ComponentProps<typeof Modal>['size'];
  onClose?: () => void;
  onOpen?: () => void;
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
const ModalSimple = ({ children, trigger, title, size = 'medium', onClose, onOpen }: ModalSimpleProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  const modal = useMemo(() => {
    if (!isInitialized) return null;
    return createModal({
      id: `modal-${Math.random().toString(36).slice(2)}`,
      isOpenedByDefault: true,
    });
  }, [isInitialized]);

  const handleTriggerClick = useCallback(() => {
    setIsInitialized(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsInitialized(false);
    onClose?.();
  }, [onClose]);

  const contextValue = useMemo(
    () => ({
      closeModal: handleClose,
    }),
    [handleClose]
  );

  return (
    <>
      <div onClick={handleTriggerClick}>{trigger}</div>
      {modal && (
        <Modal modal={modal} title={title} size={size} onClose={handleClose} onOpen={onOpen}>
          <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>
        </Modal>
      )}
    </>
  );
};

export default ModalSimple;
