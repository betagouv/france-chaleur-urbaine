declare module '@mapbox/geo-viewport';
declare module 'vt-pbf';

interface SVGIcon extends React.FunctionComponent<React.SVGAttributes<HTMLOrSVGElement>> {}

declare module '*.svg?icon' {
  const content: SVGIcon;
  export default content;
}
