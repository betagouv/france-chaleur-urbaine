import styled from 'styled-components';

import { Container as HoverableIconContainer } from '@components/Hoverable/HoverableIcon.styles';

export const Title = styled.h1`
  color: var(--legacy-darker-blue);
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
    color: var(--legacy-darker-blue);
  }
`;

export const InformationsComplementairesBox = styled.div`
  padding: 32px;
  padding-bottom: 8px;
  border: 1px solid #e7e7e7;
  color: #4550e5;
  h3 {
    color: var(--legacy-darker-blue);
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
  align-items: center;
  gap: 16px;
  > div {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    ${HoverableIconContainer} {
      top: -2px;
    }
  }
`;

export const AddressContent = styled.div`
  text-align: right;
`;

export const MapContainer = styled.div`
  height: 655px;
`;

export const BoxIcon = styled.div`
  display: flex;
  align-items: center;

  h3 {
    ${HoverableIconContainer} {
      color: #4550e5;
    }
  }

  ${HoverableIconContainer} {
    top: -1px !important;
  }
`;
