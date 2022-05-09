import styled, { css } from 'styled-components';

type ContainerType = {
  reverse?: boolean;
  center?: boolean;
};

export const Container = styled.div<ContainerType>`
  display: inline-flex;
  flex-direction: ${({ reverse }) => (reverse ? ' row-reverse' : 'row')};
  ${({ center }) =>
    center &&
    css`
      align-items: center;
    `}
`;
export const ImageContainer = styled.div`
  flex: 1;

  > img {
    width: 100%;
  }
`;
export const TextContainer = styled.div<ContainerType>`
  flex: 1;
  padding: ${({ reverse }) => (reverse ? '0 0 0 3em' : '0 3em 0 0')};

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
