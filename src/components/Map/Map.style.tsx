import styled, { createGlobalStyle, css } from 'styled-components';

export const MapGlobalStyle = createGlobalStyle`
.leaflet-container .leaflet-control-attribution {
  margin: 0.5em 0;
  padding: 0 0.5em;
  background: rgba(255, 255, 255, 0.85);
  font-weight: bold;
  padding-left: 3rem;
  position: relative;
}

.leaflet-control-attribution {
  position: relative;
  border-radius: 1em 0 0 1em;
  overflow: hidden;
  cursor: default;
  transform: translateX(calc(100% - 3em));

  transition: transform 0.4s ease;

  &::before {
    content: '©';
    position: absolute;
    left: 0;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    padding-left: 1.25em;
    padding-right: 0.5em;
    margin-right: 0.5em;
    margin-left: -0.5em;
    border-right: 1px solid #fff;
    background-color: #4550e5;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 0em;
    height: 0em;
    border: 0 none transparent;
    border-left: 0.5em solid transparent;
    border-right: 0.5em solid transparent;
    border-bottom: 0.5em solid #fff;
    transform: translateY(calc(-50% - .05em)) rotate(-90deg) translateY(.45em);
    transition: transform 0.5s ease;
  }

  &:hover {
    transform: translateX(0);

    &::after {
      transform: translateY(calc(-50% - .05em)) rotate(90deg) translateY(-.45em);
    }
  }

  a[target] {
    color: #4550e5;
    &::after {
      content: '';
    }
  }
}

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
  hr {
    border: 1px solid #4550e5;
    border-width: 0 0 1px;
    margin: .75em 2em;
    height: 0;
  }

  .legend {
    width: 0rem;
    height: 1rem;
    display: inline-flex;
    vertical-align: text-bottom;
    justify-content: center;
    align-items: center;
    margin-right: 0.2em;

    ::before {
      content: '';
      display: block;
      height: 1rem;
    }

  }

  .legend-heat-network {
    width: 1.5rem;

    :before {
      width: 100%;
      height: 0;
      border: 3px solid #2d9748;
      border-radius: 3px;
      margin-bottom: calc(0.25em - 1.5px)
    }
  }
  .legend-boiler-room {
    width: 1.5rem;

    :before {
      width: 100%;
      border: 3px solid #ff6600;
      border-radius: 3px;
      background-color: #ff660088;
      margin-bottom: calc(0.25em - 1.5px)
    }
  }
  .legend-substation {
    width: 1.5rem;

    :before {
      width: 1rem;
      border: 3px solid #ff00d4;
      border-radius: 50%;
      background-color: #ff00d4;
      margin-bottom: calc(0.25em - 1.5px)
    }
  }
  .legend-energy {
    width: .6rem;

    ::before {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      /* background-color: grey; */
      margin-bottom: calc(0.25em - 1.5px)
    }
  }

  .legend-heating {
    width: 0rem;
  }

`;

export const GroupeLabel = styled.div`
  padding-bottom: 0.8em;

  &:last-child {
    padding-bottom: 0;
  }

  header {
    font-weight: bold;
    margin-bottom: 0.5em;
  }

  .groupe-label-body {
    display: flex;
    flex-wrap: wrap;
    justify-content: stretch;
    align-items: stretch;

    .label-item {
      /* border: 1px solid rebeccapurple; */
      flex: 1;
      min-width: 30%;
      max-width: 100%;
      display: flex;
      text-align: left;
      justify-content: flex-start;

      label {
        display: inline;
        white-space: nowrap;

        &::before {
          width: 0.7em;
        }
      }
    }
  }
`;
export const LabelLegend = styled.span<{ bgColor: string }>`
  ::before {
    background-color: ${({ bgColor }) => bgColor || 'grey'};
  }
`;

export const MapWrapper = styled.div`
  height: 100%;
  width: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const maskTop = '3.5rem';
const maskBottom = '5rem';
const scrollSize = '20px';

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
  max-width: 22rem;
  min-width: 16.5rem;

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

  /*
  mask-image: linear-gradient(180deg, transparent 0, black 0%),
    linear-gradient(
      180deg,
      transparent 0,
      black ${maskTop},
      black calc(100% - ${maskBottom}),
      transparent 100%
    );
  mask-size: ${scrollSize}, calc(100% - ${scrollSize});
  mask-repeat: no-repeat, no-repeat;
  mask-position: right top, left top; 
  */

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
