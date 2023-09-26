import styled from 'styled-components';

export const ContainerNetwork = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 32px 0;

  .md-wrapper div,
  .md-wrapper div strong {
    color: #000091;
  }

  em,
  strong {
    font-size: 16px;
    line-height: 24px;
  }
`;

export const ColumnNetwork = styled.div`
  @media (min-width: 540px) {
    :nth-child(even) {
      padding-left: 16px;
    }
    :nth-child(odd) {
      padding-right: 16px;
    }
  }
`;
