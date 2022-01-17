import styled from 'styled-components';

export const Container = styled.div<{ reverse?: boolean }>`
  display: flex;
  flex-direction: ${({ reverse }) => (reverse ? ' row-reverse' : 'row')};
`;
export const ImageContainer = styled.div`
  > img {
    width: 100%;
  }
`;
export const TextContainer = styled.div`
  > h2 {
    color: #000074;
  }
  p {
    font-size: 1.25rem;
    line-height: 2rem;
  }
  em {
    color: #4550e5;
    font-style: normal;
  }
  strong {
    color: #4550e5;

    em {
      color: #293173;
      font-style: normal;
    }
  }

  @media (max-width: 576px) {
    margin: 0;
  }
`;
