import styled from 'styled-components';

export const CityContainer = styled.div`
  .classed-network,
  .classed-network strong,
  .city-description,
  .city-description strong {
    color: #000091;
  }

  .form-title {
    color: #2731b1;
  }

  .bareme-block {
    .slice-header h2 {
      max-width: 600px;
      margin: auto;
    }
  }

  .fcuCoproGuide {
    margin-bottom: 16px;
  }

  .map-wrap {
    min-height: 500px;
  }
`;

export const Title = styled.div`
  h2 {
    color: #000091;
    b {
      color: #4550e5;
    }
    font-size: 33px;
    font-weight: 600;
    line-height: 51px;
  }
  h3 {
    font-size: 24px;
    font-weight: 600;
    line-height: 30px;
  }
`;

export const ContainerDispositifs = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 32px 0;

  @media (min-width: 540px) {
    .dispositif-column:nth-child(even) {
      padding-left: 16px;
    }
    .dispositif-column:nth-child(odd) {
      padding-right: 16px;
    }
  }
`;

export const Image = styled.img`
  height: 65px;
  width: fit-content;
`;

export const ColumnVideoGuide = styled.div`
  margin-left: auto;
  margin-right: auto;
  h3 {
    color: #000074;
  }
  iframe {
    aspect-ratio: 16 / 9;
  }
`;

export const SimulatorsContainer = styled.div`
  h2 {
    font-size: 20px;
    font-weight: 700;
    line-height: 25px;
    margin-bottom: 32px;
  }
  em,
  strong {
    font-size: 16px;
    line-height: 24px;
  }
  .simulator-result {
    width: 100%;
    color: #000091;
  }
`;
