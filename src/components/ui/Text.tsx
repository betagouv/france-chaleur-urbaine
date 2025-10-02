import type { CSSProperties, HTMLAttributes, PropsWithChildren } from 'react';

import { type LegacyColor, legacyColors } from './helpers/colors';
import { type SpacingProperties, spacingsToClasses } from './helpers/spacings';

type TextType = 'h6' | 'label' | 'p' | 'div' | 'span' | 'strong' | 'blockquote';
type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'lead';

interface Label {
  htmlFor?: string | undefined;
}

interface TextProps extends SpacingProperties, HTMLAttributes<HTMLDivElement>, Label {
  as?: TextType;
  size?: TextSize | `${number}px`;
  fontSize?: string;
  lineHeight?: CSSProperties['lineHeight'];
  color?: 'grey' | 'info' | 'success' | 'warning' | 'error';
  display?: CSSProperties['display'];
  legacyColor?: LegacyColor;
  fontWeight?: 'light' | 'regular' | 'lightbold' | 'bold' | 'heavy';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'center';
  textTransform?: CSSProperties['textTransform'];
  cursor?: CSSProperties['cursor'];
  underline?: boolean;
  className?: string;
  maxWidth?: `${number}w`;
  style?: any;
}

/**
 * Renders a paragraph element.
 * Usage:
 *   <Text> => <p>
 */
function Text({
  as,
  color,
  fontSize,
  lineHeight,
  fontStyle,
  legacyColor,
  textAlign,
  textTransform,
  cursor,
  display,
  underline,
  maxWidth,
  className,
  size,
  fontWeight,
  style,
  children,
  ...props
}: PropsWithChildren<TextProps>) {
  const Type: any = as ?? 'p';
  if (color && legacyColor) {
    throw new Error('cannot use color and legacyColor at the same time');
  }
  const computedStyle: CSSProperties = {
    color: color ? `var(--text-default-${color})` : legacyColor ? legacyColors[legacyColor] : undefined,
    cursor,
    display,
    fontSize: fontSize ?? 'inherit',
    fontStyle: fontStyle ?? 'inherit',
    lineHeight: lineHeight ?? 'inherit',
    maxWidth: maxWidth ? `${parseInt(maxWidth.slice(0, -1), 10) * 8}px` : undefined,
    textAlign,
    textDecoration: underline ? 'underline' : undefined,
    textTransform,
    ...style,
  };

  return (
    <Type
      className={`
      ${className ?? ''}
      ${size ? `fr-text--${size}` : ''}
      ${fontWeight ? `fr-text--${fontWeight}` : ''}
      fr-mb-0
      ${spacingsToClasses(props)}`}
      style={computedStyle}
      {...props}
    >
      {children}
    </Type>
  );
}
export default Text;
