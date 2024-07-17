import { Input as DSFRInput } from '@codegouvfr/react-dsfr/Input';
import React, { forwardRef } from 'react';

const Input = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof DSFRInput>
>(({ label, ...props }, ref) => {
  const optional = !props?.nativeInputProps?.required;

  return (
    <DSFRInput
      ref={ref}
      label={label ? `${label}${optional ? ' (Optionnel)' : ''}` : label}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
