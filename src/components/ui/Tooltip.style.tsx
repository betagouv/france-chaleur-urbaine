import styled from 'styled-components';

export const StyledTooltip = styled.div`
  display: inline;
  position: relative;
  cursor: help;

  & > .hover-info {
    width: 300px;
  }

  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;

export const StyledSimpleTooltip = styled.div`
  line-height: 0;

  &:hover + div {
    display: block;
  }
`;

export const StyledSimpleTooltipContent = styled.div`
  display: none;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  background-color: black;
  z-index: 9999;
  color: white;
  font-size: 12px;
  line-height: 14px;
  border-radius: 4px;
  padding: 8px;
`;
