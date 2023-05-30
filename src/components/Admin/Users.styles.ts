import styled from 'styled-components';

export const TableContainer = styled.div<{ small?: boolean }>`
  padding: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .fr-input-group {
    position: absolute;
    ${({ small }) => (small ? 'left: 50%' : 'right: 64px')};
    width: 200px;
  }

  .fr-table {
    min-width: 300px;
  }

  a {
    background-image: none;
    line-height: 0;
  }
`;
