import styled, { createGlobalStyle, css, keyframes } from 'styled-components';

export const SliceContactFormStyle = createGlobalStyle`
.slice-contact-form-wrapper {
  max-height: 0px;
  overflow: hidden;
  transition: max-height 1s ease;

  &.active {
    max-height: 500vh;
  }
}
`;

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
  /* color: #4550e5; TODO: Limit colors in style ? */
  color: #2731b1;
  font-weight: 500;
  letter-spacing: -0.05rem;
  font-size: 1.25rem;
`;

export const FormWarningMessage = styled.div<{ show?: boolean }>`
  font-weight: bold;
  padding: 0.2em 0 0.2em 1em;
  border-left: 3px solid var(--error);
  background-color: #ffffff66;
  opacity: 0;
  transition: opacity 0.25s ease;

  ${({ show }) =>
    show &&
    css`
      opacity: 1;
    `}
`;

const shadowRolling = keyframes`
  0% {
    box-shadow: 0px 0 transparent, 0px 0 transparent, 0px 0 transparent, 0px 0 transparent;
  }
  12% {
    box-shadow: 100px 0 currentColor, 0px 0 transparent, 0px 0 transparent, 0px 0 transparent;
  }
  25% {
    box-shadow: 110px 0 currentColor, 100px 0 currentColor, 0px 0 transparent, 0px 0 transparent;
  }
  36% {
    box-shadow: 120px 0 currentColor, 110px 0 currentColor, 100px 0 currentColor, 0px 0 transparent;
  }
  50% {
    box-shadow: 130px 0 currentColor, 120px 0 currentColor, 110px 0 currentColor, 100px 0 currentColor;
  }
  62% {
    box-shadow: 200px 0 transparent, 130px 0 currentColor, 120px 0 currentColor, 110px 0 currentColor;
  }
  75% {
    box-shadow: 200px 0 transparent, 200px 0 transparent, 130px 0 currentColor, 120px 0 currentColor;
  }
  87% {
    box-shadow: 200px 0 transparent, 200px 0 transparent, 200px 0 transparent, 130px 0 currentColor;
  }
  100% {
    box-shadow: 200px 0 transparent, 200px 0 transparent, 200px 0 transparent, 200px 0 transparent;
  }
`;

export const LoaderWrapper = styled.div<{ show?: boolean }>`
  position: relative;
  top: -35px;
  z-index: 0;
  opacity: 0;

  ${({ show }) =>
    show &&
    css`
      opacity: 1;
    `}
`;

export const Loader = styled.span<{ color?: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: block;
  margin: 15px auto;
  position: relative;
  color: ${({ color }) => color || 'currentColor'};
  left: -100px;
  box-sizing: border-box;
  animation: ${shadowRolling} 2s linear infinite;
`;
