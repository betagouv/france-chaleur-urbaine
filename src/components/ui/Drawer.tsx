import * as Dialog from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';

import cx from '@/utils/cx';

import Icon from './Icon';

type DrawerProps = {
  children: React.ReactNode;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  onClose?: (event?: React.SyntheticEvent) => void;
  open: boolean;
  className?: string;
  full?: boolean;
};

const drawerContentVariants = cva('fixed bg-white shadow-lg overflow-y-auto z-[1750]', {
  // 1750 is same as modal
  variants: {
    anchor: {
      left: 'top-0 left-0 bottom-0 max-w-[80vw] h-full',
      right: 'top-0 right-0 bottom-0 max-w-[80vw] h-full',
      top: 'top-0 left-0 right-0 max-h-[80vh] w-full',
      bottom: 'bottom-0 left-0 right-0 max-h-[80vh] w-full',
    },
  },
  defaultVariants: {
    anchor: 'right',
  },
});

const Drawer = ({ children, open, onClose, anchor = 'right', className, full = false }: DrawerProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose?.()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className={cx(drawerContentVariants({ anchor }), full ? 'w-full max-w-none' : className)}>
          <div className="text-right p-3">
            <Icon name="fr-icon-close-line" size="lg" onClick={onClose} className="cursor-pointer hover:opacity-70 inline-block" />
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Drawer;
