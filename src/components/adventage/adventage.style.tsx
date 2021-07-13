import styled from 'styled-components';

export const HighlightCard = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  > img {
    min-width: 75px;
    margin-right: 32px;
  }
  > div {
    border-left: 0.25rem solid #00eb5e;
  }
`;
export const PageTitle = styled.h3`
  color: #000091;
`;
