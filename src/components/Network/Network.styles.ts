import styled from 'styled-components';

export const Title = styled.h1`
  color: #000074;
  margin-bottom: 0;
`;

export const BlueBox = styled.div`
  background-color: #4550e5;
  color: white;
  padding: 32px;

  h3 {
    color: white;
  }
`;

export const BoxSection = styled.div`
  padding: 32px;
  border: 1px solid #e7e7e7;
  color: #4550e5;
  h3 {
    color: #000074;
  }
`;

export const InformationsComplementairesBox = styled.div`
  padding: 32px;
  padding-bottom: 8px;
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
  gap: 16px;
`;

export const AddressContent = styled.div`
  text-align: right;
`;

export const MapContainer = styled.div`
  height: 655px;
`;

export const BoxIcon = styled.div`
  span {
    display: inline-flex;
  }
`;
