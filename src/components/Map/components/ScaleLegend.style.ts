import styled, { css } from 'styled-components';

export const ScaleLegendWrapper = styled.div<{ framed?: boolean }>`
  margin-bottom: 4px;
`;

export const ScaleLegendHeader = styled.div`
  font-size: 0.8em;
  margin-bottom: 0.2em;
`;

export const ScaleLegendBody = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 46px;
`;

export const ScaleSlider = styled.div`
  flex: 1 1 auto;
  position: relative;
`;

export const ScaleLabelLegend = styled.span<{
  bgColor?: string;
  size: number;
  circle?: boolean;
}>`
  ${({ size, bgColor, circle }) => css`
    width: ${size}px;
    height: ${size}px;

    display: inline-flex;
    vertical-align: middle;
    justify-content: center;
    align-items: center;
    margin-right: 0.2em;

    ::before {
      content: '';
      display: block;
      position: relative;

      width: ${size}px;
      height: ${size}px;
      background-color: ${bgColor || 'grey'};
      ${
        circle &&
        css`
        border-radius: 50%;
      `
      }
    }
  `};
`;
