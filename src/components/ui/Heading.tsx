import { CSSProperties, PropsWithChildren } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers/spacings';
import { LegacyColor, legacyColors } from './helpers/colors';

type HeadingType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingSize = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

interface HeadingProps extends SpacingProperties {
  as?: HeadingType;
  size?: HeadingSize;
  color?: 'grey' | 'blue-france' | 'red-marianne';
  legacyColor?: LegacyColor;
  center?: boolean;
  id?: string;
}

/**
 * Renders a title element with a blue-france color by default.
 * Usage:
 *   <Heading> => <h1 class="fr-h1">
 *   <Heading as="h3" > => <h3 class="fr-h1">
 *   <Heading size="h3" > => <h1 class="fr-h3">
 */
function Heading(props: PropsWithChildren<HeadingProps>) {
  const Type = props.as ?? 'h1';

  if (props.color && props.legacyColor) {
    throw new Error('cannot use color and legacyColor at the same time');
  }
  const style: CSSProperties = {
    color: props.color
      ? `var(--text-title-${props.color})`
      : props.legacyColor
      ? legacyColors[props.legacyColor]
      : undefined,
    textAlign: props.center ? 'center' : undefined,
  };

  return (
    <Type
      className={`fr-${props.size ?? Type} ${
        props.center ? 'fr-text-center' : ''
      }
      ${spacingsToClasses(props)} ${props.className ?? ''}`}
      style={style}
      id={props.id}
    >
      {props.children}
    </Type>
  );
}
export default Heading;
