import React, { forwardRef } from 'react';

import { PasswordInput as StyledDSFRPasswordInput, type InputSize } from './Input.styles';

export type InputProps = React.ComponentProps<typeof StyledDSFRPasswordInput> & {
  size?: InputSize;
};

const PasswordInput = forwardRef<HTMLDivElement, InputProps>(({ size, ...props }, ref) => {
  return (
    <StyledDSFRPasswordInput
      ref={ref}
      // @ts-expect-error don't manage to make typescript infer correctly
      $size={size}
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
