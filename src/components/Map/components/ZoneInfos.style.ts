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
  position: relative;
  width: 100%;
  display: flex;
  gap: 16px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #dddddd;
  box-shadow: 0px 16px 16px -16px rgba(0, 0, 0, 0.32),
    0px 8px 16px rgba(0, 0, 0, 0.1);
`;

export const Export = styled.div`
  position: absolute;
  right: 16px;
  bottom: 16px;
`;

export const ZoneButton = styled(Button)`
  position: absolute;
  top: -4px;
  right: 32px;
`;

export const CollapseZone = styled.button<{ zoneCollapsed: boolean }>`
  position: absolute;
  display: flex;
  justify-content: center;
  ${({ zoneCollapsed }) =>
    zoneCollapsed &&
    css`
      align-items: center;
    `}
  left: 50%;
  top: 5px;
  border-radius: 10px;
  background-color: white;
  height: 22px;
  width: 42px;
  & > span {
    margin: 0 !important;
  }
`;

export const Explanation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ExplanationTitle = styled.span`
  font-weight: bold;
`;
