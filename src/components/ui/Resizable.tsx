'use client';

import { Group, Separator } from 'react-resizable-panels';

import Icon from '@/components/ui/Icon';
import cx from '@/utils/cx';

export { Panel as ResizablePanel } from 'react-resizable-panels';

// import { Group, Separator } from 'react-resizable-panels';

export const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof Group>) => (
  <Group className={cx('flex h-full w-full', className)} {...props} />
);

export const ResizableSeparator = ({ className, ...props }: React.ComponentProps<typeof Separator>) => (
  <Separator
    {...props}
    className={cx(
      "group relative flex items-center justify-center bg-transparent outline-none data-[separator='disabled']:opacity-50 text-neutral-400 data-[separator='hover']:text-neutral-500 data-[separator='active']:text-neutral-500 w-4 sm:w-3 before:absolute before:inset-y-0 before:w-0.5 before:bg-neutral-300 data-[separator='hover']:before:bg-neutral-400 data-[separator='active']:before:bg-neutral-400 focus-visible:before:bg-neutral-400",
      className
    )}
  >
    <Icon
      name="ri-expand-left-right-line"
      className="relative z-10 text-sm bg-white rounded-md ring-2 ring-neutral-300 text-neutral-400 group-data-[separator='hover']:ring-neutral-400 group-data-[separator='hover']:text-neutral-500 group-data-[separator='active']:ring-neutral-400 group-data-[separator='active']:text-neutral-500"
    />
  </Separator>
);
