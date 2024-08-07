import styled from 'styled-components';

export const Container = styled.div`
  max-width: 75%;

  ${({ theme }) => theme.media.xl`
    margin-left: 100px;
  `}

  @media (min-width: 1300px) {
    margin-left: 200px;
  }
`;
