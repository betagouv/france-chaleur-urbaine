import styled, { css } from 'styled-components';

export const Container = styled.div<{
  position: 'top' | 'right' | 'top-centered';
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
      default:
        return css`
          bottom: 38px;
          right: 0;
        `;
    }
  }}
  background-color: black;
  color: white;
  font-size: 12px;
  line-height: 14px;
  border-radius: 4px;
  padding: 8px;
`;
