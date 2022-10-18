import { SideMenu as SideMenuDSFR } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const StickyWrapper = styled.div`
  @media (min-width: 48em) {
    .fr-sidemenu--sticky {
      top: 100px;
    }
  }
`;

export const SideMenu = styled(SideMenuDSFR)`
  .fr-sidemenu__btn,
  .fr-sidemenu__link {
    font-size: 14px !important;
    line-height: 14px !important;
  }
`;
