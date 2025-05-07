'use client';

import { Content, Portal, Provider, Root, type TooltipContentProps, Trigger } from '@radix-ui/react-tooltip';
import * as React from 'react';

import Icon, { type IconProps } from '@/components/ui/Icon';
import cx from '@/utils/cx';

export const TooltipTrigger = Trigger;

export const TooltipContent = React.forwardRef<React.ElementRef<typeof Content>, React.ComponentPropsWithoutRef<typeof Content>>(
  ({ className = 'max-w-[300px]', sideOffset = 4, ...props }, ref) => (
    <Portal>
      <Content
        ref={ref}
        sideOffset={sideOffset}
        className={cx(
          'z-[1751]', // one more than modal
          'overflow-hidden shadow-lg rounded-sm bg-white px-3 py-1.5 text-xs text-black  animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </Portal>
  )
);
TooltipContent.displayName = Content.displayName;

/**
 * Example usage of TooltipWrapper with TooltipTrigger and TooltipContent
 *
 * @example
 * // Basic usage with TooltipWrapper
 * <TooltipWrapper>
 *   <TooltipTrigger asChild>
 *     <button className="rounded-md bg-primary px-4 py-2 text-white">Hover me</button>
 *   </TooltipTrigger>
 *   <TooltipContent>
 *     <p>This is a tooltip content</p>
 *     <Arrow className="fill-white" />
 *   </TooltipContent>
 * </TooltipWrapper>
 *
 * @example
 * // With custom side and offset
 * <TooltipWrapper delayDuration={200}>
 *   <TooltipTrigger asChild>
 *     <span className="underline cursor-help">More information</span>
 *   </TooltipTrigger>
 *   <TooltipContent side="bottom" sideOffset={10} className="bg-gray-800 text-white">
 *     <p>Detailed explanation appears below the trigger</p>
 *     <Arrow className="fill-gray-800" />
 *   </TooltipContent>
 * </TooltipWrapper>
 */

export const TooltipWrapper: React.FC<React.ComponentProps<typeof Provider>> = ({ children, ...props }) => {
  return (
    <Provider {...props}>
      <Root>{children}</Root>
    </Provider>
  );
};

type TooltipProps = Pick<TooltipContentProps, 'side' | 'sideOffset'> & {
  title: React.ReactNode;
  children?: React.ReactNode;
  iconProps?: Partial<IconProps>;
  className?: string;
};

/**
 * A tooltip component that displays additional information when hovering over an element.
 *
 * @example
 * // Basic usage with default info icon
 * <Tooltip title="This is helpful information">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * @example
 * // Custom icon with different side placement
 * <Tooltip
 *   title="Left side tooltip"
 *   side="left"
 *   iconProps={{ name: "ri-question-fill", color: "primary" }}
 * />
 *
 * @example
 * // With custom delay duration
 * <Tooltip
 *   title="Appears after 500ms"
 *   delayDuration={500}
 *   skipDelayDuration={0}
 * >
 *   <span className="underline">Hover for details</span>
 * </Tooltip>
 */

const Arrow = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx('absolute h-2 w-4 rotate-[45deg]', className)} {...props} />
));
Arrow.displayName = 'TooltipArrow';

export const TooltipIcon = React.forwardRef<HTMLSpanElement, Partial<IconProps>>(
  ({ className, cursor = 'help', size = 'sm', name = 'ri-information-fill', ...props }, ref) => (
    <Icon ref={ref} size={size} name={name} cursor={cursor} className={className} {...props} />
  )
);
TooltipIcon.displayName = 'TooltipIcon';

const Tooltip = ({ children, title, iconProps, side = 'top', sideOffset = 5, className }: TooltipProps) => (
  <TooltipWrapper delayDuration={200} skipDelayDuration={500}>
    <TooltipTrigger asChild>{children ?? <TooltipIcon {...iconProps} />}</TooltipTrigger>
    <TooltipContent side={side} sideOffset={sideOffset} className={className}>
      <div>{title}</div>
      <Arrow className="fill-white" />
    </TooltipContent>
  </TooltipWrapper>
);

export default Tooltip;
