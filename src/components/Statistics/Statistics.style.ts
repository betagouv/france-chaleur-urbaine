import styled, { css } from 'styled-components';

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
  margin-bottom: 8px;
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

export const NumberContainer = styled.div<{ $orientation?: 'row' | 'col' }>`
  ${({ $orientation }) => css`
    display: flex;
    flex-wrap: wrap;
    height: 100%;
    align-content: flex-start;
    gap: 24px 8px;
    flex-direction: ${$orientation === 'row' ? 'row' : 'column'};
    ${$orientation === 'row' &&
    css`
      & > * {
        flex: 1;
      }
    `}
  `}
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
  [class*='fr-icon'] {
    margin-left: 0.5rem;
    color: var(--text-default-grey);
  }
`;
export const LoadingTextHighlight = styled.span`
  font-size: 24px;
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
