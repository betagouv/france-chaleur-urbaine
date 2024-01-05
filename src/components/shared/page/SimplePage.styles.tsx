import styled from 'styled-components';

export const FullScreenModeFirstLine = styled.div`
  @media (min-width: 992px) {
    display: none;
  }
`;

export const FullScreenModeNavLogo = styled.li`
  @media (max-width: 991px) {
    display: none;
  }
`;

export const FullScreenItems = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  .fr-header__search {
    display: none;
  }
`;
