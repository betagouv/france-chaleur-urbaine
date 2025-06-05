interface SVGIcon extends React.FunctionComponent<React.SVGAttributes<HTMLOrSVGElement>> {}

declare module '*.svg?icon' {
  const content: SVGIcon;
  export default content;
}

import type { JSX as Jsx } from 'react/jsx-runtime';

declare global {
  namespace JSX {
    type ElementClass = Jsx.ElementClass;
    type Element = Jsx.Element;
    type IntrinsicElements = Jsx.IntrinsicElements;
  }
}
