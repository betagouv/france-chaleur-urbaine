// import { Icon as DSFRIcon } from '@codegouvfr/react-dsfr';
import { CSSProperties, HTMLAttributes } from 'react';
import { SpacingProperties, spacingsToClasses } from './helpers/spacings';
import styled from 'styled-components';

// type IconProps = ComponentProps<typeof DSFRIcon> & {
type IconProps = {
  cursor?: CSSProperties['cursor'];
  rotate?: boolean;
};

const StyledIcon = styled.span<IconProps>`
  transform: ${({ rotate }) => (rotate ? 'rotate(-180deg)' : undefined)};
  transition: 0.3s;
  cursor: ${({ cursor }) => cursor};
`;

/**
 * Renders an Icon with UI helpers and that can rotate.
 */
function Icon({
  className,
  ...props
}: IconProps & SpacingProperties & HTMLAttributes<HTMLDivElement>) {
  return (
    <StyledIcon
      className={`${className ?? ''} ${spacingsToClasses(props)}`}
      // iconPosition="center" // FIXME
      {...props}
    />
  );
}
export default Icon;
