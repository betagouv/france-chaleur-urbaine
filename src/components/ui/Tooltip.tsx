'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import Icon, { type IconProps } from '@/components/ui/Icon';
import cx from '@/utils/cx';

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipRoot = TooltipPrimitive.Root;

export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cx(
        'z-50 overflow-hidden shadow-lg rounded-sm bg-white px-3 py-1.5 text-xs text-black max-w-[300px] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export const TooltipWrapper: React.FC<React.ComponentProps<typeof TooltipProvider>> = ({ children, ...props }) => {
  return (
    <TooltipProvider {...props}>
      <TooltipRoot>{children}</TooltipRoot>
    </TooltipProvider>
  );
};

type TooltipProps = {
  title: React.ReactNode;
  children?: React.ReactNode;
  iconProps?: Partial<IconProps>;
  side?: TooltipPrimitive.TooltipContentProps['side'];
  sideOffset?: TooltipPrimitive.TooltipContentProps['sideOffset'];
  delayDuration?: TooltipPrimitive.TooltipProviderProps['delayDuration'];
  skipDelayDuration?: TooltipPrimitive.TooltipProviderProps['skipDelayDuration'];
};

const Tooltip = ({
  children,
  title,
  iconProps,
  side = 'top',
  sideOffset = 5,
  delayDuration = 200,
  skipDelayDuration = 500,
}: TooltipProps) => {
  return (
    <TooltipWrapper delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <TooltipTrigger asChild>{children ?? <Icon size="sm" name="ri-information-fill" cursor="help" {...iconProps} />}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset}>
        <div>
          {title} {JSON.stringify(iconProps || {})}
        </div>
        <TooltipPrimitive.Arrow className="fill-white" />
      </TooltipContent>
    </TooltipWrapper>
  );
};

export default Tooltip;
