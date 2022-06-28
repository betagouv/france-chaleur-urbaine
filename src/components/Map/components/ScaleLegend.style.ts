import styled, { css } from 'styled-components';

export const ScaleLegendWrapper = styled.div<{ framed?: boolean }>`
  padding: 0 0 0.4rem 0;

  ${({ framed }) =>
    framed &&
    css`
      padding: 0.3em 0.5em 0.55em;
      margin: 0.2em 0.5em 0.4em 1.5em;
      border: 1px solid #d2d6df;
      border-radius: 0.5em;
    `}
`;

export const ScaleLegendHeader = styled.div`
  font-size: 0.8em;
  margin-bottom: 0.2em;
`;

export const ScaleLegendLabel = styled.label`
  display: inline-block;
  margin-bottom: 0.2em;
`;

export const Input = styled.input``;

export const ScaleLegendBody = styled.div<{ checkbox?: boolean }>`
  display: flex;
  justify-content: space-between;

  ${({ checkbox }) =>
    checkbox &&
    css`
      padding: 0 0.3em;
    `}
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
  width: ${({ size }) => `${size}rem`};
  height: 1em;
  display: inline-flex;
  vertical-align: middle;
  justify-content: center;
  align-items: center;
  margin-right: 0.2em;

  ::before {
    content: '';
    display: block;
    position: relative;

    width: ${({ size }) => `${size}em`};
    height: ${({ size }) => `${size}em`};
    background-color: ${({ bgColor }) => bgColor || 'grey'};
    ${({ circle }) =>
      circle &&
      css`
        border-radius: 50%;
      `}
  }
`;
