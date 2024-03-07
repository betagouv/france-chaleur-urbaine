import styled, { css } from 'styled-components';

export const ScaleLegendWrapper = styled.div<{ framed?: boolean }>`
  margin-bottom: 4px;
`;

export const ScaleLegendHeader = styled.div`
  font-size: 0.8em;
  margin-bottom: 0.2em;
`;

export const ScaleLegendLabel = styled.label`
  display: inline-block;
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

export const ScaleLegendLabelWrapper = styled.div`
  font-size: 0.75em;
  white-space: nowrap;

  display: inline;
  position: relative;
  padding-right: 0.5em;

  &:not(:last-child) {
    margin-right: 0.5em;
  }
`;

export const ScaleLabelLegend = styled.span<{
  bgColor?: string;
  size: number;
  circle?: boolean;
}>`
  ${({ size }) => css`
    width: ${size}px;
    height: ${size}px;
  `};
  display: inline-flex;
  vertical-align: middle;
  justify-content: center;
  align-items: center;
  margin-right: 0.2em;

  ::before {
    content: '';
    display: block;
    position: relative;

    width: 100%;
    height: 100%;
    background-color: ${({ bgColor }) => bgColor || 'grey'};
    ${({ circle }) =>
      circle &&
      css`
        border-radius: 50%;
      `}
  }
`;
