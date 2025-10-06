import { forwardRef } from 'react';

import { type InputProps as InputPropsStyled, type InputSize, Input as StyledDSFRInput } from './Input.styles';

export type InputProps = InputPropsStyled & {
  size?: InputSize;
  hideOptionalLabel?: boolean;
};

const Input = forwardRef<HTMLDivElement, InputProps>(({ label, size, hideOptionalLabel, nativeInputProps, ...props }, ref) => {
  const optional = !hideOptionalLabel && !nativeInputProps?.required;

  return (
    <StyledDSFRInput
      ref={ref}
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

Input.displayName = 'Input';

export default Input;
