// import { ToolItem } from '@codegouvfr/react-dsfr';
import styled from 'styled-components';

/**
 * In fullscreen mode, this container hides the first line of the header
 * but only when the hamburger menu is not displayed.
 */
export const FullScreenModeFirstLine = styled.div`
  @media (min-width: 992px) {
    display: none;
  }
`;

/**
 * In fullscreen mode, the first line is hidden and a logo is displayed
 * in the navigation bar instead. This container hides the logo when the
 * hamburger menu is displayed.
 */
export const FullScreenModeNavLogo = styled.li`
  @media (max-width: 991px) {
    display: none;
  }
`;

/**
 * In fullscreen mode, fix the toolbar style in the navigation bar
 */
export const FullScreenItems = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  .fr-header__search {
    display: none;
  }
`;

// export const StopImpersonationButton = styled(ToolItem)`
export const StopImpersonationButton = styled.div`
  background-color: var(--background-flat-error) !important;
  color: white !important;
  border-radius: 6px;
`;

// Permet au composant ToolItemGroup de retrouver ce ToolItem
// StopImpersonationButton.defaultProps = {
//   __TYPE: 'ToolItem',
// };
