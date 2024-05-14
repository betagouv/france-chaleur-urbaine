// import { Icon as DSFRIcon } from '@codegouvfr/react-dsfr';
import { CSSProperties, HTMLAttributes } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers/spacings';
import styled from 'styled-components';
import { FrIconClassName, RiIconClassName } from '@codegouvfr/react-dsfr';

type StyledIconProps = {
  cursor?: CSSProperties['cursor'];
  rotate?: boolean;
  color?: string;
};

const StyledIcon = styled.span<StyledIconProps>`
  transform: ${({ rotate }) => (rotate ? 'rotate(-180deg)' : undefined)};
  transition: 0.3s;
  cursor: ${({ cursor }) => cursor};
  color: ${({ color }) => color};

  &:before {
    vertical-align: middle;
  }
`;

type IconProps = StyledIconProps & {
  name: FrIconClassName | RiIconClassName;
  // dsfr size
  size?: 'xs' | 'sm' | 'md' | 'lg';
  // remix icons size
  riSize?:
    | 'xs'
    | 'sm'
    | 'lg'
    | 'xl'
    | 'xxs'
    | '1x'
    | '2x'
    | '3x'
    | '4x'
    | '5x'
    | '6x'
    | '7x'
    | '8x'
    | '9x'
    | '10x';
};

/**
 * Renders an Icon with UI helpers and that can rotate.
 */
function Icon({
  name,
  size,
  riSize,
  className,
  ...props
}: IconProps & SpacingProperties & HTMLAttributes<HTMLDivElement>) {
  return (
    <StyledIcon
      className={`${name ?? ''} ${size ? `fr-icon--${size}` : ''} ${
        riSize ? `ri-${riSize}` : ''
      } ${className ?? ''} ${spacingsToClasses(props)}`}
      aria-hidden
      {...props}
    />
  );
}
export default Icon;
