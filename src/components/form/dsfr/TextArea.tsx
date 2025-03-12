import React, { forwardRef } from 'react';

import { Input as StyledDSFRInput, type InputSize, type TextAreaProps } from './Input.styles';

export type InputProps = Omit<TextAreaProps, 'textArea'> & {
  size?: InputSize;
  hideOptionalLabel?: boolean;
};

const TextArea = forwardRef<HTMLDivElement, InputProps>(({ label, size, hideOptionalLabel, nativeTextAreaProps, ...props }, ref) => {
  const optional = !hideOptionalLabel && !nativeTextAreaProps?.required;

  return (
    <StyledDSFRInput
      textArea
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
      nativeTextAreaProps={nativeTextAreaProps}
      {...props}
    />
  );
});

TextArea.displayName = 'TextArea';

export default TextArea;
