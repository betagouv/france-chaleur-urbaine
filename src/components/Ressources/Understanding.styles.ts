import { Card } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const UnderstandingCards = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 64px 0;
  padding: 8px;
  gap: 32px;
`;

export const UnderstandingCard = styled(Card)`
  width: 300px;
  height: initial !important;
  p {
    color: black !important;
  }
`;

export const BottomLink = styled.div`
  position: absolute;
  bottom: 12px;
  right: 55px;
`;
