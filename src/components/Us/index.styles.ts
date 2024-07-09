import styled from 'styled-components';

export const Title = styled.h2`
  color: #4550e5;
`;

export const Row = styled.div`
  display: flex;
  gap: 32px;
  a:not([href]) {
    cursor: default !important;
  }
`;

export const Logos = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 32px;
  a {
    background-image: unset;
    text-decoration: none;
    line-height: 0;
    ::after {
      display: none !important;
    }
  }
`;

export const Description = styled.div`
  font-size: 19px;
  font-weight: 700;
  line-height: 27px;
  color: var(--legacy-darker-blue);
  b {
    color: #4550e5;
  }
`;
