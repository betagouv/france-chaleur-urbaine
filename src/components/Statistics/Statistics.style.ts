import styled from 'styled-components';

export const Container = styled.div`
  font-weight: 500;
  h2,
  h3 {
    color: var(--bf500);
  }
`;

export const StatisticsSliceContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 32px 0;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

export const Column = styled.div`
  :nth-child(even) {
    padding-left: 1rem;
  }
  :nth-child(odd) {
    padding-right: 1rem;
  }
`;

export const GraphsWrapper = styled.div`
  border: #e3e8f3 solid 1px;
  border-radius: 10px;
  width: 100%;
`;

export const NumberColumn = styled.div`
  display: flex;
  flex-wrap: wrap;
  height: 100%;
  align-content: flex-start;
  gap: 24px 0;

  border: #e3e8f3 solid 1px;
  border-radius: 10px;
  padding: 2rem;
`;

export const NumberBlock = styled.div``;

export const NumberHighlight = styled.div`
  color: #4550e5;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 1rem;
  span {
    display: inline-flex;
    vertical-align: top;
  }
`;

export const NumberHoverableIcon = styled.span`
  color: var(--text-default-grey);
  font-size: 1rem;
  > div {
    top: 0px;
  }
`;

export const NumberItalicText = styled.span`
  font-style: italic;
  font-size: 0.8rem;
`;
