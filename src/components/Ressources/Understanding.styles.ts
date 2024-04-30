import { Card } from '@codegouvfr/react-dsfr/Card';
import styled from 'styled-components';

export const UnderstandingCards = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  gap: 32px;
  justify-content: center;
  width: 100%;
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
