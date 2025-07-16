import { type SpacingProperties, spacingsToClasses } from '@/components/ui/helpers/spacings';
import { ratioToHex } from '@/utils/strings';

interface IconPolygonProps extends SpacingProperties {
  stroke: `#${string}`;
  fillOpacity?: number;
  strokeWidth?: number;
}

const IconPolygon = ({ stroke, fillOpacity = 0.3, strokeWidth = 3, ...props }: IconPolygonProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 25 25" className={`${spacingsToClasses(props)}`}>
      <path fill={`${stroke}${ratioToHex(fillOpacity)}`} stroke={stroke} strokeWidth={strokeWidth} d="m2 2 22 10v11H2V2Z" />
    </svg>
  );
};

export default IconPolygon;
