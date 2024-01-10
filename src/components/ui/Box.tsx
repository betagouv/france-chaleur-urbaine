import { PropsWithChildren } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers';
import styled, { IntrinsicElementsKeys } from 'styled-components';

const StyledBox = styled.div<{ display: string }>`
  display: ${({ display }) => display};
`;

interface BoxProps extends SpacingProperties {
  as?: IntrinsicElementsKeys;
  display?: 'grid';
}

/**
 * Renders a box (container) element.
 * Usage:
 *   <Box> => <div>
 */
function Box(props: PropsWithChildren<BoxProps>) {
  return (
    <StyledBox
      as={props.as ?? 'div'}
      display={props.display ?? 'block'}
      className={`${spacingsToClasses(props)}`}
    >
      {props.children}
    </StyledBox>
  );
}
export default Box;
