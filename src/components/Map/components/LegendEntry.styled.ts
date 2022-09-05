import styled, { css } from 'styled-components';

export const LabelLegendInputLabelWrapper = styled.div`
  position: relative;
  margin-left: 4px;
  flex-grow: 1;
`;
export const LabelLegendInputLabel = styled.div`
  display: flex;
`;

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

export const LabelLegendMarker = styled.div<{ bgColor?: string }>`
  width: 32px;
  height: 1rem;
  display: inline-flex;
  vertical-align: text-bottom;
  justify-content: center;
  align-items: center;
  margin: 4px;
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
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;

  ${({ type }) =>
    type === 'group' &&
    css`
      line-height: 1.45;
    `}
`;

export const InfoIcon = styled.div`
  position: absolute;
  top: -4px;
  right: 0;
  & > .hover-info {
    width: 300px;
  }
  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;
