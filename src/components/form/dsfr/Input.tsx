import React, { forwardRef } from 'react';

import { Input as StyledDSFRInput, type InputSize } from './Input.styles';

export type InputProps = React.ComponentProps<typeof StyledDSFRInput> & {
  size?: InputSize;
  hideOptionalLabel?: boolean;
};

const Input = forwardRef<HTMLDivElement, InputProps>(({ label, size, hideOptionalLabel, ...props }, ref) => {
  const optional = !hideOptionalLabel && !props?.nativeInputProps?.required && !props?.nativeTextAreaProps?.required;

  return (
    <StyledDSFRInput
      ref={ref}
      // @ts-expect-error don't manage to make typescript infer correctly
      $size={size}
      label={
        label ? (
          <>
            {label}
            {optional ? <small> (Optionnel)</small> : ''}
          </>
        ) : (
          label
        )
      }
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
