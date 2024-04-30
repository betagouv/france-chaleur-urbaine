// import { Icon as DSFRIcon } from '@codegouvfr/react-dsfr';
import { CSSProperties, HTMLAttributes } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers/spacings';
import styled from 'styled-components';
import { FrIconClassName, RiIconClassName } from '@codegouvfr/react-dsfr';

type StyledIconProps = {
  cursor?: CSSProperties['cursor'];
  rotate?: boolean;
};

const StyledIcon = styled.span<StyledIconProps>`
  transform: ${({ rotate }) => (rotate ? 'rotate(-180deg)' : undefined)};
  transition: 0.3s;
  cursor: ${({ cursor }) => cursor};
`;

type IconProps = StyledIconProps & {
  name: FrIconClassName | RiIconClassName;
  size: '1x' | '2x' | 'lg'; // FIXME se caler sur framework dsfr
};

/**
 * Renders an Icon with UI helpers and that can rotate.
 */
function Icon({
  name,
  size,
  className,
  ...props
}: IconProps & SpacingProperties & HTMLAttributes<HTMLDivElement>) {
  return (
    <StyledIcon
      className={`${name ?? ''} ${size ? `ri-${size}` : ''} ${
        className ?? ''
      } ${spacingsToClasses(props)}`}
      // iconPosition="center" // FIXME
      {...props}
    />
  );
}
export default Icon;
