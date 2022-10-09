import {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout';
import styled, { css } from 'styled-components';

export const Container = styled.div`
  margin: auto;
  padding: 16px;
  height: calc(100vh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
  }
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

const iconSize = '6px';
export const ColHeader = styled.div<{
  sort?: 'asc' | 'desc';
  width?: string;
}>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  ${({ width }) => width && `width: ${width};`}

  &:before {
    content: '';
    display: block;
    width: 0;
    height: 0;
    opacity: 0.1;
    margin: 0 ${iconSize} 0 0;
    background-color: transparent;
    border-width: ${iconSize} ${iconSize} 0 ${iconSize};
    border-style: solid;
    border-color: #000 transparent transparent;
    ${({ sort }) =>
      sort &&
      css`
        opacity: 1;
        ${sort !== 'desc' &&
        css`
          transform: rotate(180deg);
        `};
      `}
  }
`;

export const NoResult = styled.div`
  margin-top: 16px;
  font-size: 18px;
  font-weight: bold;
`;

export const TableContainer = styled.div`
  overflow: auto;

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
