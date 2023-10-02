import styled from 'styled-components';

export const HeaderContainer = styled.div`
  min-height: 250px;

  .fr-container {
    max-width: 100%;
    width: 100%;
  }
`;

export const Container = styled.div`
  max-width: 50%;
  margin-left: 50%;
  @media (max-width: 873px) {
    max-width: 70%;
    margin-left: 30%;
  }
  @media (max-width: 576px) {
    max-width: 100%;
    margin-left: 0%;
  }

  h1 {
    font-weight: 400;
  }
`;
