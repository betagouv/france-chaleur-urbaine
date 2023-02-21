import styled from 'styled-components';

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
