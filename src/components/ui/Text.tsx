import { CSSProperties, HTMLAttributes, PropsWithChildren } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers/spacings';
import { LegacyColor, legacyColors } from './helpers/colors';

type TextType = 'h6' | 'label' | 'p' | 'div' | 'span' | 'strong' | 'blockquote';
type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'lead';

interface Label {
  htmlFor?: string | undefined;
}

interface TextProps
  extends SpacingProperties,
    HTMLAttributes<HTMLDivElement>,
    Label {
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
  cursor?: CSSProperties['cursor'];
  underline?: boolean;
  className?: string;
  maxWidth?: `${number}w`;
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
  cursor,
  display,
  underline,
  maxWidth,
  className,
  size,
  fontWeight,
  children,
  ...props
}: PropsWithChildren<TextProps>) {
  const Type: any = as ?? 'p';
  if (color && legacyColor) {
    throw new Error('cannot use color and legacyColor at the same time');
  }
  const style: CSSProperties = {
    fontSize: fontSize ?? 'inherit',
    lineHeight: lineHeight ?? 'inherit',
    fontStyle: fontStyle ?? 'normal',
    color: color
      ? `var(--text-default-${color})`
      : legacyColor
      ? legacyColors[legacyColor]
      : undefined,
    textAlign: textAlign,
    cursor: cursor,
    display: display,
    textDecoration: underline ? 'underline' : undefined,
    maxWidth: maxWidth ? `${parseInt(maxWidth.slice(0, -1)) * 8}px` : undefined,
  };

  return (
    <Type
      className={`
      ${className ?? ''}
      ${size ? `fr-text--${size}` : ''}
      ${fontWeight ? `fr-text--${fontWeight}` : ''}
      fr-mb-0
      ${spacingsToClasses(props)}`}
      style={style}
      {...props}
    >
      {children}
    </Type>
  );
}
export default Text;
