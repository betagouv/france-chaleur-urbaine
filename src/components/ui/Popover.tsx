'use client';

// Based on https://ui.shadcn.com/docs/components/popover
// WIth the added functionnality of the width of the content to be at least the width of the trigger

/* Usage example:
<Popover>
  <PopoverTrigger asChild>
    <button>trigger</button>
  </PopoverTrigger>
  <PopoverContent>
    Content
  </PopoverContent>
</Popover>
*/

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { createContext, forwardRef, ReactNode, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import useDimensions from '@hooks/useDimensions';

type Measurements = {
  width?: number;
  height?: number;
  setWidth: (width?: number) => void;
  setHeight: (height?: number) => void;
};

const PopoverMeasurementsContext = createContext<Measurements>({
  width: undefined,
  height: undefined,
  setWidth: () => void 0,
  setHeight: () => void 0,
});

const Popover = ({ children }: { children: ReactNode }) => {
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();

  const value = { width, height, setWidth, setHeight };

  return (
    <PopoverMeasurementsContext.Provider value={value}>
      <PopoverPrimitive.Root>{children}</PopoverPrimitive.Root>
    </PopoverMeasurementsContext.Provider>
  );
};

const PopoverTrigger = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>>(
  ({ children, ...props }, forwardedRef) => {
    const localRef = useRef<HTMLButtonElement>(null);
    const { setWidth, setHeight } = useContext(PopoverMeasurementsContext);
    const measurements = useDimensions(localRef);

    const { width, height } = measurements || {};

    useImperativeHandle(forwardedRef, () => localRef.current!, [localRef]);

    useEffect(() => {
      // The size of the trigger will determine the minimum width of the popover
      setWidth(width);
      setHeight(height);
    }, [width, height, setWidth, setHeight]);

    return (
      <PopoverPrimitive.Trigger ref={localRef} {...props}>
        {children}
      </PopoverPrimitive.Trigger>
    );
  }
);

export default PopoverTrigger;

PopoverTrigger.displayName = 'PopoverTrigger';

const StyledPopoverContent = styled(PopoverPrimitive.Content)<{
  $width?: number;
}>`
  z-index: 2001; /* to be above the NetworksFilters */
  border-radius: 0 0 0.375rem 0.375rem;
  background-color: white;
  color: black;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  outline: none;
  ${({ $width }) =>
    $width &&
    css`
      min-width: ${$width}px;
    `}
`;

StyledPopoverContent.displayName = 'StyledPopoverContent';

const PopoverContent = forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { full?: boolean }
>(({ full = true, ...props }, ref) => {
  const { width } = useContext(PopoverMeasurementsContext);

  return <StyledPopoverContent ref={ref} $width={full ? width : undefined} {...props} />;
});
PopoverContent.displayName = 'PopoverContent';

const PopoverContentPortaled = forwardRef<React.ElementRef<typeof PopoverContent>, React.ComponentPropsWithoutRef<typeof PopoverContent>>(
  (props, ref) => {
    return (
      <PopoverPrimitive.Portal>
        <PopoverContent ref={ref} {...props} />
      </PopoverPrimitive.Portal>
    );
  }
);
PopoverContentPortaled.displayName = 'PopoverContentPortaled';

export { Popover, PopoverContent, PopoverContentPortaled, PopoverTrigger };
