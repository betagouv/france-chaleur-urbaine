import styled, { css } from 'styled-components';

export const Cards = styled.div`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 32px;
`;

export const Card = styled.div<{ type?: string }>`
  max-width: 210px;
  min-width: 210px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: visible;
  flex: 1;
  ${({ type }) =>
    type === 'orange-circle' &&
    css`
      top: -50px;
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
