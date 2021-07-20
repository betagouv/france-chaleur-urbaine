import styled from 'styled-components';

export const HighlightCard = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > div:not(:first-child) {
    border-left: 0.25rem solid #00eb5e;
  }
`;

export const BoxImage = styled.h3`
  margin-right: 32px;
`;

export const PageTitle = styled.h3`
  color: #000091;
`;
