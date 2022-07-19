import styled from 'styled-components';

export const Graphs = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

export const GraphTitle = styled.h3`
  text-align: center;
`;

export const Container = styled.div`
  width: 100%;
  @media (min-width: 992px) {
    width: 50%;
  }
`;

export const GraphWrapper = styled.div`
  width: 100%;
  height: 400px;
`;
