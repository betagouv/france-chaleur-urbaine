import Header from '@codegouvfr/react-dsfr/Header';
import styled, { css } from 'styled-components';

export const StyledHeader = styled(Header)<{ $isFullScreenMode: boolean }>`
  ${({ $isFullScreenMode }) =>
    $isFullScreenMode
      ? css`
          // In fullscreen mode, hide the first line of the header
          // but only when the hamburger menu is not displayed.
          ${({ theme }) => theme.media.lg`
            .fr-header__body {
              display: none;
            }
          `}
          @media (min-width: 992px) and (max-width: 1241px) {
            .fr-nav__btn,
            .fr-nav__link {
              padding: 0.5rem !important;
              display: flex;
              font-size: 0.8rem;
              white-space: nowrap;
              align-items: center;
              &:after {
                margin-left: 0.25rem;
              }
            }
            .fr-btns-group .fr-btn {
              font-size: 0.8rem !important;
              &:before {
                margin-right: 0.5rem;
              }
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
