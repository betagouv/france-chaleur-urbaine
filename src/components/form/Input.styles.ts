import { Input as DSFRInput } from '@codegouvfr/react-dsfr/Input';
import styled, { css } from 'styled-components';

export type InputSize = 'sm';

export const Input = styled(DSFRInput)<{ $size?: InputSize }>`
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
