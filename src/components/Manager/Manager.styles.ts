import { mapControlZindex } from '@components/Map/Map.style';
import {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout/MainLayout.data';
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

export const ManagerContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  overflow: hidden;
`;

export const TableContainer = styled.div<{ mapCollapsed: boolean }>`
  overflow: auto;
  width: ${({ mapCollapsed }) => (mapCollapsed ? '100%' : 'calc(70% - 16px)')};
  height: 100%;
  z-index: ${mapControlZindex + 1};

  & .fr-table {
    padding-top: 0 !important;
  }

  & table {
    max-height: 100% !important;
    tbody tr {
      :hover {
        background-color: #cfcfcf !important;
      }
    }
    & th,
    & td {
      padding: 0.5rem !important;
    }
  }

  & > div {
    width: fit-content;
  }
`;

export const MapContainer = styled.div<{ mapCollapsed: boolean }>`
  height: 100%;
  width: ${({ mapCollapsed }) => (mapCollapsed ? '0%' : '30%')};
  margin-bottom: 2.5rem;
`;

export const CollapseMap = styled.button<{
  mapCollapsed: boolean;
}>`
  position: absolute;
  padding: 0px;
  z-index: ${mapControlZindex + 2};
  left: ${({ mapCollapsed }) =>
    mapCollapsed ? 'calc(100% - (28px + 16px))' : 'calc(70%-16px)'};
  top: 50%;
  border-radius: ${({ mapCollapsed }) =>
    mapCollapsed ? '10px 0px 0px 10px' : '0px 10px 10px 0px'};
  background-color: white;
  border: solid 1px #dddddd;
  height: 60px;
  width: 28px;
  overflow: visible;
  // ugly hack => hover create issue in mobile
  @media (min-width: 520px) {
    &:hover {
      & > .hover-info {
        display: block;
      }
    }
  }
`;
