import { css, FlattenSimpleInterpolation, SimpleInterpolation } from 'styled-components';

const breakpoints = {
  xs: 320,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  '2xl': 1400,
};

export type Breakpoint = keyof typeof breakpoints;
export type BreakpointFunction = (...args: SimpleInterpolation[]) => FlattenSimpleInterpolation;

interface Media {
  xs: BreakpointFunction;
  sm: BreakpointFunction;
  md: BreakpointFunction;
  lg: BreakpointFunction;
  xl: BreakpointFunction;
  '2xl': BreakpointFunction;
}

const mediaQuery = (breakpoints: { [key in Breakpoint]: number }): Media => {
  return Object.keys(breakpoints).reduce((acc, label) => {
    const breakpoint = label as Breakpoint;
    acc[breakpoint] = (...args: SimpleInterpolation[]) => css`
      @media (min-width: ${breakpoints[breakpoint]}px) {
        ${
          // @ts-expect-error args is not correctly inferred for an unknown reason
          css(...args)
        }
      }
    `;
    return acc;
  }, {} as Media);
};

const theme = {
  breakpoints,
  media: mediaQuery(breakpoints),
};

export type Theme = typeof theme;

export default theme;
