import { Button } from '@dataesr/react-dsfr';
import styled, { css } from 'styled-components';

export const Container = styled.div<{ customCursor?: boolean }>`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 4px;
  ${({ customCursor }) =>
    customCursor &&
    css`
      cursor: crosshair !important;
    `}
`;

export const ZoneInfosWrapper = styled.div`
  position: relative;
  max-width: 1000px;
  display: flex;
  gap: 16px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0px 16px 16px -16px rgba(0, 0, 0, 0.32),
    0px 8px 16px rgba(0, 0, 0, 0.1);
`;

export const ExportButton = styled(Button)`
  position: absolute;
  right: 16px;
  bottom: 16px;
`;
