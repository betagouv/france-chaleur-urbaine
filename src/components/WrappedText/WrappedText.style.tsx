import styled from 'styled-components';

export const ImageContainer = styled.div`
  > img {
    width: 100%;
  }
`;
export const Container = styled.div`
  > h2 {
    color: #000074;
  }
  p {
    font-size: 1.25rem;
    line-height: 2rem;
  }
  strong {
    color: #4550e5;
  }

  @media (max-width: 576px) {
    margin: 0;
  }
`;
