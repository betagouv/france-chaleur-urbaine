import { PropsWithChildren } from 'react';
import { SpacingProperties } from './helpers';

type HeadingType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingSize = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

interface HeadingProps extends SpacingProperties {
  as?: HeadingType;
  size?: HeadingSize;
  color?: 'grey' | 'blue-france' | 'red-marianne';
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
  return (
    <Type
      className={`fr-${props.size ?? Type}`}
      style={{ color: `var(--text-title-${props.color ?? 'blue-france'})` }}
    >
      {props.children}
    </Type>
  );
}
export default Heading;
