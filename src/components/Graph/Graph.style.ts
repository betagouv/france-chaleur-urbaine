import styled, { css } from 'styled-components';

export const Container = styled.div<{ large?: boolean }>`
  width: 100%;
  ${({ large }) =>
    !large &&
    css`
      @media (min-width: 1150px) {
        width: 50%;
      }
    `}
`;

export const GraphWrapper = styled.div`
  width: 100%;
  height: 400px;
`;
