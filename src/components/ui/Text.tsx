import { PropsWithChildren } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers';

type TextType = 'p' | 'div' | 'span' | 'strong';
type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'lead';

interface TextProps extends SpacingProperties {
  as?: TextType;
  size?: TextSize;
  color?: 'grey' | 'info' | 'success' | 'warning' | 'error';
  fontWeight?: 'light' | 'regular' | 'bold' | 'heavy';
}
/**
 * Renders a paragraph element.
 * Usage:
 *   <Text> => <p>
 */
function Text(props: PropsWithChildren<TextProps>) {
  const Type = props.as ?? 'p';
  return (
    <Type
      className={`
      fr-text--${props.size ?? 'md'}
      fr-text--${props.fontWeight ?? 'regular'}
      fr-mb-0
      ${spacingsToClasses(props)}`}
      style={{
        color: `var(--text-default-${props.color ?? 'grey'})`,
      }}
    >
      {props.children}
    </Type>
  );
}
export default Text;
