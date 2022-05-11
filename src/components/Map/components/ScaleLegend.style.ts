import styled, { css } from 'styled-components';

export const ScaleLegendWrapper = styled.div<{ framed?: boolean }>`
  padding: 0 0 0.4rem 0;

  ${({ framed }) =>
    framed &&
    css`
      padding: 0.3em 0.5em 0.55em;
      margin-bottom: 0.4rem;
      background-color: #efefef;
      border-radius: 0.2em;
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
  ${({ checkbox }) =>
    checkbox &&
    css`
      padding: 0 0.3em;
    `}
`;

export const ScaleLegendLabelWrapper = styled.div`
  font-size: 0.9em;
  white-space: nowrap;

  display: inline;
  position: relative;
  padding-right: 0.5em;
  margin-right: 0.5em;

  &::after {
    content: '';
    display: block;
    position: absolute;
    width: 2px;
    height: 70%;
    background-color: rgb(69 80 229 / 34%);
    right: 0;
    top: 15%;
  }

  &:last-child::after {
    display: none;
  }
`;

export const ScaleLabelLegend = styled.span<{ bgColor?: string; size: number }>`
  width: ${({ size }) => `${size}rem`};
  height: 1em;
  display: inline-flex;
  vertical-align: text-bottom;
  justify-content: center;
  align-items: center;
  margin-right: 0.2em;

  ::before {
    content: '';
    display: block;

    width: ${({ size }) => `${size}em`};
    height: ${({ size }) => `${size}em`};
    border-radius: 50%;
    margin-bottom: calc(0.25em - 1.5px);
    background-color: ${({ bgColor }) => bgColor || 'grey'};
  }
`;
