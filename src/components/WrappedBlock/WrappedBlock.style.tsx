import styled from 'styled-components';

export const Container = styled.div<{ reverse?: boolean; direction?: string }>`
  display: flex;
  flex-direction: ${({ reverse, direction }) =>
    reverse ? ' row-reverse' : direction || 'row'};
  flex: 1;
  justify-content: space-around;
  margin: 2rem 0;
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
