import { css } from 'styled-components';
import type { Interpolation } from 'styled-components/dist/types';

const breakpoints = {
  '2xl': 1400,
  lg: 992,
  md: 768,
  sm: 576,
  xl: 1200,
  xs: 320,
};

export type Breakpoint = keyof typeof breakpoints;
export type BreakpointFunction = (...args: Interpolation<Record<string, unknown>>[]) => ReturnType<typeof css>;

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
    acc[breakpoint] = (...args: Interpolation<Record<string, unknown>>[]) => css`
      @media (min-width: ${breakpoints[breakpoint]}px) {
        ${css(...(args as Parameters<typeof css>))}
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
