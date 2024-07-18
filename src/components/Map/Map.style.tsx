import styled, { createGlobalStyle, css } from 'styled-components';

export const mapControlZindex = 110;

export const mapMediumMedia = '@media (max-width: 1250px) ';

export const MapStyle: any = createGlobalStyle<{
  legendCollapsed: boolean;
  drawing: boolean;
  withTopLegend: boolean;
  withProMode: boolean;
  withHideLegendSwitch: boolean;
  withBorder: boolean;
}>` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
    .map-wrap {
      position: relative;
      display: flex;
      width: 100%;
      height: 100%;
      border: ${({ withBorder }) =>
        withBorder ? '1px solid #c3c3c3' : undefined}
    }

    .map, .maplibregl-map {
      position: absolute !important;
      left: ${({ legendCollapsed }) => (legendCollapsed ? '0px' : '333px')};
      ${({ withTopLegend }) => withTopLegend && 'top: 41px;'}
      width: ${({ legendCollapsed }) =>
        legendCollapsed ? '100%' : 'calc(100% - 333px) !important'};
      height: ${({ withTopLegend }) =>
        withTopLegend ? 'calc(100% - 41px) !important' : '100%'};
      ${({ withProMode, withHideLegendSwitch, legendCollapsed }) =>
        withProMode &&
        withHideLegendSwitch &&
        (legendCollapsed
          ? `@media (max-width: 600px) {
              top: 65px;
              height: calc(100% - 65px) !important;
            }`
          : `@media (max-width: 600px) {
              top: 41px;
              height: calc(100% - 41px) !important;
            }`)}

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

  max-width: calc(100vw - 333px - 40px);
  width: 1100px;
  padding: 32px;
  bottom: 0;
  left: ${({ legendCollapsed }) =>
    legendCollapsed ? '50vw' : 'calc((100vw - 333px)/2 + 333px)'};
  transform: translateX(-50%);

  ${mapMediumMedia} {
    left: 50vw;
    max-width: 100%;
  }
`;

export const LegendSideBar = styled.div<{
  legendCollapsed: boolean;
  withHideLegendSwitch?: boolean;
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
  width: 333px;
  min-width: 333px;
  background: var(--background-default-grey);
  border: 1px solid #dddddd;
  box-shadow:
    0px 16px 16px -16px rgba(0, 0, 0, 0.32),
    0px 8px 16px rgba(0, 0, 0, 0.1);
  ${({ withHideLegendSwitch, legendCollapsed }) =>
    withHideLegendSwitch &&
    !legendCollapsed &&
    css`
      top: 41px;
      position: absolute;
      height: calc(100% - 41px);
    `}
  }
`;

export const LegendContainer = styled.div<{
  withoutLogo?: boolean;
}>`
  ${({ withoutLogo }) => !withoutLogo && 'margin-bottom: 99px;'}
`;

export const LegendSeparator = styled.div`
  border: 1px solid #e1e1e1;
  margin: 16px;
`;

export const CollapseLegend = styled.button<{ legendCollapsed: boolean }>`
  position: absolute;
  padding: 0 0 0 22px;
  z-index: ${mapControlZindex + 1};
  left: ${({ legendCollapsed }) => (legendCollapsed ? '-23px' : '310px')};
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
  width: 332px;
  position: absolute;
  bottom: 0px;
  z-index: 9999;
  background: var(--background-default-grey);
  ${({ legendCollapsed }) => legendCollapsed && 'display: none;'}
  height:100px;
`;

export const LegendLogoLink = styled.a`
  width: 166px;
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
  width: 166px;
  background-color: var(--background-default-grey);
  img {
    width: 100%;
    vertical-align: middle;
  }
  display: inline-block;
`;

export const TopLegend = styled.div<{
  legendCollapsed: boolean;
}>`
  background-color: var(--background-default-grey);
  width: ${({ legendCollapsed }) =>
    legendCollapsed ? '100%' : 'calc(100% - 333px)'};
  @media (max-width: 600px) {
    width: 100%;
    display: block;
  }
  @media (max-width: 1251px) {
    display: flex;
  }
  height: fit-content;
  border-bottom: solid 1px #dddddd;

  .fr-toggle {
    width: fit-content;
    padding: 8px 16px;
  }

  .fr-toggle__label {
    color: var(--bf500);
    font-weight: bold;

    &::before {
      margin-top: 0;
      content: '' !important;
    }

    &::after {
      top: 8px;
      right: 32px !important;
    }
  }
`;

export const TopLegendSwitch = styled.div<{
  legendCollapsed?: boolean;
  isProMode?: boolean;
}>`
  margin-left: 24px;
  @media (max-width: 600px) {
    width: 100%;
    display: block;
  }
  .fr-toggle__label {
    color: var(--blue-france-113);
  }
  ${({ legendCollapsed, isProMode }) =>
    !legendCollapsed &&
    isProMode &&
    `@media (max-width: 600px) {
      display: none;
    }`}
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
