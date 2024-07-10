import styled, { css } from 'styled-components';

export const SliceSection = styled.section<{ theme?: string }>`
  ${({ theme }) => {
    switch (theme) {
      case 'blue-background': {
        // Hack to display the contact form in blue in the accueil page
        return css`
          background-color: #4550e5;
        `;
      }
      case 'color': {
        return css`
          background-color: #4550e5;
          color: #fff;

          p,
          strong,
          em,
          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            color: #fff !important;
          }
        `;
      }

      case 'color-light': {
        return css`
          background-color: #666dff;
          color: #fff;

          p,
          strong,
          em,
          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            color: #fff !important;
          }
        `;
      }
      case 'grey': {
        return css`
          background-color: var(--background-contrast-grey);
        `;
      }
    }
  }}
`;

export type SliceContainerWrapperType = {
  bg?: string;
  bgPos?: string;
  bgSize?: string;
  bgColor?: string;
};

const bgUrl = css<SliceContainerWrapperType>`
  ${({ bg }) => (bg ? `url(${bg})` : '')}
`;

export const SliceContainerWrapper = styled.div<SliceContainerWrapperType>`
  max-width: 100%;

  ${({ bg }) =>
    bg
      ? css`
          background-image: ${bgUrl};
        `
      : ''};
  ${({ bgColor }) =>
    bgColor
      ? css`
          background-color: ${bgColor};
        `
      : ''};
  background-repeat: no-repeat;
  background-size: ${({ bgSize }) => bgSize || 'auto'};
  background-position: ${({ bgPos }) => bgPos || 'center'};
  background-size: cover;
`;

export const SliceContainer = styled.div`
  max-width: 78rem;

  .slice-header {
    text-align: center;
  }
`;

export const SliceBody = styled.div<{
  direction?: string;
  justifyContent?: string;
}>`
  display: flex;
  flex-direction: column;
  ${({ justifyContent }) =>
    justifyContent && `justify-content: ${justifyContent};`}

  @media (min-width: 992px) {
    flex-direction: ${({ direction }) => direction || 'column'};
  }
`;

export const SliceHiddenImg = styled.img`
  opacity: 0;
`;
