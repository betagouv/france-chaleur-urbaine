import styled from 'styled-components';

export const Title = styled.h1`
  color: #000074;
`;

export const BlueBox = styled.div`
  background-color: #4550e5;
  color: white;
  padding: 32px;

  h3 {
    color: white;
  }
`;

export const Box = styled.div`
  padding: 32px;
  border: 1px solid #e7e7e7;
  color: #4550e5;
  h3 {
    color: #000074;
  }
`;

export const Colmun = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const BoxContent = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const MapContainer = styled.div`
  height: 655px;
`;

export const BoxIcon = styled.div`
  span {
    display: inline-flex;
  }
`;
