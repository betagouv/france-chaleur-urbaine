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
  // dsfr size
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
      className={`${name ?? ''} ${size ? `fr-icon--${size}` : ''} ${
        className ?? ''
      } ${spacingsToClasses(props)}`}
      // iconPosition="center" // FIXME
      aria-hidden
      {...props}
    />
  );
}
export default Icon;
