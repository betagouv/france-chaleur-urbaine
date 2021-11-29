import styled from 'styled-components';

export const HighlightCard = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  position: relative;

  h4 {
    color: #4550e5;
  }

  &::before {
    content: '';
    display: block;
    position: absolute;
    left: calc(64px + 32px - 0.25rem);
    width: 0.25rem;
    height: 110px;
    background-color: #00eb5e;
  }

  > img {
    min-width: 64px;
    margin-right: 64px;
  }

  .md-wrapper {
    p {
      font-size: 1.25rem;
      line-height: 2rem;
      line-height: 1.6em;
    }
    strong {
      color: #4550e5;
    }
    em {
      font-size: 0.8em;
      line-height: 1em;
    }
  }
`;

export const PageTitle = styled.h2`
  color: #000091;
  margin-bottom: 32px;
  text-align: center;
`;

export const HighlightListWrapper = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: 990px) {
    flex-direction: row;
  }
`;

export const HighlightWrapper = styled.div`
  @media (max-width: 990px) {
    margin: 1rem 0;
  }
`;
