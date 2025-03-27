import { fr } from '@codegouvfr/react-dsfr';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import React, { createContext, type PropsWithChildren, useContext, useMemo } from 'react';

import cx from '@/utils/cx';

export type DialogProps = PropsWithChildren<{
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

type DialogContextType = {
  closeDialog: () => void;
} | null;

const DialogContext = createContext<DialogContextType>(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog component');
  }
  return context;
};

const Dialog = ({ children, trigger, title, description, size = 'md', open, onOpenChange }: DialogProps) => {
  const handleClose = () => {
    onOpenChange?.(false);
  };

  const contextValue = useMemo(
    () => ({
      closeDialog: handleClose,
    }),
    [handleClose]
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content asChild>
          <motion.div
            className={cx(
              'fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full transform overflow-auto bg-white p-8 shadow-xl',
              size === 'sm' && 'max-w-sm',
              size === 'md' && 'max-w-lg',
              size === 'lg' && 'max-w-4xl'
            )}
            initial={{ opacity: 0, y: -10, x: '-50%', translateY: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%', translateY: '-50%' }}
            exit={{ opacity: 0, y: -10, x: '-50%', translateY: '-50%' }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-4">
              {title && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogPrimitive.Title className="fr-modal__title">{title}</DialogPrimitive.Title>
                    {description && <DialogPrimitive.Description className="mt-1 text-gray-600">{description}</DialogPrimitive.Description>}
                  </div>
                  <DialogPrimitive.Close asChild>
                    <button type="button" className={fr.cx('fr-btn--close', 'fr-btn')}>
                      Fermer
                    </button>
                  </DialogPrimitive.Close>
                </div>
              )}
              <DialogContext.Provider value={contextValue}>
                <div className="flex-1">{children}</div>
              </DialogContext.Provider>
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

Dialog.displayName = 'Dialog';

export default Dialog;
