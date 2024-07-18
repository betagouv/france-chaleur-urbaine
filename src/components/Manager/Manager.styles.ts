import styled from 'styled-components';

import { mapControlZindex } from '@components/Map/Map.style';
import { fullscreenHeaderHeight, tabHeaderHeight } from '@components/shared/layout/MainLayout.data';

export const Container = styled.div`
  margin: auto;
  padding: 16px;
  height: calc(200vh - ${tabHeaderHeight});
  height: calc(200dvh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    height: calc(100vh - ${fullscreenHeaderHeight});
    height: calc(100dvh - ${fullscreenHeaderHeight});
  }
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

export const NoResult = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 18px;
  font-weight: bold;
`;

export const ColHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  height: 56px;
  white-space: normal;
  line-height: 1.2;
  flex: 1;
`;

export const ManagerContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  @media (min-width: 992px) {
    flex-direction: row;
  }
`;

export const TableContainer = styled.div<{ mapCollapsed: boolean }>`
  width: 100%;
  @media (min-width: 992px) {
    width: ${({ mapCollapsed }) => (mapCollapsed ? '100%' : 'calc(70% - 16px)')};
  }
  height: 100%;
  z-index: ${mapControlZindex + 1};
`;

export const MapContainer = styled.div<{ mapCollapsed: boolean }>`
  height: 100%;
  width: 100%;
  @media (min-width: 992px) {
    width: ${({ mapCollapsed }) => (mapCollapsed ? '0%' : '30%')};
  }
  margin-bottom: 2.5rem;

  .maplibregl-popup-content {
    background-color: var(--background-default-grey);
  }
  .maplibregl-popup-anchor-left .maplibregl-popup-tip {
    border-right-color: var(--background-default-grey);
  }
  .maplibregl-popup-anchor-top .maplibregl-popup-tip {
    border-bottom-color: var(--background-default-grey);
  }
  .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
    border-top-color: var(--background-default-grey);
  }
  .maplibregl-popup-anchor-right .maplibregl-popup-tip {
    border-left-color: var(--background-default-grey);
  }
`;

export const CollapseMap = styled.button<{
  mapCollapsed: boolean;
}>`
  position: absolute;
  padding: 0px;
  z-index: ${mapControlZindex + 2};
  left: ${({ mapCollapsed }) => (mapCollapsed ? 'calc(100% - (28px + 16px))' : 'calc(70%-16px)')};
  top: 50%;
  border-radius: ${({ mapCollapsed }) => (mapCollapsed ? '10px 0px 0px 10px' : '0px 10px 10px 0px')};
  background-color: var(--background-default-grey);
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
