import { cva } from 'class-variance-authority';
import { Drawer as DrawerVaul, type DialogProps } from 'vaul'; // Use vaul instead of @radix-ui/react-dialog because it does not do nice transitions

import cx from '@/utils/cx';

import Icon from './Icon';

type DrawerProps = DialogProps & {
  children: React.ReactNode;
  className?: string;
  full?: boolean;
};

const drawerContentVariants = cva('bg-white h-full fixed outline-none z-[1750] flex flex-col ', {
  // 1750 is same as modal
  variants: {
    direction: {
      left: 'top-0 left-0 bottom-0 max-w-[80vw] h-full',
      right: 'top-0 right-0 bottom-0 max-w-[80vw] h-full',
      top: 'top-0 left-0 right-0 max-h-[80vh] w-full',
      bottom: 'bottom-0 left-0 right-0 max-h-[80vh] w-full',
    },
    full: {
      true: 'w-full max-w-none',
      false: 'h-full max-h-none',
    },
  },
  defaultVariants: {
    direction: 'right',
    full: false,
  },
});

const Drawer = ({ children, open, onClose, direction = 'right', className, full = false, handleOnly = false, ...props }: DrawerProps) => {
  const orientation = direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical';

  return (
    <DrawerVaul.Root open={open} onOpenChange={(open) => !open && onClose?.()} direction={direction} handleOnly={handleOnly} {...props}>
      <DrawerVaul.Portal>
        <DrawerVaul.Overlay className="fixed inset-0 bg-black/40 z-[1750]" />
        <DrawerVaul.Content className={cx(drawerContentVariants({ direction, full }), className)}>
          <div className="text-right px-3 pt-3">
            <Icon name="fr-icon-close-line" size="lg" onClick={onClose} className="cursor-pointer hover:opacity-70 inline-block" />
          </div>
          {!props.dismissible && (
            <DrawerVaul.Handle
              className={cx(
                '!mx-0 absolute', // override default values which prevent right positioning
                'flex-shrink-0 rounded-full bg-zinc-300 cursor-grab',
                orientation === 'horizontal' ? '!w-1.5 !h-12 top-1/2 -translate-y-1/2' : '!w-12 !h-1.5 left-1/2 -translate-x-1/2',
                direction === 'right' ? 'left-1.5' : direction === 'left' ? 'right-1.5' : direction === 'bottom' ? 'top-1.5' : 'bottom-1.5'
              )}
            />
          )}
          <div className="flex-1 px-3 pb-3 overflow-y-auto ">{children}</div>
        </DrawerVaul.Content>
      </DrawerVaul.Portal>
    </DrawerVaul.Root>
  );
};

export default Drawer;
