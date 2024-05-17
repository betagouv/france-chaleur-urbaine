import { CSSProperties, HTMLAttributes, PropsWithChildren } from 'react';
import styled, { IntrinsicElementsKeys } from 'styled-components';
import { SpacingProperties, spacingsToClasses } from './helpers/spacings';

type StyleProps = {
  display?: CSSProperties['display'];
  flexDirection?: CSSProperties['flexDirection'];
  flexWrap?: CSSProperties['flexWrap'];
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
  placeContent?: CSSProperties['placeContent'];
  gap?: CSSProperties['gap'];
  flex?: boolean;
  border?: CSSProperties['border'];
  boxShadow?: CSSProperties['boxShadow'];
  backgroundColor?: CSSProperties['backgroundColor'];
  fontSize?: CSSProperties['fontSize'];
  textColor?: CSSProperties['color'];
  fontWeight?: 'light' | 'regular' | 'bold' | 'heavy';
  textAlign?: CSSProperties['textAlign'];
  position?: CSSProperties['position'];
  borderRadius?: CSSProperties['borderRadius'];
  width?: CSSProperties['width'];
  minWidth?: CSSProperties['minWidth'];
  maxWidth?: CSSProperties['maxWidth'];
  height?: CSSProperties['height'];
  minHeight?: CSSProperties['minHeight'];
  maxHeight?: CSSProperties['maxHeight'];
  opacity?: CSSProperties['opacity'];
};

const StyledBox = styled.div<StyleProps>`
  display: ${({ display }) => display};
  flex-direction: ${({ flexDirection }) => flexDirection};
  flex-wrap: ${({ flexWrap }) => flexWrap};
  align-items: ${({ alignItems }) => alignItems};
  justify-content: ${({ justifyContent }) => justifyContent};
  place-content: ${({ placeContent }) => placeContent};
  gap: ${({ gap }) => gap};
  flex: ${({ flex }) => (flex !== undefined ? (flex ? 1 : 0) : undefined)};
  border: ${({ border }) => border};
  box-shadow: ${({ boxShadow }) => boxShadow};
  background-color: ${({ backgroundColor }) =>
    backgroundColor
      ? backgroundColor?.startsWith('#')
        ? backgroundColor
        : `var(--${backgroundColor})`
      : undefined}};
  font-size: ${({ fontSize }) => fontSize};
  color: ${({ textColor }) =>
    textColor
      ? textColor.startsWith('#')
        ? textColor
        : `var(--${textColor})`
      : undefined};
  text-align: ${({ textAlign }) => textAlign};
  position: ${({ position }) => position};
  border-radius: ${({ borderRadius }) => borderRadius};
  width: ${({ width }) => width};
  min-width: ${({ minWidth }) => minWidth};
  max-width: ${({ maxWidth }) => maxWidth};
  height: ${({ height }) => height};
  min-height: ${({ minHeight }) => minHeight};
  max-height: ${({ maxHeight }) => maxHeight};
  opacity: ${({ opacity }) => opacity};
`;

export interface BoxProps
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
      flexWrap={props.flexWrap}
      alignItems={props.alignItems}
      justifyContent={props.justifyContent}
      placeContent={props.placeContent}
      gap={props.gap}
      flex={props.flex}
      border={props.border}
      boxShadow={props.boxShadow}
      backgroundColor={props.backgroundColor}
      fontSize={props.fontSize}
      textColor={props.textColor}
      textAlign={props.textAlign}
      position={props.position}
      borderRadius={props.borderRadius}
      width={props.width}
      minWidth={props.minWidth}
      maxWidth={props.maxWidth}
      height={props.height}
      minHeight={props.minHeight}
      maxHeight={props.maxHeight}
      opacity={props.opacity}
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
