import { Button } from '@dataesr/react-dsfr';
import styled, { css } from 'styled-components';

export const Container = styled.div<{ customCursor?: boolean }>`
  ${({ customCursor }) =>
    customCursor &&
    css`
      cursor: crosshair !important;
    `}
`;

export const ZoneInfosWrapper = styled.div`
  font-size: 14px;
  button {
    font-size: 14px;
  }
  position: relative;
  width: 100%;
  gap: 16px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #dddddd;
  .fr-tabs__panel {
    padding: 8px !important;
  }
`;

export const Export = styled.div`
  position: absolute;
  right: 16px;
  bottom: 16px;
`;

export const CollapseZone = styled.button<{ zoneCollapsed: boolean }>`
  position: absolute;
  padding-bottom: 24px;
  left: 50%;
  top: 32px;
  ${({ zoneCollapsed }) =>
    zoneCollapsed &&
    css`
      top: 64px;
    `}
  transform: translateX(-50%) translateY(-50%);
  border-radius: 10px;
  background-color: white;
  border: solid 1px #dddddd;
  height: 51px;
  width: 60px;
  & > span {
    margin: 4px 0 0 0 !important;
  }
  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;
export const Explanations = styled.div`
  display: flex;
  gap: 32px;
`;

export const Explanation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ZoneInfos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

export const DrawButton = styled(Button)`
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content !important;
`;

export const InfoIcon = styled.span`
  margin-left: 8px;
  & > .hover-info {
    width: 300px;
  }
  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;
