import styled, { createGlobalStyle } from 'styled-components';
import {
  themeDefDemands,
  themeDefHeatNetwork,
  themeDefZoneDP,
} from '../../../services/Map/businessRules';

export const MapGlobalStyle: any = createGlobalStyle` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
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

export const LegendGlobalStyle: any = createGlobalStyle` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
  hr {
    border: 1px solid #4550e5;
    border-width: 0 0 1px;
    margin: .75em 1.25em;
    height: 0;
  }

  .legend-futur-heat-network-marker,
  .legend-classed-heat-network-marker,
  .legend-heat-network-marker {
    top: -3px;
    :before {
      border-radius: 4px;
      margin: 0 4px;
      width: 100%;
      height: 0 !important;
      margin-bottom: calc(0.25em - 1.5px)
    }
  }

  .legend-heat-network-marker {
    :before {
      border-top: 8px solid ${themeDefHeatNetwork.outline.color};
    }
  }

  .legend-classed-heat-network-marker {
    :before {
      border-top: 8px solid ${themeDefHeatNetwork.classed.color};
    }
  }

  .legend-futur-heat-network-marker {
    margin-bottom: 0;
    :before {
      border-top: 8px solid ${themeDefHeatNetwork.futur.color};
    }
  }
  
  .legend-futur-heat-network-zone-marker {
    margin-top: 0;
    :before {
      margin: 0 4px;
      width: 32px;
      background-color: ${themeDefHeatNetwork.futur.color};
      opacity: 0.46;
      margin-bottom: calc(0.25em - 1.5px)
    }
  }

  .legend-zoneDP-marker {
    :before {
      margin: 0 4px;
      width: 32px;
      background-color: ${themeDefZoneDP.fill.color};
      opacity: ${themeDefZoneDP.fill.opacity};
      margin-bottom: calc(0.25em - 1.5px)
    }
  }

  .legend-demands-marker {
    :before {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: ${themeDefDemands.fill.color};
      border: 2px solid ${themeDefDemands.stroke.color};
    }
  }
  .legend-raccordements-marker {
    :before {
      width: 14px;
      height: 14px;
      background-color: ${themeDefHeatNetwork.classed.color};
    }
  }

  .legend-energy-marker {
    width: .6rem;

    ::before {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      margin-bottom: calc(0.25em - 1.5px);
    }
  }
`;

export const LegendButton = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 8px;
`;

export const Sources = styled.div`
  color: #8d93a1;
  font-size: 10px;
  position: relative;
  a {
    position: absolute;
    top: -16px;
  }
`;
