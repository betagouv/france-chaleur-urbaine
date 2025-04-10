declare module '*.svgr' {
  import { type FC, type SVGProps } from 'react';
  const SVG: FC<SVGProps<SVGSVGElement>>;
  export default SVG;
}
