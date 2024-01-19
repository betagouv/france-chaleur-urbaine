import { CSSProperties, PropsWithChildren } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers';

type TextType = 'p' | 'div' | 'span' | 'strong';
type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'lead';

// used in figma but not in dsfr
const legacyColors = {
  lightblue: '#4550E5',
  purple: 'var(--blue-france-main-525)',
  darkblue: 'var(--blue-france-sun-113-625)',
  lightgrey: '#78818D',
} as const;

type LegacyColor = keyof typeof legacyColors;

interface TextProps extends SpacingProperties {
  as?: TextType;
  size?: TextSize;
  color?: 'grey' | 'info' | 'success' | 'warning' | 'error';
  legacyColor?: LegacyColor;
  fontWeight?: 'light' | 'regular' | 'bold' | 'heavy';
  fontStyle?: 'normal' | 'italic';
}

/**
 * Renders a paragraph element.
 * Usage:
 *   <Text> => <p>
 */
function Text(props: PropsWithChildren<TextProps>) {
  const Type = props.as ?? 'p';
  if (props.color && props.legacyColor) {
    throw new Error('cannot use color and legacyColor at the same time');
  }
  const style: CSSProperties = {
    fontStyle: props.fontStyle ?? 'normal',
    color: props.color
      ? `var(--text-default-${props.color})`
      : props.legacyColor
      ? legacyColors[props.legacyColor]
      : undefined,
  };

  return (
    <Type
      className={`
      fr-text--${props.size ?? 'md'}
      fr-text--${props.fontWeight ?? 'regular'}
      fr-mb-0
      ${spacingsToClasses(props)}`}
      style={style}
    >
      {props.children}
    </Type>
  );
}
export default Text;
