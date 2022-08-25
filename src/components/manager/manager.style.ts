import styled from 'styled-components';

export const Filters = styled.div`
  display: flex;
  gap: 16px 32px;
  flex-wrap: wrap;
  > div {
    width: 350px;
    margin-bottom: 0 !important;
  }
`;

export const NoResult = styled.div`
  margin-top: 16px;
  font-size: 18px;
  font-weight: bold;
`;
