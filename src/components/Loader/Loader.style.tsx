import styled, { css, keyframes } from 'styled-components';

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

export const LoaderAnim = styled.span<{ color?: string }>`
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
