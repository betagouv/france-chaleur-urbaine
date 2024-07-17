import { Input as DSFRInputOriginal } from '@codegouvfr/react-dsfr/Input';
import React, { forwardRef } from 'react';
import { Input as StyledDSFRInput, type InputSize } from './Input.styles';

export type InputProps = React.ComponentProps<typeof DSFRInputOriginal> & {
  size?: InputSize;
};

const Input = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof StyledDSFRInput>
>(({ label, size = 'md', ...props }, ref) => {
  const optional =
    !props?.nativeInputProps?.required && !props?.nativeTextAreaProps?.required;

  return (
    <StyledDSFRInput
      ref={ref}
      $size={size}
      label={label ? `${label}${optional ? ' (Optionnel)' : ''}` : label}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
