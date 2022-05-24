import styled, { css } from 'styled-components';

export const Container = styled.div`
  width: 100%;
  max-width: 550px;
  text-align: center;
  margin: auto;
`;

export const FormWarningMessage = styled.div<{ show?: boolean }>`
  font-weight: bold;
  padding: 0.2em 0 0.2em 1em;
  border-left: 3px solid var(--error);
  background-color: #ffffff66;
  opacity: 0;
  transition: opacity 0.25s ease;

  ${({ show }) =>
    show &&
    css`
      opacity: 1;
    `}
`;
