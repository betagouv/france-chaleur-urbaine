import {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout';
import styled from 'styled-components';

export const Container = styled.div`
  max-width: 1700px;
  margin: auto;
  padding: 16px;
  height: calc(100vh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
  }
  overflow: scroll;
  display: flex;
  flex-direction: column;
`;

export const NoResult = styled.div`
  margin-top: 16px;
  font-size: 18px;
  font-weight: bold;
`;

export const Distance = styled.div`
  width: 70px;
`;

export const TableContainer = styled.div`
  overflow: scroll;

  & .fr-table {
    padding-top: 0 !important;
  }

  & table {
    max-height: 100% !important;
    & th,
    & td {
      padding: 0.5rem !important;
    }
  }

  & > div {
    width: fit-content;
  }
`;
