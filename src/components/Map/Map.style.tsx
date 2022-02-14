import styled, { createGlobalStyle, css } from 'styled-components';

export const MapGlobalStyle = createGlobalStyle`
  .my-div-icon {
    position: relative;

    i {
      position: relative;
      display: block;
      transform-origin: bottom;

      ::before {
        content: "";
        display: block;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 2.5rem;
        height: 2.5rem;
        background-color: #4550e5;
        border:2px solid white;
        border-radius: 50% 45% 75% 0% / 75% 45% 50% 0%;
        transform-origin: bottom left;
        transform: translateX(6px) translateY(-3px) rotate(-45deg);
        box-shadow: -3px 3px 4px 3px rgb(0 0 0 / 35%)
      }

      ::after {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 1.3rem;
        height: 1.3rem;
        border:5px double white;
        border-radius: 50%;
        transform: translateX(6px) translateY(-3px) translateX(-.65rem) translateY(-.65rem) translateY(-1.8rem);
      }
    }
  }

  .pan-map-aside {
    width: 100%;
  }
`;

export const LegendGlobalStyle = createGlobalStyle`
  .legend-heat-network {
    width: 1.5rem;
    height: 1rem;
    display: inline-flex;
    vertical-align: text-bottom;
    justify-content: center;
    align-items: center;

    :before {
      content: '';
      display: block;
      width: 100%;
      height: 0;
      border: 3px solid #2d9748;
      border-radius: 3px;
      margin-bottom: calc(0.25em - 1.5px)
    }
  }
  .legend-substation {
    width: 1.5rem;
    height: 1rem;
    display: inline-flex;
    vertical-align: text-bottom;
    justify-content: center;
    align-items: center;

    :before {
      content: '';
      display: block;
      width: 1rem;
      height: 1rem;
      border: 3px solid #ff00d4;
      border-radius: 50%;
      background-color: #ff00d4;
      margin-bottom: calc(0.25em - 1.5px)
    }
  }
  .legend-boiler-room {
    width: 1.5rem;
    height: 1rem;
    display: inline-flex;
    vertical-align: text-bottom;
    justify-content: center;
    align-items: center;

    :before {
      content: '';
      display: block;
      width: 1.5rem;
      height: 1rem;
      border: 3px solid #ff6600;
      border-radius: 3px;
      background-color: #ff660088;
      margin-bottom: calc(0.25em - 1.5px)
    }
  }
`;

export const MapWrapper = styled.div`
  height: 100%;
  width: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
`;

export const MapControlWrapper = styled.div`
  position: absolute;
  z-index: 401;
  top: 0;
  font-size: 1rem;
  padding: 1em;
  top: 0;
  bottom: 0;
  right: 0;
  width: calc(22.5% + 2em);

  :before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 1px 0 4px 1px rgb(0 0 0 / 20%);
    z-index: -1;

    transform: translateX(105%);
    transition: transform ease-in-out 0.5s;
  }
`;

type MapAsideContainerType = {
  top?: boolean;
  bottom?: boolean;
};

export const MapAsideContainer = styled.div<MapAsideContainerType>`
  position: absolute;
  z-index: 401;
  font-size: 1rem;
  padding: 1em;
  max-height: 100%;
  left: 0;
  right: 0;

  ${({ bottom }) =>
    bottom
      ? css`
          bottom: 0;
        `
      : css`
          top: 0;
        `}

  overflow-y: overlay;

  &.search-result {
    padding-top: 3.5rem;
  }
`;

export const InputSearch = styled.input.attrs({ type: 'text' })`
  width: 100%;
  box-sizing: border-box;
  padding: 0.5em;
  line-height: 1em;
  border-radius: 0.3em;
  font-size: 1rem;
  color: var(--bf500);
  border: 2px solid var(--bf500);

  transition-property: border-color, color;
  transition-timing-function: ease;
  transition-duration: 0.5s;

  outline: 0px none transparent;

  box-shadow: 1px 0 4px 1px rgb(0 0 0 / 20%);

  :placeholder-shown:not(:focus) {
    border: 2px solid rgb(0 0 0 / 20%);
  }
`;
