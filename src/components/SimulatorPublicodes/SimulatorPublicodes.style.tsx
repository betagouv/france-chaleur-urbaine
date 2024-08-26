import Button from '@codegouvfr/react-dsfr/Button';
import styled from 'styled-components';

import Box from '@components/ui/Box';

export const Section = styled(Box).attrs({ as: 'section' })`
  margin: 32px 0;
  header {
    h2 {
      margin-bottom: 8px;
    }
    > div + div {
      display: inline-flex;
      margin-top: 16px;
    }

    ${({ theme }) => theme.media.lg`
      display: flex;
      align-items: flex-start;
      gap: 16px;
      justify-content: space-between;
    `}
  }
`;

export const Results = styled.div`
  display: none;
  ${({ theme }) => theme.media.lg`
    display: block;
  `}
`;

export const Simulator = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 32px 0;

  div:first-child {
    flex: 1;
  }
  ${Results} {
    flex: 2;
  }

  ${({ theme }) => theme.media.lg`
    flex-direction: row;
    gap: 32px;
  `}
`;

export const FloatingButton = styled(Button)`
  position: fixed;
  right: -80px;
  transform: rotate(-90deg);
  justify-content: center;
  width: 200px;
  top: 60%;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
  transition: right 0.3s ease;

  ${({ theme }) => theme.media.lg`
    display: none;
  `}
`;

export const ChartPlaceholder = styled.div`
  width: 100%;
  height: 600px;
  display: flex;
  border: 1px solid #f7f7f7;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  align-items: center;
`;
