import { type FrIconClassName, type RiIconClassName } from '@codegouvfr/react-dsfr';
import { type CSSProperties, type HTMLAttributes, type PropsWithChildren } from 'react';
import styled from 'styled-components';

import { type Breakpoint } from '@/components/Theme/theme';

import { type SpacingProperties, spacingsToClasses } from './helpers/spacings';

type StyleProps = {
  display?: CSSProperties['display'];
  flexDirection?: CSSProperties['flexDirection'];
  flexWrap?: CSSProperties['flexWrap'];
  flexGrow?: CSSProperties['flexGrow'];
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
  placeContent?: CSSProperties['placeContent'];
  gap?: CSSProperties['gap'];
  flex?: boolean;
  border?: CSSProperties['border'];
  borderLeft?: CSSProperties['borderLeft'];
  boxShadow?: CSSProperties['boxShadow'];
  backgroundColor?: CSSProperties['backgroundColor'];
  fontSize?: CSSProperties['fontSize'];
  textColor?: CSSProperties['color'];
  fontWeight?: 'light' | 'regular' | 'bold' | 'heavy';
  fontStyle?: CSSProperties['fontStyle'];
  textAlign?: CSSProperties['textAlign'];
  textWrap?: CSSProperties['textWrap'];
  position?: CSSProperties['position'];
  top?: CSSProperties['top'];
  right?: CSSProperties['right'];
  bottom?: CSSProperties['bottom'];
  left?: CSSProperties['left'];
  borderRadius?: CSSProperties['borderRadius'];
  width?: CSSProperties['width'];
  minWidth?: CSSProperties['minWidth'];
  maxWidth?: CSSProperties['maxWidth'];
  height?: CSSProperties['height'];
  minHeight?: CSSProperties['minHeight'];
  maxHeight?: CSSProperties['maxHeight'];
  lineHeight?: CSSProperties['lineHeight'];
  opacity?: CSSProperties['opacity'];
  gridTemplateColumns?: CSSProperties['gridTemplateColumns'];
  columnGap?: CSSProperties['columnGap'];
  cursor?: CSSProperties['cursor'];
  overflow?: CSSProperties['overflow'];
};

const StyledBox = styled.div<StyleProps>`
  display: ${({ display }) => display};
  flex-direction: ${({ flexDirection }) => flexDirection};
  flex-wrap: ${({ flexWrap }) => flexWrap};
  flex-grow: ${({ flexGrow }) => flexGrow};
  align-items: ${({ alignItems }) => alignItems};
  justify-content: ${({ justifyContent }) => justifyContent};
  place-content: ${({ placeContent }) => placeContent};
  gap: ${({ gap }) => gap};
  flex: ${({ flex }) => (flex !== undefined ? (flex ? 1 : 0) : undefined)};
  border: ${({ border }) => border};
  border-left: ${({ borderLeft }) => borderLeft};
  box-shadow: ${({ boxShadow }) => boxShadow};
  background-color: ${({ backgroundColor }) =>
    backgroundColor ? (backgroundColor?.startsWith('#') ? backgroundColor : `var(--${backgroundColor})`) : undefined};
  font-size: ${({ fontSize }) => fontSize};
  font-style: ${({ fontStyle }) => fontStyle};
  color: ${({ textColor }) => (textColor ? (textColor.startsWith('#') ? textColor : `var(--${textColor})`) : undefined)};
  text-align: ${({ textAlign }) => textAlign};
  text-wrap: ${({ textWrap }) => textWrap};
  position: ${({ position }) => position};
  top: ${({ top }) => top};
  right: ${({ right }) => right};
  bottom: ${({ bottom }) => bottom};
  left: ${({ left }) => left};
  border-radius: ${({ borderRadius }) => borderRadius};
  width: ${({ width }) => width};
  min-width: ${({ minWidth }) => minWidth};
  max-width: ${({ maxWidth }) => maxWidth};
  height: ${({ height }) => height};
  min-height: ${({ minHeight }) => minHeight};
  max-height: ${({ maxHeight }) => maxHeight};
  line-height: ${({ lineHeight }) => lineHeight};
  opacity: ${({ opacity }) => opacity};
  grid-template-columns: ${({ gridTemplateColumns }) => gridTemplateColumns};
  column-gap: ${({ columnGap }) => columnGap};
  cursor: ${({ cursor }) => cursor};
  overflow: ${({ overflow }) => overflow};
  :
`;

export interface BoxProps extends StyleProps, SpacingProperties, HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  iconLeft?: FrIconClassName | RiIconClassName;
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
      display={props.display}
      flexDirection={props.flexDirection}
      flexWrap={props.flexWrap}
      flexGrow={props.flexGrow}
      alignItems={props.alignItems}
      justifyContent={props.justifyContent}
      placeContent={props.placeContent}
      gap={props.gap}
      flex={props.flex}
      border={props.border}
      borderLeft={props.borderLeft}
      boxShadow={props.boxShadow}
      backgroundColor={props.backgroundColor}
      fontSize={props.fontSize}
      fontStyle={props.fontStyle}
      textColor={props.textColor}
      textAlign={props.textAlign}
      textWrap={props.textWrap}
      position={props.position}
      top={props.top}
      right={props.right}
      bottom={props.bottom}
      left={props.left}
      borderRadius={props.borderRadius}
      width={props.width}
      minWidth={props.minWidth}
      maxWidth={props.maxWidth}
      height={props.height}
      minHeight={props.minHeight}
      maxHeight={props.maxHeight}
      lineHeight={props.lineHeight}
      opacity={props.opacity}
      gridTemplateColumns={props.gridTemplateColumns}
      columnGap={props.columnGap}
      cursor={props.cursor}
      overflow={props.overflow}
      className={`${className ?? ''} ${props.fontWeight ? `fr-text--${props.fontWeight}` : ''} ${props.iconLeft ?? ''} ${spacingsToClasses(
        props
      )}`}
      {...rest}
    >
      {props.children}
    </StyledBox>
  );
}
export default Box;

/**
 * Renders a container that displays as row after the breakpoint and as a column before.
 */
export const ResponsiveRow = styled(Box)<{
  breakpoint?: Breakpoint;
  gap?: CSSProperties['gap'];
}>`
  display: flex;
  gap: 24px;
  flex-direction: column;
  ${({ theme, breakpoint, gap }) => theme.media[breakpoint ?? 'lg']`
    flex-direction: row;
    gap: ${gap ?? '64px'};
  `}
`;
