import Button from '@codegouvfr/react-dsfr/Button';
import styled, { css } from 'styled-components';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';

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

export const ResultsPlaceholder = styled.div`
  background-color: var(--background-alt-grey);
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-disabled-grey);
  gap: 56px;
  padding: 64px 32px;
`;

export const Simulator = styled.div<{ $loading?: boolean }>`
  ${({ $loading }) =>
    $loading &&
    css`
      position: relative;
      &:after {
        content: 'Chargement en cours...';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: flex-start;
        padding-top: 100px;
        justify-content: center;
        color: black;
        font-size: 30px;
        font-weight: bold;
        background: rgba(255, 255, 255, 0.7);
        z-index: 1000;
      }
    `}

  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 32px 0;
  align-items: flex-start;

  ${({ theme }) => theme.media.lg`
    flex-direction: row;
    gap: 32px;

    > div:nth-child(2) {
      flex: 2;
      position: sticky;
      top: 0;
    }

    > div:nth-child(1) {
      flex: 1;
    }
  `}
`;

export const FloatingButton = styled(Button)`
  position: fixed;
  right: -80px;
  transform: rotate(-90deg);
  justify-content: center;
  width: 200px;
  top: 60%;
  z-index: 1;
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

export const GraphTooltip = styled.div`
  display: flex;
  gap: 8px;
  height: 100%;
  font-size: 14px;
  margin-right: 8px;
  align-items: center;

  span {
    white-space: nowrap;
  }

  span:first-child {
    width: 50px;
    display: block;
    height: 100%;
  }
`;

export const Title = styled(Heading).attrs({ as: 'h2', size: 'h6' })`
  font-size: 1rem;
  line-height: 1.5rem;
  margin-top: 32px;
  margin-bottom: 16px;
`;

export const Separator = styled.hr``;
