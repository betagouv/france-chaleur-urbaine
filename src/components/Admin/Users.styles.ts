import styled from 'styled-components';

export const TableContainer = styled.div<{ small?: boolean }>`
  padding: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .fr-table {
    min-width: 300px;
  }

  a {
    background-image: none;
    line-height: 0;
  }
`;
