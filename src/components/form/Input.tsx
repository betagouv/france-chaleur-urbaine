import React, { forwardRef } from 'react';
import { Input as DSFRInput, type InputSize } from './Input.styles';

export type InputProps = React.ComponentProps<typeof DSFRInput> & {
  size?: InputSize;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, size = 'md', ...props }, ref) => {
    const optional = !props?.nativeInputProps?.required;

    return (
      <DSFRInput
        ref={ref}
        $size={size}
        label={label ? `${label}${optional ? ' (Optionnel)' : ''}` : label}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
