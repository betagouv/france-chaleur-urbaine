import React, { forwardRef } from 'react';

import { PasswordInput as StyledDSFRPasswordInput, type InputSize } from './Input.styles';

export type InputProps = React.ComponentProps<typeof StyledDSFRPasswordInput> & {
  size?: InputSize;
};

const PasswordInput = forwardRef<HTMLDivElement, InputProps>(({ size, nativeInputProps, ...props }, ref) => {
  return (
    <StyledDSFRPasswordInput
      ref={ref}
      // @ts-expect-error don't manage to make typescript infer correctly
      $size={size}
      nativeInputProps={{
        ...nativeInputProps,
        onWheel: (e) => {
          if ((e.target as HTMLInputElement).type === 'number') {
            // https://stackoverflow.com/a/38589039
            (document?.activeElement as HTMLInputElement)?.blur();
          }
          nativeInputProps?.onWheel?.(e);
        },
      }}
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
