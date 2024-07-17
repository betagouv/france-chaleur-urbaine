import { Input as DSFRInput } from '@codegouvfr/react-dsfr/Input';
import React, { forwardRef } from 'react';

const Input = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof DSFRInput>
>((props, ref) => {
  return <DSFRInput ref={ref} {...props} />;
});

Input.displayName = 'Input';

export default Input;
