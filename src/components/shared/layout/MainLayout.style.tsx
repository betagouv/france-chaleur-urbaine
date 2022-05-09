import styled, { createGlobalStyle } from 'styled-components';
import {
  footerHeight,
  fullscreenFooterHeight,
  fullscreenHeaderHeight,
  headerHeight,
  tabHeaderHeight,
} from './MainLayout.data';

export const MainLayoutStyle = createGlobalStyle`
  .label-menu-item {
    padding: 1.5rem 0 1.25rem 0;
    margin: 0;
    color: #5662FA;
    font-weight: bold;
  }
  .fr-nav__item  {
    &:last-of-type {
      box-shadow: none;
    }
  }

  .main-nav-extender-wrapper {
    display: none;
  }
  @media (min-width: 62em) {
    .main-nav {
      position: relative;
      display: flex;
      flex-direction: row;
    }
    .main-nav-extender-wrapper {
      position: absolute;
      top: 0.2rem;
      right: -1rem;
      flex: 1;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
    .label-menu-item {
      padding: 1rem;
    }

    .fr-nav__list {
      flex-wrap: nowrap;
      max-width: calc(100% - 2rem);
    }
    .fr-nav__item {
      white-space: nowrap;

      & & {
        margin-left: 0;
      }
    }
    .extend-menu {
      ul {
        margin: 0;
      }
      li {}

      .fr-nav__item:not(.surcharge) {
        margin-left: 0;
      }
    }

    .extend-menu {
      overflow: hidden;
      max-width: 100%;
      opacity: 1;
      transition: 0.75s ease-out 0.3s;
      transition-property: max-width, opacity;

      &.extend-menu__hidden {
        max-width: 0;
        opacity: 0;
        transition: 0.35s ease-in;
        transition-property: max-width, opacity;
      }
    }
}
`;

export const Main = styled.section<{ fullscreen?: boolean }>`
  min-height: calc(100vh - ${tabHeaderHeight});

  @media (min-width: 992px) {
    min-height: calc(100vh - ${headerHeight} - ${footerHeight});
    ${({ fullscreen }) =>
      fullscreen &&
      `min-height: calc(100vh - ${fullscreenHeaderHeight} - ${fullscreenFooterHeight});`}
  }
`;

export const HeaderLogo = styled.img`
  width: auto;
  height: auto;
  max-height: 110px;
  max-width: 200px;
`;
export const HeaderLabel = styled.p`
  font-size: 1.9rem;
  color: #069368;
`;
export const HeaderSubLabel = styled.p`
  margin: 0;
`;
export const GithubLogo = styled.img`
  shape-rendering: crispEdges;
  width: 0.7rem;
  height: 0.7rem;
`;
