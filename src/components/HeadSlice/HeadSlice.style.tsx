import styled, { css } from 'styled-components';

export const HeadSliceContainer = styled.div<{ needGradient?: boolean }>`
  background: transparent;
  min-height: 630px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ needGradient }) =>
    needGradient &&
    css`
      background-image: linear-gradient(90deg, #cde3f000 45%, #cde3f0 60%);
    `}

  @media (max-width: 990px) {
    margin: 0 -1rem;
    padding: 0 1rem;
    background-color: rgba(256, 256, 256, 0.8);
    background-image: linear-gradient(
      to bottom,
      transparent,
      rgb(79 173 199 / 50%)
    );
  }

  @media (max-width: 1440px) {
    background-size: cover;
    background-position: left center;
  }
`;

export const Container = styled.div`
  @media (min-width: 992px) {
    padding-left: 3rem;
    margin-left: 50%;
  }
`;

export const PageTitlePreTitle = styled.span`
  color: #000074;
  display: block;
  font-size: 2.06rem;
`;

export const PageTitle = styled.h1`
  color: #4550e5;
  font-size: 2.815rem;
  line-height: 3rem;
  letter-spacing: -0.03rem;
`;

export const PageBody = styled.div`
  color: #000074;
  font-size: 1.5rem;
  line-height: 2.25rem;
  font-weight: bold;

  p {
    font-size: 1em;
    line-height: 1.5em;
  }

  h1 {
    color: #4550e5;
    font-size: 2em;
    line-height: 1.1;
    letter-spacing: -0.01em;
    margin-bottom: 0.2em;
  }
`;

export const FormLabel = styled.div`
  /* color: #4550e5; TODO: Limit colors in style */
  color: #2731b1;
  font-weight: 500;
  letter-spacing: -0.05rem;
  font-size: 1.25rem;
`;
