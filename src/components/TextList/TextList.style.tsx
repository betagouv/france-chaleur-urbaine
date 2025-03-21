import styled, { css } from 'styled-components';

export const Cards = styled.div`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 16px;
`;

export const Card = styled.div<{ type?: string }>`
  max-width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  overflow: visible;
  flex: 1;
  ${({ type }) =>
    type === 'orange-circle' &&
    css`
      max-width: 210px;
      min-width: 210px;
      padding: 16px;
      position: relative;
      justify-content: center;
      color: white;
      background-color: #f28c00;
      border-radius: 50%;
      height: 200px;
      width: 200px;
    `}
`;

export const Value = styled.span`
  font-size: 28px;
  line-height: 32px;
  font-weight: 700;
  margin-bottom: 4px;
`;

export const Description = styled.span`
  font-size: 18px;
  line-height: 23px;
`;
