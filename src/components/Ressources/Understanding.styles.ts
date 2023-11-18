import { Card } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const UnderstandingCards = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  gap: 32px;
  justify-content: center;
`;

export const UnderstandingCard = styled(Card)`
  width: 270px;
  p {
    color: black !important;
  }
`;

export const CardContainer = styled.div`
  position: relative;
`;

export const BottomLink = styled.div`
  color: black;
  position: absolute;
  bottom: 12px;
  right: 55px;
`;
