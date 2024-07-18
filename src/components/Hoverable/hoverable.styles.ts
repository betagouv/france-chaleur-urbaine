import styled, { css } from 'styled-components';

export const Container = styled.div<{
  position: 'top' | 'right' | 'top-centered' | 'bottom' | 'bottom-centered' | 'left';
}>`
  display: none;
  width: max-content;
  position: absolute;
  ${({ position }) => {
    switch (position) {
      case 'right':
        return css`
          top: 50%;
          left: calc(100% + 8px);
          transform: translateY(-50%);
        `;
      case 'top-centered':
        return css`
          top: -8px;
          left: 50%;
          transform: translateX(-50%) translateY(-100%);
        `;
      case 'bottom':
        return css`
          top: 24px;
          right: 8px;
        `;
      case 'bottom-centered':
        return css`
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
        `;
      case 'left':
        return css`
          top: 80%;
          right: calc(100% + 8px);
        `;
      default:
        return css`
          bottom: 24px;
          right: 0;
        `;
    }
  }}
  background-color: black;
  z-index: 9999;
  color: white;
  font-size: 12px;
  line-height: 14px;
  border-radius: 4px;
  padding: 8px;
`;
