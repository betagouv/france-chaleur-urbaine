import styled, { css } from 'styled-components';

export const LabelLegendWrapper = styled.div`
  font-size: 0.95em;
  display: flex;
  align-items: baseline;

  label {
    display: flex;
    flex-direction: row;
    align-items: baseline;
  }
`;
export const LabelLegend = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
`;
export const LabelLegendMarker = styled.div<{ bgColor?: string }>`
  width: 0rem;
  height: 1rem;
  display: inline-flex;
  vertical-align: text-bottom;
  justify-content: center;
  align-items: center;
  margin-right: 0.2em;
  top: -0.15em;
  position: relative;

  ::before {
    content: '';
    display: block;
    height: 1rem;
  }

  ${({ bgColor }) =>
    bgColor &&
    css`
      ::before {
        background-color: ${bgColor};
      }
    `}
`;

export const LabelLegendHead = styled.div<{ type?: string }>`
  ${({ type }) =>
    type === 'group' &&
    css`
      font-weight: bold;
      border-bottom: 1px solid;
      margin-bottom: 0.2em;
      line-height: 1.45;
    `}
`;
export const LabelLegendDescription = styled.div`
  font-size: 0.73em;
  line-height: 1.2;
  color: #8d93a1;
`;
