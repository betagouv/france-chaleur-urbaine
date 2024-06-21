import { mapControlZindex } from '@components/Map/Map.style';
import {
  fullscreenHeaderHeight,
  tabHeaderHeight,
} from '@components/shared/layout/MainLayout.data';
import styled from 'styled-components';

export const Container = styled.div`
  margin: auto;
  padding: 16px;
  height: calc(100vh - ${tabHeaderHeight});
  height: calc(100dvh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
    height: calc(100dvh - ${fullscreenHeaderHeight});
  }
  overflow: auto;
  display: flex;
  flex-direction: column;
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
