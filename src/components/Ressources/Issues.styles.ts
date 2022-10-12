import { Card } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

export const Arrow = styled.div`
  flex: 0 0 auto;
  cursor: pointer;
  width: 65px;
  height: 65px;
  background-color: #e7ebfc;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  span {
    color: #4366e9;
    margin: 0 !important;
  }
`;

export const IssuesCard = styled.div`
  flex: auto;
  display: flex;
  overflow: hidden;
  margin: 64px 0;
  padding: 8px;
  gap: 32px;
`;

export const Issue = styled(Card)<{ hide: boolean }>`
  flex: 0 0 auto;
  width: 300px;
  height: initial !important;
  ${({ hide }) => hide && 'display: none !important;'};
`;
