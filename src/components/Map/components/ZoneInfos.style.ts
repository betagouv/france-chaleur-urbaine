import { Button } from '@dataesr/react-dsfr';
import styled, { css } from 'styled-components';
import { mapMinMedia } from '../Map.style';

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
  flex-wrap: wrap;
  gap: 16px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #dddddd;
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
  left: 50%;
  top: 32px;
  ${mapMinMedia} {
    left: 64px;
    top: 16px;
  }
  ${({ zoneCollapsed }) =>
    zoneCollapsed &&
    css`
      top: 64px;
      ${mapMinMedia} {
        top: 32px;
      }
    `}
  transform: translateY(-50%);
  border-radius: 10px;
  background-color: white;
  border: solid 1px #dddddd;
  height: 46px;
  width: 48px;
  & > span {
    margin: 4px 0 0 0 !important;
  }
  &:hover {
    & > .hover-info {
      display: block;
      ${mapMinMedia} {
        display: none;
      }
    }
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
