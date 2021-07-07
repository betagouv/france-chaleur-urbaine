import styled from 'styled-components';

export const TextCard = styled.div`
  height: 280px;
  > p {
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
