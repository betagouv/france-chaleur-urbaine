import styled from 'styled-components';
import {
  footerHeight,
  fullscreenFooterHeight,
  fullscreenHeaderHeight,
  headerHeight,
  tabHeaderHeight,
} from './MainLayout.data';

export const Main = styled.section<{ fullscreen?: boolean }>`
  min-height: calc(100vh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    min-height: calc(100vh - ${headerHeight} - ${footerHeight});
    ${({ fullscreen }) =>
      fullscreen &&
      `min-height: calc(100vh - ${fullscreenHeaderHeight} - ${fullscreenFooterHeight});`}
  }
`;

export const GithubLogo = styled.img`
  shape-rendering: crispEdges;
  width: 0.7rem;
  height: 0.7rem;
`;
