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
