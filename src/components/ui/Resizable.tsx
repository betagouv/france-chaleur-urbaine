'use client';

import * as ResizablePrimitive from 'react-resizable-panels';

import Icon from '@/components/ui/Icon';
import cx from '@/utils/cx';

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.Group>) => (
  <ResizablePrimitive.Group className={cx('flex h-full w-full', className)} {...props} />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle = true,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.Separator
    className={cx(
      'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[orientation=vertical]:h-px aria-[orientation=vertical]:w-full aria-[orientation=vertical]:after:left-0 aria-[orientation=vertical]:after:h-1 aria-[orientation=vertical]:after:w-full aria-[orientation=vertical]:after:-translate-y-1/2 aria-[orientation=vertical]:after:translate-x-0 [&[aria-orientation=vertical]>div]:rotate-90',
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border">
        <Icon name="ri-expand-left-right-line" size="xs" />
      </div>
    )}
  </ResizablePrimitive.Separator>
);

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
