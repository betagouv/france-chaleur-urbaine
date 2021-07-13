import styled from 'styled-components';

export const ExplainCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 280px;
  padding: 32px;
  overflow: visible;
  background: #f8f8f8;
  box-shadow: 0px 3px 5px 3px rgba(0, 0, 0, 0.1);
  > h4 {
    margin: 0;
    font-size: 21px;
    color: #000091;
  }
  > img {
    width: 87px;
  }
`;
export const PageTitle = styled.h2`
  color: #000091;
  font-size: 48px;
  margin-bottom: 32px;
`;
