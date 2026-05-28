declare module '*.svgr' {
  import type { FC, SVGProps } from 'react';

  const SVG: FC<SVGProps<SVGSVGElement>>;
  export default SVG;
}
