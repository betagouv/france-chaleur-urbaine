import { CSSProperties, HTMLAttributes, PropsWithChildren } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers/spacings';
import styled, { IntrinsicElementsKeys } from 'styled-components';

type StyleProps = {
  display?: CSSProperties['display'];
  flexDirection?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
  gap?: CSSProperties['gap'];
  flex?: boolean;
  backgroundColor?: CSSProperties['backgroundColor'];
  textColor?: CSSProperties['color'];
  fontWeight?: 'light' | 'regular' | 'bold' | 'heavy';
  borderRadius?: CSSProperties['borderRadius'];
};

const StyledBox = styled.div<StyleProps>`
  display: ${({ display }) => display};
  flex-direction: ${({ flexDirection: direction }) => direction};
  align-items: ${({ alignItems }) => alignItems};
  justify-content: ${({ justifyContent }) => justifyContent};
  gap: ${({ gap }) => gap};
  flex: ${({ flex }) => (flex !== undefined ? (flex ? 1 : 0) : undefined)};
  background-color: ${({ backgroundColor }) =>
    backgroundColor
      ? backgroundColor?.startsWith('#')
        ? backgroundColor
        : `var(--${backgroundColor})`
      : undefined}};
  color: ${({ textColor }) =>
    textColor
      ? textColor.startsWith('#')
        ? textColor
        : `var(--${textColor})`
      : undefined};
  border-radius: ${({ borderRadius }) => borderRadius};
`;

interface BoxProps
  extends StyleProps,
    SpacingProperties,
    HTMLAttributes<HTMLDivElement> {
  as?: IntrinsicElementsKeys;
}

/**
 * Renders a box (container) element.
 * Usage:
 *   <Box> => <div>
 */
function Box(props: PropsWithChildren<BoxProps>) {
  const { className, ...rest } = props;
  return (
    <StyledBox
      as={props.as ?? 'div'}
      display={props.display ?? 'block'}
      flexDirection={props.flexDirection}
      alignItems={props.alignItems}
      justifyContent={props.justifyContent}
      gap={props.gap}
      flex={props.flex}
      backgroundColor={props.backgroundColor}
      textColor={props.textColor}
      borderRadius={props.borderRadius}
      className={`${className ?? ''} ${
        props.fontWeight ? `fr-text--${props.fontWeight}` : ''
      } ${spacingsToClasses(props)}`}
      {...rest}
    >
      {props.children}
    </StyledBox>
  );
}
export default Box;

const gridBreakpoints = {
  xs: '320',
  sm: '576',
  md: '768',
  lg: '992',
  xl: '1440',
};
type GridBreakpoint = keyof typeof gridBreakpoints;

/**
 * Renders a container that displays as row after the breakpoint and as a column before.
 */
export const ResponsiveRow = styled(Box)<{
  breakpoint?: GridBreakpoint;
  gap?: CSSProperties['gap'];
}>`
  display: flex;
  gap: ${({ gap }) => gap ?? '64px'};

  @media (max-width: ${({ breakpoint }) =>
      gridBreakpoints[breakpoint ?? 'lg']}px) {
    flex-direction: column;

    gap: 24px;
  }
`;
