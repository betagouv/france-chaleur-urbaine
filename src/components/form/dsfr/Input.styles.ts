import { PasswordInput as DSFRPasswordInput } from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import { Input as DSFRInput } from '@codegouvfr/react-dsfr/Input';
import styled, { css } from 'styled-components';

export type InputSize = 'sm';
export type InputCustomProps = { $size?: InputSize };

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
export const Input: typeof DSFRInput = styled(DSFRInput)<InputCustomProps>`
  ${sizeStyles}
`;

// Had to force typeof DSFRInput as type inference was not working when not
export const PasswordInput: typeof DSFRPasswordInput = styled(DSFRPasswordInput)<InputCustomProps>`
  ${sizeStyles}
`;
