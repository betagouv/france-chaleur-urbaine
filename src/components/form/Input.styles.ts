import { Input as DSFRInput } from '@codegouvfr/react-dsfr/Input';
import styled, { css } from 'styled-components';

export type InputSize = 'sm';
export type InputCustomProps = { $size?: InputSize };

// Had to force typeof DSFRInput as type inference was not working when not
export const Input: typeof DSFRInput = styled(DSFRInput)<InputCustomProps>`
  ${({ $size }) => css`
    ${$size === 'sm' &&
    css`
      input,
      textarea {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        font-size: 13px;
      }
    `}
  `}
`;
