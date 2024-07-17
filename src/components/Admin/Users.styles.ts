import styled, { css } from 'styled-components';
export const TableContainer = styled.div<{ small?: boolean }>`
  padding: 64px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .MuiDataGrid-root {
    min-width: 300px;
    max-width: 1600px;
    width: 100%;
  }

  ${({ small }) =>
    small &&
    css`
      .MuiDataGrid-root {
        min-width: 300px;
        max-width: 600px;
      }
    `}

  a {
    background-image: none;
    line-height: 0;
  }

  @media (min-width: 768px) {
    padding: 64px;
  }
`;
