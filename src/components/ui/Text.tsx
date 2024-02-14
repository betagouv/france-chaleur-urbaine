import { CSSProperties, PropsWithChildren } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers/spacings';
import { LegacyColor, legacyColors } from './helpers/colors';

type TextType = 'p' | 'div' | 'span' | 'strong' | 'blockquote';
type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'lead';

interface TextProps extends SpacingProperties {
  as?: TextType;
  size?: TextSize | `${number}px`;
  fontSize?: string;
  color?: 'grey' | 'info' | 'success' | 'warning' | 'error';
  legacyColor?: LegacyColor;
  fontWeight?: 'light' | 'regular' | 'bold' | 'heavy';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'center';
  underline?: boolean;
  className?: string;
  maxWidth?: `${number}w`;
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
    fontSize: props.fontSize ?? 'inherit',
    fontStyle: props.fontStyle ?? 'normal',
    color: props.color
      ? `var(--text-default-${props.color})`
      : props.legacyColor
      ? legacyColors[props.legacyColor]
      : undefined,
    textAlign: props.textAlign,
    textDecoration: props.underline ? 'underline' : undefined,
    maxWidth: props.maxWidth
      ? `${parseInt(props.maxWidth.slice(0, -1)) * 8}px`
      : undefined,
  };

  return (
    <Type
      className={`
      ${props.className ?? ''}
      ${props.size ? `fr-text--${props.size}` : ''}
      ${props.fontWeight ? `fr-text--${props.fontWeight}` : ''}
      fr-mb-0
      ${spacingsToClasses(props)}`}
      style={style}
    >
      {props.children}
    </Type>
  );
}
export default Text;
