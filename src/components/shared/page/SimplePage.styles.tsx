import Header from '@codegouvfr/react-dsfr/Header';
import styled, { css } from 'styled-components';

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

export const StyledHeader = styled(Header)<{ isFullScreenMode: boolean }>`
  ${({ isFullScreenMode }) =>
    isFullScreenMode
      ? css`
          // In fullscreen mode, hide the first line of the header
          // but only when the hamburger menu is not displayed.
          @media (min-width: 992px) {
            .fr-header__body {
              display: none;
            }
          }

          // In fullscreen mode, hide the service row
          .fr-header__service {
            display: none;
          }

          // In fullscreen mode, the first line is hidden and a logo is displayed
          // in the navigation bar instead. This rule hides the logo when the
          // hamburger menu is displayed.
          @media (max-width: 991px) {
            .fcu-navigation-logo {
              display: none;
            }
          }
        `
      : ''};
`;
