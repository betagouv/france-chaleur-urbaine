import styled, { css } from 'styled-components';

export const SliceSection = styled.section<{ theme?: string }>`
  ${({ theme }) => {
    switch (theme) {
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

export const SliceContainer = styled.div`
  max-width: 100%;
`;
