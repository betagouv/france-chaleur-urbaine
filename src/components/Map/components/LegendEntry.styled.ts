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
  align-items: flex-start;

  input {
    margin-top: 2px;
  }

  label {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }
`;

export const MultipleLabelLegendMarkerWrapper = styled.div`
  width: 54px;
`;

export const LabelLegendMarker = styled.div<{ bgColor?: string }>`
  width: 46px;
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

export const LabelLegendHead = styled.div<{
  type?: string;
  fullWidth?: boolean;
}>`
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  ${({ fullWidth }) => !fullWidth && 'max-width: 205px;'}

  ${({ type }) =>
    type === 'group' &&
    css`
      line-height: 1.45;
    `}
`;

export const LabelLegend = styled.div`
  font-size: 12px;
  line-height: 14px;
`;

export const InfoIcon = styled.div`
  position: absolute;
  top: -4px;
  right: -16px;
  & > .hover-info {
    width: 300px;
  }
  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;
