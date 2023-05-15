import styled from 'styled-components';

export const FullScreenHeader = styled.div`
  @media (min-width: 992px) {
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

export const GithubLogo = styled.img`
  shape-rendering: crispEdges;
  width: 0.7rem;
  height: 0.7rem;
`;
