import styled from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => theme.media.md`
    margin-left: 32px;
  `}
`;

export const Title = styled.h1`
  color: var(--legacy-darker-blue);
  font-size: 43px;
  line-height: 44px;
  font-weight: 400;
  margin: 64px 0;
`;

export const Description = styled.div`
  color: var(--legacy-darker-blue);
  margin: 32px 0;
  li {
    cursor: pointer;
  }
`;
