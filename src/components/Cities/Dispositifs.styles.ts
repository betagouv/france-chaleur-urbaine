import styled from 'styled-components';

export const DispositifsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 32px 0;

  em,
  strong {
    font-size: 16px !important;
    line-height: 24px !important;
  }
`;

export const DispositifsColumn = styled.div`
  @media (min-width: 768px) {
    :nth-child(even) {
      padding-left: 16px;
    }
    :nth-child(odd) {
      padding-right: 16px;
    }
  }
`;

export const Title = styled.h3`
  font-size: 24px;
  font-weight: 600;
  line-height: 30px;
`;
