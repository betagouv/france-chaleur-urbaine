import styled, { css } from 'styled-components';

export const BannerContainer = styled.section<{ pattern?: string }>`
  ${({ pattern }) => {
    switch (pattern) {
      case 'color': {
        return css`
          background-color: #4550e5;
          color: #fff;
        `;
      }
      case 'grey': {
        return css`
          background-color: #f9f8f6;
        `;
      }
    }
  }}
`;
