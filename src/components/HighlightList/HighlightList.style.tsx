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
    left: calc(64px + 32px);
    width: 0.25rem;
    height: 110px;
    background-color: #00eb5e;
  }

  > img {
    min-width: 64px;
    margin-right: 64px;
  }
`;

export const PageTitle = styled.h2`
  color: #000091;
  margin-bottom: 32px;
  text-align: center;
`;
