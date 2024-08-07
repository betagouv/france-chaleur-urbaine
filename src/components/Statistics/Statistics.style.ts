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
  ${({ theme }) => theme.media.md`
    :nth-child(even) {
      padding-left: 1rem;
    }
    :nth-child(odd) {
      padding-right: 1rem;
    }
  `}
`;

export const ColumnContainer = styled.div<{
  padding?: string;
}>`
  border: #e3e8f3 solid 1px;
  border-radius: 10px;
  padding: ${({ padding }) => padding || '2rem'};
  height: 100%;
`;

export const GraphsWrapper = styled.div`
  width: 100%;
`;

export const NumberContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  height: 100%;
  align-content: flex-start;
  gap: 24px 0;
`;

export const NumberBlock = styled.div`
  width: 100%;
`;

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
export const LoadingTextHighlight = styled.span`
  font-size: 24px;
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

export const NumberText = styled.span`
  font-size: 0.9rem;
`;

export const NumberSubText = styled.div`
  font-size: 0.8rem;
  line-height: 1.2rem;
`;

export const LastActuDate = styled.div`
  margin-bottom: 24px;
  font-size: 0.9rem;
`;

export const HorizontalSeparator = styled.div`
  width: 100%;
  border: 1px solid #e1e1e1;
`;
