import { createGlobalStyle, css } from 'styled-components';

// This code is an Styled-Component adaptation of the project from https://github.com/jonsuh/hamburgers

// Settings
// ==================================================
const hamburgerPaddingX = '15px';
const hamburgerPaddingY = '15px';
const hamburgerLayerWidth = '25px';
const hamburgerLayerHeight = '2px';
const hamburgerLayerSpacing = '6px';
const hamburgerLayerColor = '#000';
const hamburgerLayerBorderRadius = '4px';
const hamburgerHoverOpacity = '0.7';
const hamburgerActiveLayerColor = hamburgerLayerColor;
const hamburgerActiveHoverOpacity = hamburgerHoverOpacity;

// To use CSS filters as the hover effect instead of opacity,
// set ${hamburgerHoverUseFilter} as true and
// change the value of ${hamburgerHoverFilter} accordingly.
const hamburgerHoverUseFilter = false;
const hamburgerHoverFilter = 'opacity(50%)';
const hamburgerActiveHoverFilter = hamburgerHoverFilter;

// Types (Remove or comment out what you don’t need)
// ==================================================
export const BurgerStyle = createGlobalStyle`
  // Hamburger
  // ==================================================
  .hamburger {
    padding: ${hamburgerPaddingY} ${hamburgerPaddingX};
    display: inline-block;
    cursor: pointer;

    transition-property: opacity, filter;
    transition-duration: 0.15s;
    transition-timing-function: linear;

    // Normalize (<button>)
    font: inherit;
    color: inherit;
    text-transform: none;
    background-color: transparent;
    border: 0;
    margin: 0;
    overflow: visible;

    &:hover {
      ${
        hamburgerHoverUseFilter
          ? css`
              filter: ${hamburgerHoverFilter};
            `
          : css`
              opacity: ${hamburgerHoverOpacity};
            `
      }
    }

    &.isActive {
      &:hover {
        ${
          hamburgerHoverUseFilter
            ? css`
                filter: ${hamburgerActiveHoverFilter};
              `
            : css`
                opacity: ${hamburgerActiveHoverOpacity};
              `
        }
      }

      .hamburger-inner,
      .hamburger-inner::before,
      .hamburger-inner::after {
        background-color: ${hamburgerActiveLayerColor};
      }
    }
  }

  .hamburger-box {
    width: ${hamburgerLayerWidth};
    height: calc(${hamburgerLayerHeight} * 3 + ${hamburgerLayerSpacing} * 2);
    display: inline-block;
    position: relative;
  }

  .hamburger-inner {
    display: block;
    top: 50%;
    margin-top: calc(${hamburgerLayerHeight} / -2);

    &,
    &::before,
    &::after {
      width: ${hamburgerLayerWidth};
      height: ${hamburgerLayerHeight};
      background-color: ${hamburgerLayerColor};
      border-radius: ${hamburgerLayerBorderRadius};
      position: absolute;
      transition-property: transform;
      transition-duration: 0.15s;
      transition-timing-function: ease;
    }

    &::before,
    &::after {
      content: "";
      display: block;
    }

    &::before {
      top: calc((${hamburgerLayerSpacing} + ${hamburgerLayerHeight}) * -1);
    }

    &::after {
      bottom: calc((${hamburgerLayerSpacing} + ${hamburgerLayerHeight}) * -1);
    }
  }

  /*
   * Slider
   */
  .hamburger--slider {
    .hamburger-inner {
      top: calc(${hamburgerLayerHeight} / 2);

      &::before {
        top: calc(${hamburgerLayerHeight} + ${hamburgerLayerSpacing});
        transition-property: transform, opacity;
        transition-timing-function: ease;
        transition-duration: 0.15s;
      }

      &::after {
        top: calc((${hamburgerLayerHeight} * 2) + (${hamburgerLayerSpacing} * 2));
      }
    }

    &.is-active {
      .hamburger-inner {
        transform: translate3d(0, calc(${hamburgerLayerSpacing} + ${hamburgerLayerHeight}), 0) rotate(45deg);

        &::before {
          transform: rotate(-45deg) translate3d(calc(${hamburgerLayerWidth} / -7), calc(${hamburgerLayerSpacing} * -1), 0);
          opacity: 0;
        }

        &::after {
          transform: translate3d(0, calc((${hamburgerLayerSpacing} + ${hamburgerLayerHeight}) * -2), 0) rotate(-90deg);
        }
      }
    }
  }
`;
