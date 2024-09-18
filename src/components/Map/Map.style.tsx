import styled, { createGlobalStyle, css } from 'styled-components';

import Box from '@components/ui/Box';

export const mapControlZindex = 110;

export const mapMediumMedia = '@media (max-width: 1250px) ';

export const legendWidth = 345;

export const MapStyle: any = createGlobalStyle<{
  legendCollapsed: boolean;
  drawing: boolean;
  withBorder: boolean;
}>` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
    .map-wrap {
      position: relative;
      display: flex;
      width: 100%;
      height: 100%;
      border: ${({ withBorder }) => (withBorder ? '1px solid #c3c3c3' : undefined)}
    }

    .map, .maplibregl-map {
      position: absolute !important;
      left: ${({ legendCollapsed }) => (legendCollapsed ? '0px' : `${legendWidth}px`)};
      width: ${({ legendCollapsed }) => (legendCollapsed ? '100%' : `calc(100% - ${legendWidth}px) !important`)};

      ${({ drawing }) =>
        drawing &&
        `
      .maplibregl-canvas {
        cursor: crosshair;
      }`}
    }

    .popup-map-layer {
      z-index: ${mapControlZindex + 1};
      font-size: 14px;

      &.maplibregl-popup-anchor-left  .maplibregl-popup-tip {
        border-right-color: #4550e5;
      }
      &.maplibregl-popup-anchor-right  .maplibregl-popup-tip {
        border-left-color: #4550e5;
      }
      &.maplibregl-popup-anchor-top  .maplibregl-popup-tip {
        border-bottom-color: #4550e5;
      }
      &.maplibregl-popup-anchor-bottom  .maplibregl-popup-tip {
        border-top-color: #4550e5;
      }

      .maplibregl-popup-content{
        border: 2px solid #4550e5;
        border-radius: 0.3em;
        overflow: hidden;

        header {
          padding: 8px;
          margin: -15px -10px 10px;
          background-color: #4550e5;

          h6 {
            color: #fff;
            font-size: 15px;
            font-weight: bold;
            margin: 0;
          }
        }

        .maplibregl-popup-close-button {
          font-size: 1.5em;
          line-height: 0;
          font-weight: bold;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.25em;
          height: 1.25em;
          padding: 0 0 2px;
          margin: 3px;
          border-radius: 1em;
          transition-property: color, background-color;
          transition-duration: 0.25s;
          transition-timing-function: ease;

          &:hover {
            color: #4550e5;
            background-color: #fff;
          }
        }
      }
    }
    .popup-map-layer--standard {
      max-width: 300px !important;
    }
    .popup-map-layer--fluid {
      max-width: 500px !important;
    }
    /*HACK : keep the attributions links visible even when the scale legend is zoom at the max*/
    .maplibregl-control-container {
      .maplibregl-ctrl-bottom-right {
        width: calc(100% - 150px);
      }
    }
`;

// --------------------------
// --- Tooling components ---
// --------------------------

export const MapControlWrapper = styled.div<{ legendCollapsed: boolean }>`
  position: absolute;
  z-index: ${mapControlZindex};

  max-width: calc(100vw - ${legendWidth} - 40px);
  width: 1100px;
  padding: 32px;
  bottom: 0;
  left: ${({ legendCollapsed }) => (legendCollapsed ? '50vw' : `calc((100vw - ${legendWidth}px)/2 + ${legendWidth}px)`)};
  transform: translateX(-50%);

  ${mapMediumMedia} {
    left: 50vw;
    max-width: 100%;
  }
`;

export const LegendSideBar = styled.div<{
  legendCollapsed: boolean;
}>`
  z-index: ${mapControlZindex + 2};
  overflow: auto;
  ${({ legendCollapsed }) =>
    legendCollapsed &&
    css`
      // not visible so that collapsiblebox can be rendered and compute their height
      position: absolute;
      left: -150%;
    `}
  width: ${legendWidth}px;
  min-width: ${legendWidth}px;
  background: var(--background-default-grey);
  border: 1px solid #dddddd;
  box-shadow:
    0px 16px 16px -16px rgba(0, 0, 0, 0.32),
    0px 8px 16px rgba(0, 0, 0, 0.1);
`;

export const LegendContainer = styled.div<{
  withoutLogo?: boolean;
}>`
  ${({ withoutLogo }) => !withoutLogo && 'margin-bottom: 99px;'}
`;

export const LegendSeparator = styled.div`
  border: 1px solid #e1e1e1;
  margin: 16px 8px;
`;

export const CollapseLegend = styled.button<{ legendCollapsed: boolean }>`
  position: absolute;
  padding: 0 0 0 22px;
  z-index: ${mapControlZindex + 1};
  left: ${({ legendCollapsed }) => (legendCollapsed ? '-23px' : `calc(${legendWidth}px - 23px)`)};
  top: 50%;
  border-radius: 10px;
  background-color: var(--background-default-grey);
  border: solid 1px #dddddd;
  height: 60px;
  width: 51px;
  overflow: visible;
  // ugly hack => hover create issue in mobile
  @media (min-width: 520px) {
    &:hover {
      & > .hover-info {
        display: block;
      }
    }
  }
`;

export const LegendLogoList = styled.div<{
  legendCollapsed: boolean;
}>`
  width: calc(${legendWidth}px - 10px);
  position: absolute;
  bottom: 0;
  left: 5px;
  z-index: 9999;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: var(--background-default-grey);
  ${({ legendCollapsed }) => legendCollapsed && 'display: none;'}
  height:100px;
`;

export const LegendLogoLink = styled.a`
  flex: 1;
  background-color: var(--background-default-grey);
  img {
    width: 100%;
    vertical-align: middle;
  }
  display: inline-block;

  &::after {
    display: none !important;
  }
`;

export const LegendLogo = styled.div`
  flex: 1;
  background-color: var(--background-default-grey);
  img {
    width: 100%;
    vertical-align: middle;
  }
  display: inline-block;
`;

export const PopupTitle = styled.h3`
  font-size: 1.1rem;
  line-height: 1.5rem;
  margin-bottom: 8px;
`;

export const PopupType = styled.div`
  color: #78818d;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
`;

export const MapSearchInputWrapper = styled(Box).attrs({ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px' })`
  > div {
    flex: 1;
  }
`;

export const MapSearchWrapper = styled.div<{
  legendCollapsed?: boolean;
}>`
  position: absolute;
  background: var(--background-default-grey);
  padding: 10px;
  top: 0;
  left: 0;
  right: 0;
  border-radius: 8px 8px 0 0;
  background: #fff;
  margin: 20px 10vw;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 12px;
  font-size: 13px;
  line-height: 2;
  outline: none;
  overflow: auto;
  z-index: 2;

  > .fr-input-group {
    margin-bottom: 0.5rem;
  }

  > .fr-accordion > .fr-collapse--expanded {
    max-height: 50dvh; /* HACK as it's difficult to measure */
    overflow: auto;
  }

  ${({ theme }) => theme.media.lg`
    width: 320px;
    margin: 20px;
    > .fr-accordion > .fr-collapse--expanded {
      max-height: 70dvh; /* HACK as it's difficult to measure */
    }
  `}

  ${({ legendCollapsed, theme }) => !legendCollapsed && theme.media.lg`left: ${legendWidth}px;`}
`;
