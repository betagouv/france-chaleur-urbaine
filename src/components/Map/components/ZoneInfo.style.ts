import styled, { css } from 'styled-components';

export const ZoneInfoWrapper = styled.div`
  display: flex;
  flex: 1;
  gap: 4px;
`;

export const IconWrapper = styled.div<{ withBackground?: boolean }>`
  display: inline;
  position: relative;
  ${({ withBackground }) =>
    withBackground &&
    css`
      background-color: #f4f7fe;
      border-radius: 50%;
      padding: 1px 8px 0 8px;
      max-height: 25px;
      max-width: 25px;
      img {
        position: relative;
        top: 2px;
      }
    `}
`;

export const Info = styled.div<{ alignTop?: boolean }>`
  display: flex;
  flex-direction: column;
  ${({ alignTop }) =>
    !alignTop &&
    css`
      justify-content: space-between;
    `}
`;

export const Title = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
`;

export const Label = styled.span`
  font-weight: 500;
  font-size: 12px;
  color: #a3aed0;
  margin-left: 4px;
`;

export const Value = styled.span<{
  color: 'blue' | 'green';
}>`
  font-weight: 700;
  font-size: 14px;

  ${({ color }) =>
    color === 'blue'
      ? css`
          color: #4550e5;
        `
      : css`
          color: #56a131;
        `}
`;
