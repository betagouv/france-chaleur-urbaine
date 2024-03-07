import styled from 'styled-components';

export const Wrapper = styled.div`
  // absolute so that there is no flashing of blank
  // because the box has to be rendered to get its full height to compute the 'collapse' variable
  &.initial-collapsed-state {
    position: absolute;
  }
  // remove the initial transition delay
  &.initial-collapsed-state:before {
    transition-duration: 0s !important;
  }
`;
