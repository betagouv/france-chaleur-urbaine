import { type FrIconClassName, type RiIconClassName } from '@codegouvfr/react-dsfr';
import { type CSSProperties, forwardRef, type HTMLAttributes, type Ref } from 'react';
import styled from 'styled-components';

import { type SpacingProperties, spacingsToClasses } from './helpers/spacings';

type StyledIconProps = {
  cursor?: CSSProperties['cursor'];
  rotate?: number;
  color?: string;
};

const StyledIcon = styled.span<StyledIconProps>`
  transform: ${({ rotate }) => (rotate ? `rotate(${rotate}deg)` : undefined)};
  transition: 0.3s;
  cursor: ${({ cursor }) => cursor};
  color: ${({ color }) => color};
  line-height: 0;

  &:before {
    vertical-align: middle;
  }
`;

export type IconProps = StyledIconProps & {
  name: FrIconClassName | RiIconClassName;
  // dsfr size
  size?: 'xs' | 'sm' | 'md' | 'lg';
  // remix icons size
  riSize?: 'xs' | 'sm' | 'lg' | 'xl' | 'xxs' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
  className?: string;
};

/**
 * Renders an Icon with UI helpers and that can rotate.
 */
const Icon = forwardRef(function Icon(
  { name, size, riSize, className, ...props }: IconProps & SpacingProperties & HTMLAttributes<HTMLDivElement>,
  ref
) {
  return (
    <StyledIcon
      className={`${name ?? ''} ${size ? `fr-icon--${size}` : ''} ${riSize ? `ri-${riSize}` : ''} ${className ?? ''} ${spacingsToClasses(
        props
      )}`}
      aria-hidden
      ref={ref as Ref<HTMLSpanElement>}
      {...props}
    />
  );
});

// TODO moved here for refactor but should be replaced by a common icon
export const FCUArrowIcon = styled.div`
  width: 24px;
  height: 24px;

  &::before {
    content: '';
    width: 24px;
    height: 24px;
    display: block;
    background-image: url('/icons/picto-arrow.svg');
    background-size: 1em;
    font-size: 24px;
  }
`;

export default Icon;
