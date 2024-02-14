import { CSSProperties, HTMLAttributes, PropsWithChildren } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers';
import styled, { IntrinsicElementsKeys } from 'styled-components';

type StyleProps = {
  display?: CSSProperties['display'];
  flexDirection?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  gap?: CSSProperties['gap'];
  backgroundColor?: CSSProperties['backgroundColor'];
  textColor?: CSSProperties['color'];
  fontWeight?: 'light' | 'regular' | 'bold' | 'heavy';
  borderRadius?: CSSProperties['borderRadius'];
};

const StyledBox = styled.div<StyleProps>`
  display: ${({ display }) => display};
  flex-direction: ${({ flexDirection: direction }) => direction};
  align-items: ${({ alignItems }) => alignItems};
  gap: ${({ gap }) => gap};
  background-color: ${({ backgroundColor }) =>
    backgroundColor?.startsWith('#')
      ? backgroundColor
      : `var(--${backgroundColor})`};
  color: ${({ textColor }) =>
    textColor?.startsWith('#') ? textColor : `var(--${textColor})`};
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
      flexDirection={props.flexDirection ?? 'row'}
      alignItems={props.alignItems ?? 'initial'}
      gap={props.gap ?? 'initial'}
      backgroundColor={props.backgroundColor ?? 'initial'}
      textColor={props.textColor ?? 'initial'}
      borderRadius={props.borderRadius ?? 'initial'}
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
