import { PasswordInput as DSFRPasswordInput } from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import { Input as DSFRInput, type InputProps as DSFRInputProps } from '@codegouvfr/react-dsfr/Input';
import styled, { css } from 'styled-components';

export type InputSize = 'sm';
export type InputCustomProps = { $size?: InputSize };

export type TextAreaProps = DSFRInputProps.TextArea & InputCustomProps;
export type InputProps = DSFRInputProps.RegularInput & InputCustomProps;

// Common styles for small inputs
const smallInputStyles = css`
  input,
  textarea {
    padding: 0.35rem 0.5rem 0.35rem 0.5rem;
    font-size: 0.875rem;
  }
`;

// Size-based styling
const sizeStyles = css<InputCustomProps>`
  ${({ $size }) => $size === 'sm' && smallInputStyles}
`;

// Had to force typeof DSFRInput as type inference was not working when not
export const Input = styled(DSFRInput)<InputCustomProps>`
  ${sizeStyles}
`;

// Had to force typeof DSFRInput as type inference was not working when not
export const PasswordInput = styled(DSFRPasswordInput)<InputCustomProps>`
  ${sizeStyles}
`;
